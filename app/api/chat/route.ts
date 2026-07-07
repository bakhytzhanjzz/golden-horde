import { GoogleGenerativeAI, SchemaType, type Tool } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import sitesData from "@/data/sites.json";
import routesData from "@/data/routes.json";
import { ACTIONS_CLOSE, ACTIONS_OPEN } from "@/lib/mapActions";

// ---------- Build a condensed reference context from the data files ----------

function buildContext(): string {
  const sites = (sitesData as any[])
    .map((s) => {
      const name = s.name?.en ?? s.id;
      const type = s.type ?? "site";
      // Life-span line: battles are single-year events; places have a range.
      const years =
        s.type === "battle"
          ? `${s.founded}`
          : `${s.founded ?? "?"}–${s.destroyed ?? "still standing"}`;
      const peak = s.peak_period
        ? ` peak ${s.peak_period[0]}–${s.peak_period[1]};`
        : "";
      const combatants = s.sides
        ? ` Combatants: ${s.sides.attacker} vs ${s.sides.defender}.`
        : "";
      return `• ${name} [${type}, ${years};${peak}]:${combatants} ${s.story ?? ""} Fun fact: ${s.fun_fact ?? ""}`;
    })
    .join("\n");

  const routes = (routesData as any[])
    .map((r) => {
      const name = r.name?.en ?? r.id;
      return `• ${name} (${r.route_type} route, active ${r.active_from}–${r.active_to}): ${r.story ?? ""} Fun fact: ${r.fun_fact ?? ""}`;
    })
    .join("\n");

  return `SITES & BATTLES:\n${sites}\n\nROUTES:\n${routes}`;
}

const EMPIRE_OVERVIEW = `THE GOLDEN HORDE IN BRIEF (for your grounding):
The Golden Horde (Ulus Jochi) was the northwestern part of the Mongol Empire, founded after Batu Khan's western campaigns (1236–1242) and lasting until 1502. At its peak under khans like Ozbeg (r. 1313–1341) and Jani Beg it controlled the western Eurasian steppe from the Danube to western Siberia, adopting Islam as its state religion under Ozbeg (1314). Its capitals sat on the lower Volga (Sarai, New Sarai). It grew rich taxing the Volga and Silk Road trade and running the yam postal relay. It fractured during the 14th-century "Great Troubles," was shattered militarily by Timur (Tamerlane) in 1391 and 1395, and finally ended when the Crimean Khanate sacked Sarai in 1502. A key theme of this project: its heritage sites are today scattered across Kazakhstan, Russia, Ukraine, Uzbekistan, and beyond — one connected civilization now split by modern borders.`;

const CONTEXT = buildContext();

// A compact id→name index so the model can map a place/route name the user says
// to the exact id it must pass to control_map.
function buildIdIndex(): string {
  const sites = (sitesData as any[])
    .map((s) => `${s.id} = ${s.name?.en ?? s.id}`)
    .join("; ");
  const routes = (routesData as any[])
    .map((r) => `${r.id} = ${r.name?.en ?? r.id}`)
    .join("; ");
  return `SITE IDS: ${sites}\nROUTE IDS: ${routes}`;
}

const ID_INDEX = buildIdIndex();

// Function-calling tool: lets Bek drive the interactive map. Cast through
// unknown because the SDK's Schema union mis-infers our nested property types.
const MAP_TOOL = {
  functionDeclarations: [
    {
      name: "control_map",
      description:
        "Drive the interactive Golden Horde map to show the user what you are describing. Call this whenever the user asks to see, show, go to, open, jump to, or navigate to a place, battle, route, khan's era, or year — and also proactively when showing something would clearly help your answer. Fill only the fields the request implies.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          year: {
            type: SchemaType.NUMBER,
            description:
              "Set the timeline to this year (integer 1206–1502). Use the year most relevant to what you're describing.",
          },
          siteId: {
            type: SchemaType.STRING,
            description:
              "Open this city/site/battle. MUST be one of the exact SITE IDS listed in the system prompt.",
          },
          routeId: {
            type: SchemaType.STRING,
            description:
              "Open this route. MUST be one of the exact ROUTE IDS listed in the system prompt.",
          },
          mode: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["sites", "routes"],
            description: "Switch the map layer to sites or routes.",
          },
          modern: {
            type: SchemaType.BOOLEAN,
            description:
              "Set true to overlay present-day country borders (to contrast the empire with today), false to hide them.",
          },
        },
      },
    },
  ],
} as unknown as Tool;

const TOOL_INSTRUCTIONS = `\n\n--- MAP CONTROL ---
You can control the map the user is looking at by calling the control_map function. Guidelines:
- When the user asks to see/show/open/go to a place, battle, route, or time, call control_map with the right fields, then give a short spoken reply as if you just showed it ("Here's Otrar in 1219 — ...").
- To show a place at a specific moment, pass BOTH siteId and year (e.g. the Otrar massacre → siteId "otrar", year 1219).
- Use the exact ids from the index below; never invent an id. If the user names something not in the index, don't call the function — just answer.
- For routes, set mode "routes" and pass routeId.
- Keep doing your normal historian job; the map control is an enhancement, not a replacement for a good answer.
${ID_INDEX}
--- END MAP CONTROL ---`;

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
7. Use light Markdown when it helps: **bold** for names/dates, and "- " bullet lists for enumerations. Keep it minimal.

${EMPIRE_OVERVIEW}

--- REFERENCE DATA (your grounding — treat this as authoritative for this map) ---
${CONTEXT}
--- END REFERENCE DATA ---

If asked who you are, explain that you're Bek, the AI historian-guide for the Golden Horde interactive heritage map. Never claim to be a generic AI assistant.`;

/**
 * A short, per-request note telling Bek what the user is currently looking at
 * on the map, so answers can reference the on-screen context.
 */
function buildMapContextNote(mapContext?: {
  year?: number;
  selected?: string | null;
}): string {
  if (!mapContext) return "";
  const bits: string[] = [];
  if (typeof mapContext.year === "number") {
    bits.push(`The user is currently viewing the map at the year ${mapContext.year}.`);
  }
  if (mapContext.selected) {
    bits.push(`They currently have "${mapContext.selected}" open on the map.`);
  }
  if (bits.length === 0) return "";
  return `\n\nCURRENT MAP CONTEXT (use it to tailor your answer when natural, but don't force it):\n${bits.join(
    " "
  )}`;
}

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
    const { messages, mapContext } = body as {
      messages: { role: "user" | "model"; content: string }[];
      mapContext?: { year?: number; selected?: string | null };
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        SYSTEM_PROMPT + TOOL_INSTRUCTIONS + buildMapContextNote(mapContext),
      tools: [MAP_TOOL],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 800,
      },
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

    // --- Streaming response, with optional map function-calls ---
    // Phase 1 streams the model's reply. If it instead (or also) asks to control
    // the map, we emit the actions inline, then run phase 2 to stream the
    // narrated reply that follows the tool call.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const pump = async (
          streamResult: Awaited<ReturnType<typeof chat.sendMessageStream>>
        ) => {
          for await (const chunk of streamResult.stream) {
            // A chunk that carries a functionCall throws on .text(); guard it.
            let text = "";
            try {
              text = chunk.text();
            } catch {
              text = "";
            }
            if (text) controller.enqueue(encoder.encode(text));
          }
          return streamResult.response;
        };

        try {
          const first = await chat.sendMessageStream(lastMessage.content);
          const firstResponse = await pump(first);

          const calls = firstResponse.functionCalls?.() ?? [];
          const mapCalls = calls.filter((c) => c.name === "control_map");

          if (mapCalls.length > 0) {
            const actions = mapCalls.map((c) => c.args);
            controller.enqueue(
              encoder.encode(
                `\n${ACTIONS_OPEN}${JSON.stringify(actions)}${ACTIONS_CLOSE}`
              )
            );

            // Acknowledge the tool call so the model narrates a spoken reply.
            const followUp = await chat.sendMessageStream(
              calls.map((c) => ({
                functionResponse: { name: c.name, response: { ok: true } },
              }))
            );
            await pump(followUp);
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
