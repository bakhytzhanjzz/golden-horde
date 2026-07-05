"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Route, Site } from "@/lib/types";
import sitesData from "@/data/sites.json";
import { ROUTES, isRouteActiveAt } from "@/lib/routes";
import { YEAR_MAX } from "@/lib/borders";
import InfoPanel from "@/components/InfoPanel/InfoPanel";
import TimelineSlider from "@/components/Timeline/TimelineSlider";
import ModeToggle, { type MapMode } from "@/components/Controls/ModeToggle";
import RouteLegend from "@/components/Controls/RouteLegend";
import MarkerLegend from "@/components/Controls/MarkerLegend";
import ScoreBadge from "@/components/Controls/ScoreBadge";
import SiteDirectory from "@/components/Directory/SiteDirectory";

// ChatBot uses browser APIs, so it must not render on the server.
const ChatBot = dynamic(() => import("@/components/Chat/ChatBot"), { ssr: false });

// Leaflet touches `window`, so the map must not render on the server.
const MapView = dynamic(() => import("@/components/Map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#dcd3bd] text-[#7a6a48]">
      Loading map…
    </div>
  ),
});

const sites = sitesData as Site[];
const siteById = new Map(sites.map((s) => [s.id, s]));
const TOTAL_QUIZZES = sites.filter((s) => s.quiz).length;

/** A city is visible if it exists at `year`: founded ≤ year ≤ (destroyed || fall). */
function isVisibleAt(site: Site, year: number): boolean {
  const end = site.destroyed ?? YEAR_MAX;
  return site.founded <= year && year <= end;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

export default function Home() {
  const [year, setYear] = useState(1357); // open near the empire's peak
  const [mode, setMode] = useState<MapMode>("sites");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  // Quiz answers: siteId → chosen option index. First answer per site is final,
  // so points can't be farmed by re-answering.
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const visibleSites = useMemo(
    () => sites.filter((s) => isVisibleAt(s, year)),
    [year]
  );

  const visibleRoutes = useMemo(
    () => ROUTES.filter((r) => isRouteActiveAt(r, year)),
    [year]
  );

  // Cities are always clickable; routes only when the routes layer is on.
  // If the selected item is filtered out (year change or leaving routes mode),
  // the panel closes on its own.
  const selection: Site | Route | null = useMemo(() => {
    if (selectedId === null) return null;
    const site = visibleSites.find((s) => s.id === selectedId);
    if (site) return site;
    if (mode === "routes") {
      return visibleRoutes.find((r) => r.id === selectedId) ?? null;
    }
    return null;
  }, [selectedId, mode, visibleSites, visibleRoutes]);

  // Running quiz score: +1 for each site whose recorded answer is correct.
  const { score, answeredCount } = useMemo(() => {
    let s = 0;
    for (const [id, idx] of Object.entries(quizAnswers)) {
      const site = siteById.get(id);
      if (site?.quiz && site.quiz.answer === idx) s += 1;
    }
    return { score: s, answeredCount: Object.keys(quizAnswers).length };
  }, [quizAnswers]);

  function handleQuizAnswer(siteId: string, index: number) {
    // Lock the first answer per site.
    setQuizAnswers((prev) =>
      prev[siteId] !== undefined ? prev : { ...prev, [siteId]: index }
    );
  }

  // Picking from the directory: snap the timeline to a year where the item
  // actually exists (so the map context matches), then open its panel.
  function openSiteFromDirectory(site: Site) {
    const end = site.destroyed ?? YEAR_MAX;
    setYear((y) => (site.founded <= y && y <= end ? y : clamp(y, site.founded, end)));
    setSelectedId(site.id);
    setDirectoryOpen(false);
  }

  function openRouteFromDirectory(route: Route) {
    setMode("routes"); // routes only render/resolve in routes mode
    setYear((y) =>
      isRouteActiveAt(route, y) ? y : clamp(y, route.active_from, route.active_to)
    );
    setSelectedId(route.id);
    setDirectoryOpen(false);
  }

  const quizAnsweredIndex =
    selection && !("route_type" in selection)
      ? quizAnswers[selection.id]
      : undefined;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Title + Browse button, top-left */}
      <div className="absolute left-4 top-4 z-[500] flex max-w-sm flex-col items-start gap-2">
        <div className="pointer-events-none rounded-lg bg-[#f4ecd8]/90 px-4 py-3 shadow-md backdrop-blur-sm">
          <h1 className="text-lg font-bold leading-tight text-[#3a2f1b]">
            Алтын Орда, Уақыт Саяхаты
          </h1>
          <p className="text-sm text-[#7a6a48]">
            Golden Horde: A Journey Through Time
          </p>
        </div>
        <button
          onClick={() => setDirectoryOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#d8cba8] bg-[#f4ecd8]/90 px-3.5 py-1.5 text-sm font-semibold text-[#7a6a48] shadow-md backdrop-blur-sm transition-colors hover:bg-[#efe6cf] hover:text-[#3a2f1b]"
        >
          <span aria-hidden>📖</span>
          Browse all
        </button>
      </div>

      {/* Sites / Routes toggle, top-center */}
      <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {/* Quiz score, top-right */}
      <div className="absolute right-4 top-4 z-[500]">
        <ScoreBadge
          score={score}
          answered={answeredCount}
          total={TOTAL_QUIZZES}
        />
      </div>

      <MapView
        mode={mode}
        sites={visibleSites}
        routes={visibleRoutes}
        year={year}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Vignette for depth — sits above tiles, below the UI, ignores clicks.
          Kept subtle so it darkens only the corners, not the readable center. */}
      <div className="pointer-events-none absolute inset-0 z-[400] shadow-[inset_0_0_120px_rgba(60,40,15,0.2)]" />

      {/* Marker legend, bottom-left (only in sites mode) */}
      {mode === "sites" && (
        <div className="absolute bottom-5 left-4 z-[500]">
          <MarkerLegend />
        </div>
      )}

      {/* Route legend, bottom-left (only when routes are shown) */}
      {mode === "routes" && (
        <div className="absolute bottom-5 left-4 z-[500]">
          <RouteLegend />
        </div>
      )}

      {/* Timeline slider, docked bottom-center over the map */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-[500] w-[min(92vw,720px)] -translate-x-1/2">
        <TimelineSlider year={year} onChange={setYear} />
      </div>

      <InfoPanel
        selection={selection}
        onClose={() => setSelectedId(null)}
        quizAnsweredIndex={quizAnsweredIndex}
        onQuizAnswer={handleQuizAnswer}
      />

      {/* Hidden directory of every site, battle, and route */}
      <SiteDirectory
        open={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        sites={sites}
        routes={ROUTES}
        onPickSite={openSiteFromDirectory}
        onPickRoute={openRouteFromDirectory}
      />

      {/* AI Historian chatbot — floating button + sidebar.
          Passes the current map context so Bek knows what the user is viewing. */}
      <ChatBot year={year} selectedName={selection?.name.en ?? null} />
    </main>
  );
}
