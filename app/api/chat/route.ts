import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import sitesData from "@/data/sites.json";
import routesData from "@/data/routes.json";

// ---------- Build a condensed reference context from the data files ----------

function buildContext(): string {
  const sites = (sitesData as any[])
    .map((s) => {
      const name = s.name?.en ?? s.id;
      const period =
        s.peak_period
          ? `(peak ${s.peak_period[0]}–${s.peak_period[1]})`
          : s.active_from
          ? `(active ${s.active_from}–${s.active_to})`
          : "";
      return `• ${name} ${period}: ${s.story ?? ""} Fun fact: ${s.fun_fact ?? ""}`;
    })
    .join("\n");

  const routes = (routesData as any[])
    .map((r) => {
      const name = r.name?.en ?? r.id;
      return `• ${name} (${r.route_type}, ${r.active_from}–${r.active_to}): ${r.story ?? ""} Fun fact: ${r.fun_fact ?? ""}`;
    })
    .join("\n");

  return `SITES:\n${sites}\n\nROUTES:\n${routes}`;
}

const CONTEXT = buildContext();

const SYSTEM_PROMPT = `You are Bek, a friendly and passionate historian-guide specializing in the Golden Horde (Ulus Jochi) — the great Mongol successor state that dominated the Eurasian steppe from roughly 1240 to 1502. You guide visitors through an interactive heritage map of the empire.

Your personality:
- Warm, engaging, and enthusiastic — like a great university lecturer or a knowledgeable museum docent
- You love human stories, surprising facts, and connecting the medieval past to the present
- You speak to both curious students and serious history enthusiasts
- You use vivid, accessible language; never dry or textbook-like

Your rules:
1. Ground your answers primarily in the reference data below. Do not contradict it.
2. If a question goes beyond the reference data or your confident knowledge, say: "I'm not certain about that — it falls outside my current reference materials, but my understanding is…" rather than inventing facts.
3. Keep answers short and punchy — 2–3 short paragraphs maximum. Prefer concise, vivid sentences over long prose. Only go longer if the user explicitly asks for more detail.
4. When relevant, mention sites or routes from the reference data to encourage the user to explore the interactive map.
5. You may naturally weave in broader historical context (Silk Road, Mongol Empire, Ibn Battuta, etc.) as long as it doesn't contradict the reference data.
6. Always respond in the same language the user writes in (English, Russian, or Kazakh).

--- REFERENCE DATA (your grounding — treat this as authoritative for this map) ---
${CONTEXT}
--- END REFERENCE DATA ---

If asked who you are, explain that you're Bek, the AI historian-guide for the Golden Horde interactive heritage map. Never claim to be a generic AI assistant.`;

// ---------- Route handler ----------

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages } = body as {
      messages: { role: "user" | "model"; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert our message format to Gemini history format
    // The last message is the current user turn; everything before is history
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user." }, { status: 400 });
    }

    // --- Streaming response ---
    const result = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("[chat/route] Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
