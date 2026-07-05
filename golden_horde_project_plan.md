
## Full Project Plan & Claude Code Development Context



## 1. Problem Statement

Two concrete problems, both solved through the same core product:

**Problem 1 — Fragmentation across borders.**
Golden Horde heritage sites (Saraishyk, Sygnak, Ulytau, Otrar, Saray-Batu, Saray-Berke, Bolgar, etc.) are scattered across the modern borders of Kazakhstan, Russia, Uzbekistan, Ukraine, and Mongolia. Because they sit in different countries and different national curricula/tourism boards, there is no single place that shows them as what they actually were: one connected political and economic system. Researchers, students, and travelers experience the Horde as disconnected trivia, not as a civilization.

**Problem 2 — Disengagement of youth.**
The Golden Horde is taught as a list of khans, dates, and battles. It has no interactive or visual hook the way game-based or film-based history does for other periods. Students memorize for exams and forget within a year.

**The solution:** a web app with an interactive time-based map that visually reconnects the empire (borders, cities, and routes changing over a timeline) and turns each site/route/battle into a clickable, story-driven, quiz-able object — making the connectedness of the empire and the human stories behind it both *visible* and *playable*.

---

## 2. Core Features

### 2.1 The Base Map
A map of Eurasia (roughly Eastern Europe to Western Siberia/Mongolia) rendered with a web mapping library, styled to look historical/parchment-like rather than a modern road map (see Section 6, tech stack).

### 2.2 Timeline Slider (the centerpiece)
A horizontal slider spanning roughly **1206 (Mongol Empire founding) → 1502 (fall of the Great Horde)**, with meaningful snapped points (e.g. 1224, 1240, 1266, 1313, 1357, 1395, 1420, 1460, 1502 — moments of founding, peak, fragmentation, fall). Dragging it:
- Redraws the empire's **border polygon** for that year (or nearest available snapshot, cross-faded).
- Shows/hides **cities** based on their founded/destroyed year (a city not yet founded, or already destroyed by that year, disappears or appears grayed-out/"in ruins").
- Redraws **active trade & campaign routes** for that period (see 2.3).
- Updates a small side panel: "Year 1357 — Reign of Jani Beg. Capital: Saray al-Jadid. Empire at its economic peak, controlling the Volga trade route..."

This single interaction is your strongest demo moment because it visually proves Problem 1 (this was one connected, evolving system) without a single line of text.

**Implementation approach:** you do NOT need live boundary computation. Pre-bake border GeoJSON snapshots for ~8-10 key years (using the historical-basemaps dataset, see Section 5), and cross-fade/opacity-tween between the nearest two snapshots as the slider moves. This is much cheaper to build than a "true" continuous simulation and looks just as convincing.

### 2.3 Routes Layer (toggle, tied to the timeline — not a separate redundant map)
A toggle button switches the map's overlay between:
- **Sites mode** (default): cities/battle sites as pins.
- **Routes mode**: polylines showing trade routes (the Volga route, the Silk Road spurs through Sygnak/Otrar), the **yam** postal/relay system, and major military campaign paths (e.g. Batu's invasion route into Europe, 1236-1242).

Routes should also respect the timeline slider — a route that dried up after a city's destruction should fade out at that year. This reinforces the same story as the border animation and avoids feeling like a bolted-on second map.

Practically: store each route as a GeoJSON LineString with `active_from` / `active_to` years, style differently by `route_type` (trade / military / postal), and filter/opacity by current slider year — same filtering logic as for cities, just applied to a different layer.

### 2.4 Pressable Points — Cities, Routes, and Battle Sites
Every marker on the map (city, battle site) and every route line is clickable. On click, an info panel/modal opens with:
- **Name** (in Kazakh/Russian/English toggle if you have time)
- **Short story** (2-4 sentences, human/narrative tone, not textbook-dry — "Here, in 1391, Tokhtamysh's army met Tamerlane's in one of the largest battles of the medieval world...")
- **Key dates** (founded, major events, destroyed/abandoned)
- **Image or reconstructed illustration** if available (even a single period-appropriate illustration or archaeological photo raises perceived quality a lot)
- **"Did you know?"** — one surprising fact, good for social shareability
- **A small interactive element** (see 2.5) — this is what turns a wiki-entry into something a teenager will actually engage with

For battle sites specifically, consider a lightweight interactive element: a simple "which side had which advantage" mini breakdown, or a 2-3 step animated arrow showing troop movement — doesn't need to be a full simulation, just visually more than a paragraph of text.

### 2.5 Interactive/gamified elements per site (addressing youth disengagement directly)
Pick 1-2 of these, don't try to build all of them for a prototype:
- **Micro-quiz**: after reading a site's card, one multiple-choice question ("Who founded this city?"). Right answers add points to a running score — turns "browsing a map" into "completing a quest."
- **"Then vs Now" image slider**: if you can find or generate one period illustration + one modern photo of the ruins, a draggable before/after slider is cheap to build (pure CSS/JS) and very shareable.
- **Timeline mini-badge system**: visiting (clicking) all cities of a particular khan's reign unlocks a badge. Gives youth a reason to explore the whole map instead of one pin.

### 2.6 AI Historian Chatbot
A chat panel (floating button, opens a sidebar) where a user can ask free-form questions: "Why did the Golden Horde fall apart?", "Who was Jani Beg?", "What is Saraishyk today?" The bot should be **grounded in your own site/route dataset** (fed as context or lightly-RAG'd) rather than answering purely from the underlying model's general knowledge, so its answers stay consistent with what's on your map and don't contradict your own content. See Section 7 for the concrete implementation plan.

### 2.7 (Stretch goal, only if time allows) Route-planner / "Golden Horde Trail"
A simple form: pick a region + number of days → get a suggested real-world visiting order of surviving sites/museums. This is what would eventually make the project monetizable (tourism angle) but is **not required for the hackathon core** — mention it in the pitch as "roadmap," don't build it now.

---

## 3. Data Model (what Claude Code needs to build against)

Keep it as flat JSON/GeoJSON files for a prototype — no real database needed yet.

### `sites.json`
```json
[
  {
    "id": "saraishyk",
    "name": { "en": "Saraishyk", "kz": "Сарайшық", "ru": "Сарайчик" },
    "type": "city",
    "lat": 47.05, "lng": 51.75,
    "founded": 1242,
    "destroyed": 1580,
    "peak_period": [1300, 1450],
    "story": "A major trade and administrative center on the Ural (Zhaiyk) river...",
    "fun_fact": "...",
    "image": "/images/sites/saraishyk.jpg",
    "quiz": { "question": "...", "options": ["...","...","..."], "answer": 0 }
  }
]
```

### `routes.json`
```json
[
  {
    "id": "volga-trade-route",
    "name": { "en": "Volga Trade Route" },
    "route_type": "trade",
    "path": [[47.05, 51.75], [48.7, 44.5], [51.5, 46.0]],
    "active_from": 1240,
    "active_to": 1502,
    "story": "Connected the Baltic and Northern European trade..."
  }
]
```

### `borders/{year}.geojson`
One polygon FeatureCollection per snapshot year (1224, 1240, 1266, 1313, 1357, 1395, 1420, 1460, 1502) — sourced from the historical-basemaps repo (Section 5) and trimmed/adjusted.

### `battles.json`
Same shape as sites, `type: "battle"`, plus optional `sides` field (e.g. `{"attacker": "Golden Horde", "defender": "..."}`) for the interactive breakdown in 2.4.

---

## 4. Tech Stack Recommendation

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | You already know it; server API routes let you hide AI keys safely; easy deploy to Vercel for free |
| Map | **react-leaflet (Leaflet.js)** with a custom/parchment-style tile layer, OR **Mapbox GL JS** if you want smoother animated transitions | Leaflet = simpler, free, no API key needed for basic tiles. Mapbox = nicer look, animated camera moves, but needs a free API key and has usage limits |
| Styling | Tailwind CSS | fast to build a clean UI under time pressure |
| State | React state / Zustand if it grows | timeline year, active layer (sites/routes), selected site are really the only global state you need |
| AI | Gemini API (primary) or Groq (speed fallback) via a Next.js API route | see Section 7 |
| Hosting | Vercel (free tier) | zero-config Next.js deploys |
| Data | Static JSON/GeoJSON files in `/data`, no database needed for a prototype | avoids backend complexity entirely |

---

## 5. Where To Get The Actual Historical Data

This is the part most teams get wrong (they either skip it or spend all their time on it). Split your sourcing into three tiers:

**Tier 1 — Borders/timeline shapes (fast, free, ready to use):**
- **[github.com/aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps)** — a free, open GeoJSON collection of historical state/empire boundaries across time, built specifically for mapping projects like this. This should save you from tracing borders by hand. Check it for Golden Horde/Mongol Empire/Jochid Ulus boundary years; where a specific year is missing, interpolate between the two nearest available snapshots.
- **GeaCron** and **Chronas** — both are existing interactive history-map projects covering empire borders since antiquity; useful as a **visual reference** to sanity-check your own border shapes even if you can't extract their raw data.

**Tier 2 — Site facts, dates, stories (needs real research, but manageable):**
- Wikipedia articles on the Golden Horde, Ulus Jochi, individual cities (Saraishyk, Sygnak, Otrar, Saray-Batu) — good starting point, always cross-check specific dates against one more source.
- Academic historians whose work specifically covers the Golden Horde: Vadim Trepavlov, István Vásáry, Charles Halperin, Uli Schamiloglu — searching their published papers/book chapters (many available via Google Scholar) is the fastest way to get dates and facts you can trust for a specific khan or event.
- **National Museum of Kazakhstan** and the **Ulytau State Historical-Cultural Museum-Reserve** — these institutions maintain accurate info on Kazakhstan-specific sites (Ulytau, Sygnak) and are exactly the kind of "we consulted a local authority" detail that boosts credibility with judges. Even an email exchange or a citation of their published materials is worth it.
- Archaeology reports/papers (searchable via Google Scholar, sometimes on ResearchGate) for excavation-based facts about specific ruins — good for "fun facts."

**Tier 3 — Quality control (do this regardless of time pressure):**
- Get a history student, teacher, or local museum contact to sanity-check your final content set before the demo — a factual error on a heritage project undermines the whole pitch, and this is genuinely the thing that most often trips up otherwise strong hackathon entries in this domain.
- Keep a `sources.md` file listing where each fact came from — it's good practice, protects you if a judge asks "how do you know that," and can double as your works-cited slide.

---

## 6. AI Chatbot Implementation Plan

- **Provider:** start with **Google Gemini** (`gemini-2.5-flash`) — free tier is generous (roughly 1,500 requests/day), supports long context, no credit card required to get an API key. Keep **Groq** (OpenAI-compatible endpoint, very fast) as a backup/fallback if you want faster responses in a live demo or hit a Gemini rate limit.
- **Grounding strategy (important for accuracy):** don't just prompt the raw model. In your Next.js API route, build a system prompt that:
  1. Defines the persona: "You are a knowledgeable, friendly historian guide specializing in the Golden Horde (Ulus Jochi), speaking to a general audience including students."
  2. **Injects your own `sites.json` / `routes.json` / `battles.json` content** (or a summarized version of it) directly into the system prompt as reference material, and instructs the model to prefer this data and stay consistent with it.
  3. Tells the model to say "I'm not certain about that specific detail" rather than inventing dates it isn't sure of — critical for a history project's credibility.
- **Never call the AI API directly from the browser** — always route it through a Next.js API route (`app/api/chat/route.ts`) so your API key stays server-side.

---

## 7. Suggested Build Order (Phased, for use with Claude Code)

**Phase 0 — Setup**
Scaffold Next.js + TypeScript + Tailwind, install `react-leaflet`, set up folder structure (`/data`, `/app/api/chat`, `/components/Map`, `/components/Timeline`, `/components/InfoPanel`, `/components/Chatbot`).

**Phase 1 — Static map with real markers**
Load `sites.json`, render as Leaflet markers, clicking one opens a basic info panel (no timeline filtering yet). Get this working end-to-end before adding complexity.

**Phase 2 — Timeline slider + border snapshots**
Add the year slider component. Pull 3-4 border snapshot years from historical-basemaps to start (not all 8-10 yet), filter markers by `founded`/`destroyed` against the current year, cross-fade border polygons.

**Phase 3 — Routes layer + toggle**
Add `routes.json`, render as polylines, add the Sites/Routes toggle, apply the same year-based filtering to routes.

**Phase 4 — Info panel polish + interactive elements**
Add fun facts, images, and pick ONE interactive element from 2.5 (recommend the micro-quiz — cheapest to build, clearest "engagement" story for judges).

**Phase 5 — AI chatbot**
Build the API route, wire up the chat UI, inject site data into the system prompt.

**Phase 6 — Visual polish + demo prep**
Parchment/historical map styling, mobile responsiveness pass, and rehearse the demo flow: open on 1240 → drag slider forward showing empire growth/routes/fragmentation → click 2-3 sites → ask the chatbot a question → land on the pitch's problem/solution framing.

---


## 9. Pitch Framing (for your final presentation)

Lead with the problem, not the feature list:
1. "The Golden Horde ruled a third of Eurasia for 250 years — but today its legacy is scattered across five countries' borders and reduced to a paragraph in a textbook."
2. Show the timeline slider live — this is your strongest 20 seconds. Watch the borders grow, watch routes connect, watch it fragment.
3. Click 1-2 sites, show the story + quiz.
4. Ask the AI chatbot one real question live.
5. Close on the two problems solved: **fragmentation → one connected visual map; disengagement → an interactive, game-like way to explore instead of memorize.**
6. One roadmap slide: route-planner/tourism angle, more sites, AR (future, not now) — shows judges you know where this goes without overclaiming what you built in a hackathon.

---

## 10. Honest Risks To Flag Yourself On (so you're not caught off guard by judges)

- **Historical border precision:** medieval empire borders were fuzzy/contested, not hard lines like a modern country. Say so explicitly in an "About the data" note in the app — it reads as rigor, not weakness.
- **Content accuracy:** you are not a professional historian team; get at least a light review pass from someone who knows the subject before presenting facts as certain.
- **AI hallucination:** even with grounding, the chatbot can still say something wrong. Consider a visible disclaimer ("AI-generated answers, verify important facts") — judges respect this kind of honesty far more than it costs you.
