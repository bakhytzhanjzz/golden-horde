"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIONS_RE, type MapAction } from "@/lib/mapActions";
import { useStrings } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  streaming?: boolean;
}

interface ChatBotProps {
  /** Current timeline year, forwarded to the model as map context. */
  year?: number;
  /** Name of the site/route currently open, forwarded as map context. */
  selectedName?: string | null;
  /** Applies map actions Bek requests via function-calling. */
  onAction?: (actions: MapAction[]) => void;
}

// Strips the actions marker (complete or still-streaming) from displayed text.
function stripActions(text: string): string {
  return text
    .replace(ACTIONS_RE, "")
    .replace(/\[\[GH_ACTIONS\]\][\s\S]*$/, "")
    .replace(/^\s+/, "");
}

// ─── ChatBot Component ─────────────────────────────────────────────────────────

export default function ChatBot({ year, selectedName, onAction }: ChatBotProps = {}) {
  const t = useStrings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        abortRef.current?.abort();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: "welcome", role: "model", content: t.chatWelcome }]);
    }
  }, [open, messages.length, t]);

  // Keep the greeting in sync with the active language until the user replies.
  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].id === "welcome"
        ? [{ ...prev[0], content: t.chatWelcome }]
        : prev
    );
  }, [t]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
      };

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "model",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setLoading(true);

      // Build payload — exclude the welcome message and streaming placeholder
      const history = [...messages, userMsg]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            mapContext: { year, selected: selectedName ?? null },
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: `⚠️ ${err.error ?? "Request failed"}`, streaming: false }
                : m
            )
          );
          return;
        }

        // Read the streaming plain-text response. It may carry a leading
        // actions block (from Bek's map function-call) which we extract and
        // apply once, then strip from what we display.
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let actionsApplied = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          if (!actionsApplied) {
            const m = ACTIONS_RE.exec(accumulated);
            if (m) {
              actionsApplied = true;
              try {
                const acts = JSON.parse(m[1]) as MapAction[];
                if (Array.isArray(acts) && acts.length) {
                  onAction?.(acts);
                  // If Bek opened a site/route card, step out of the way so the
                  // user can see the map and the card behind the chat.
                  if (acts.some((a) => a.siteId || a.routeId)) setOpen(false);
                }
              } catch {
                /* ignore malformed action payloads */
              }
            }
          }

          const snap = stripActions(accumulated);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: snap } : m
            )
          );
        }

      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: "⚠️ Something went wrong. Please try again.", streaming: false }
                : m
            )
          );
        }
      } finally {
        // Stop the blinking cursor whether we finished, errored, or were stopped.
        setMessages((prev) =>
          prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
        );
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading, messages, year, selectedName, onAction]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating chat button ── */}
      <button
        id="chat-open-btn"
        aria-label="Open AI historian chat"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "88px",
          right: "20px",
          zIndex: 600,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #c8963e 0%, #8b5e1a 100%)",
          boxShadow: "0 4px 20px rgba(139,94,26,0.55), 0 0 0 0 rgba(200,150,62,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
          animation: open ? "none" : "gh-chat-pulse 2.4s ease-in-out infinite",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        📜
      </button>

      {/* ── Sidebar overlay ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Historian Chat"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 700,
          pointerEvents: open ? "all" : "none",
        }}
      >
        {/* Backdrop */}
        <div
          onClick={handleClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(30,20,8,0.45)",
            backdropFilter: "blur(2px)",
            opacity: open ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />

        {/* Sidebar panel */}
        <aside
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(400px, 100vw)",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(180deg, #2a1f0f 0%, #1e1508 100%)",
            borderLeft: "1px solid rgba(200,150,62,0.25)",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
            transform: open ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "18px 20px 14px",
              borderBottom: "1px solid rgba(200,150,62,0.2)",
              background: "rgba(200,150,62,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8963e, #8b5e1a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              🏺
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#f4d98a", fontWeight: 700, fontSize: "15px", lineHeight: 1.2 }}>
                {t.chatName}
              </div>
              <div style={{ color: "#9b8060", fontSize: "12px" }}>
                {t.chatRole}
              </div>
            </div>
            <button
              id="chat-close-btn"
              aria-label="Close chat"
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9b8060",
                fontSize: "20px",
                padding: "4px",
                lineHeight: 1,
                borderRadius: "4px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#f4d98a")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9b8060")}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            id="chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(200,150,62,0.3) transparent",
            }}
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Suggested prompts — show only when there's just the welcome message */}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                <p style={{ color: "#9b8060", fontSize: "12px", margin: 0 }}>{t.chatTryAsking}</p>
                {t.chatSuggested.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{
                      background: "rgba(200,150,62,0.1)",
                      border: "1px solid rgba(200,150,62,0.2)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#d4b06a",
                      fontSize: "13px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(200,150,62,0.2)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(200,150,62,0.45)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(200,150,62,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(200,150,62,0.2)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              padding: "14px 16px",
              borderTop: "1px solid rgba(200,150,62,0.2)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-end",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(200,150,62,0.2)",
                borderRadius: "12px",
                padding: "10px 12px",
                transition: "border-color 0.15s",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(200,150,62,0.55)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(200,150,62,0.2)";
              }}
            >
              <textarea
                ref={inputRef}
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.chatPlaceholder}
                rows={1}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#f4ecd8",
                  fontSize: "14px",
                  resize: "none",
                  lineHeight: "1.5",
                  maxHeight: "120px",
                  overflowY: "auto",
                  fontFamily: "inherit",
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
              <button
                id="chat-send-btn"
                aria-label={loading ? "Stop generating" : "Send message"}
                onClick={() => (loading ? stopGeneration() : sendMessage(input))}
                disabled={!loading && !input.trim()}
                style={{
                  background: loading
                    ? "linear-gradient(135deg, #a3502e, #7a2f1a)"
                    : !input.trim()
                    ? "rgba(200,150,62,0.25)"
                    : "linear-gradient(135deg, #c8963e, #8b5e1a)",
                  border: "none",
                  borderRadius: "8px",
                  width: "34px",
                  height: "34px",
                  cursor: !loading && !input.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: loading ? "13px" : "16px",
                  color: "#f4ecd8",
                  flexShrink: 0,
                  transition: "background 0.15s, transform 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (loading || input.trim())
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                }}
              >
                {loading ? "■" : "➤"}
              </button>
            </div>
            <p
              style={{
                color: "#6b5038",
                fontSize: "11px",
                margin: "6px 0 0",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {t.chatDisclaimer}
              <br />
              {t.chatFooter}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

// ─── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  // Parse inline markdown within a single line: bold, italic, inline code.
  function renderInline(line: string): React.ReactNode[] {
    const segments: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        segments.push(line.slice(lastIndex, match.index));
      }
      if (match[2]) {
        segments.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        segments.push(<em key={match.index}>{match[3]}</em>);
      } else if (match[4]) {
        segments.push(
          <code
            key={match.index}
            style={{
              background: "rgba(200,150,62,0.15)",
              borderRadius: "3px",
              padding: "0 4px",
              fontSize: "12px",
            }}
          >
            {match[4]}
          </code>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) segments.push(line.slice(lastIndex));
    return segments;
  }

  // Block-level renderer: groups "- "/"* " runs into bullet lists, keeps blank
  // lines as paragraph spacing, everything else as its own line.
  function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split("\n");
    const blocks: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = (key: string) => {
      if (listItems.length) {
        blocks.push(
          <ul key={`ul-${key}`} style={{ margin: "4px 0", paddingLeft: "18px" }}>
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, li) => {
      const bullet = /^\s*[-*]\s+(.*)/.exec(line);
      if (bullet) {
        listItems.push(
          <li key={li} style={{ marginBottom: "2px" }}>
            {renderInline(bullet[1])}
          </li>
        );
      } else {
        flushList(String(li));
        if (line.trim() === "") {
          blocks.push(<div key={`sp-${li}`} style={{ height: "6px" }} />);
        } else {
          blocks.push(<div key={li}>{renderInline(line)}</div>);
        }
      }
    });
    flushList("end");
    return blocks;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: "8px",
        alignItems: "flex-start",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #c8963e, #8b5e1a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          🏺
        </div>
      )}

      <div
        style={{
          maxWidth: "85%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, rgba(200,150,62,0.25), rgba(139,94,26,0.35))"
            : "rgba(255,255,255,0.05)",
          border: isUser
            ? "1px solid rgba(200,150,62,0.35)"
            : "1px solid rgba(255,255,255,0.08)",
          color: "#f4ecd8",
          fontSize: "14px",
          lineHeight: "1.6",
          wordBreak: "break-word",
          position: "relative",
        }}
      >
        {msg.content ? renderMarkdown(msg.content) : null}
        {msg.streaming && (
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "14px",
              background: "#c8963e",
              marginLeft: "3px",
              borderRadius: "2px",
              verticalAlign: "text-bottom",
              animation: "gh-blink 0.8s step-end infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}
