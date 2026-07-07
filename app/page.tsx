"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Route, Site } from "@/lib/types";
import sitesData from "@/data/sites.json";
import { ROUTES, isRouteActiveAt } from "@/lib/routes";
import { BORDER_SNAPSHOTS, YEAR_MAX, YEAR_MIN } from "@/lib/borders";
import { rulerAt, rulerName, rulerNote } from "@/lib/rulers";
import type { MapAction } from "@/lib/mapActions";
import InfoPanel from "@/components/InfoPanel/InfoPanel";
import TimelineSlider from "@/components/Timeline/TimelineSlider";
import ModeToggle, { type MapMode } from "@/components/Controls/ModeToggle";
import RouteLegend from "@/components/Controls/RouteLegend";
import MarkerLegend from "@/components/Controls/MarkerLegend";
import ScoreBadge from "@/components/Controls/ScoreBadge";
import LanguageToggle from "@/components/Controls/LanguageToggle";
import SiteDirectory from "@/components/Directory/SiteDirectory";
import { useLang, useStrings } from "@/lib/i18n";
import { locName } from "@/lib/localize";

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

// Play mode: how fast the timeline auto-advances. A full 1206→1502 run takes
// ~10s at these settings — long enough to read the eras, short enough to demo.
const PLAY_STEP_MS = 70;
const PLAY_YEARS_PER_STEP = 2;
const SNAPSHOT_YEARS = BORDER_SNAPSHOTS.map((s) => s.year);

/** Tracks the user's OS "reduce motion" preference (reactively). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function Home() {
  const [year, setYear] = useState(1357); // open near the empire's peak
  const [mode, setMode] = useState<MapMode>("sites");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  // Quiz answers: siteId → chosen option index. First answer per site is final,
  // so points can't be farmed by re-answering.
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [playing, setPlaying] = useState(false);
  const [showModern, setShowModern] = useState(false);
  // When Bek opens a card, we skip the dimming backdrop so the map he navigated
  // to stays visible and interactive behind the panel.
  const [panelUndimmed, setPanelUndimmed] = useState(false);

  const t = useStrings();
  const { lang } = useLang();
  const reducedMotion = usePrefersReducedMotion();

  // Latest year without re-arming the interval each tick.
  const yearRef = useRef(year);
  yearRef.current = year;

  const atEnd = year >= YEAR_MAX;

  // Auto-advance the timeline while playing. Reduced-motion users get discrete
  // snapshot-to-snapshot jumps with a dwell instead of continuous scrubbing.
  useEffect(() => {
    if (!playing) return;

    if (reducedMotion) {
      const id = setInterval(() => {
        const next = SNAPSHOT_YEARS.find((y) => y > yearRef.current);
        if (next === undefined) setPlaying(false);
        else setYear(next);
      }, 1400);
      return () => clearInterval(id);
    }

    const id = setInterval(() => {
      const next = yearRef.current + PLAY_YEARS_PER_STEP;
      if (next >= YEAR_MAX) {
        setYear(YEAR_MAX);
        setPlaying(false);
      } else {
        setYear(next);
      }
    }, PLAY_STEP_MS);
    return () => clearInterval(id);
  }, [playing, reducedMotion]);

  function togglePlay() {
    // Starting from the end restarts the journey from the beginning.
    if (!playing && yearRef.current >= YEAR_MAX) setYear(YEAR_MIN);
    setPlaying((p) => !p);
  }

  // Any manual year change (scrubbing, ticks, directory jumps) stops playback.
  function scrubToYear(next: number) {
    setPlaying(false);
    setYear(next);
  }

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
  // Marker clicks and directory picks use the normal dimmed panel.
  function handleSelect(id: string) {
    setPanelUndimmed(false);
    setSelectedId(id);
  }

  function openSiteFromDirectory(site: Site) {
    setPlaying(false);
    setPanelUndimmed(false);
    const end = site.destroyed ?? YEAR_MAX;
    setYear((y) => (site.founded <= y && y <= end ? y : clamp(y, site.founded, end)));
    setSelectedId(site.id);
    setDirectoryOpen(false);
  }

  function openRouteFromDirectory(route: Route) {
    setPlaying(false);
    setPanelUndimmed(false);
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

  const playingRuler = rulerAt(year);
  const playingCaption = playingRuler
    ? { name: rulerName(playingRuler, lang), note: rulerNote(playingRuler, lang) }
    : null;

  // Bek (the AI historian) can drive the map via these actions.
  function applyMapActions(actions: MapAction[]) {
    setPlaying(false);
    if (actions.some((a) => a.siteId || a.routeId)) setPanelUndimmed(true);
    for (const a of actions) {
      if (a.mode) setMode(a.mode);
      if (typeof a.modern === "boolean") setShowModern(a.modern);

      const base = typeof a.year === "number" ? clamp(a.year, YEAR_MIN, YEAR_MAX) : year;

      if (a.siteId && siteById.has(a.siteId)) {
        const site = siteById.get(a.siteId)!;
        const end = site.destroyed ?? YEAR_MAX;
        setYear(site.founded <= base && base <= end ? base : clamp(base, site.founded, end));
        setSelectedId(site.id);
      } else if (a.routeId) {
        const route = ROUTES.find((r) => r.id === a.routeId);
        if (route) {
          setMode("routes");
          setYear(
            isRouteActiveAt(route, base)
              ? base
              : clamp(base, route.active_from, route.active_to)
          );
          setSelectedId(route.id);
        } else if (typeof a.year === "number") {
          setYear(base);
        }
      } else if (typeof a.year === "number") {
        setYear(base);
      }
    }
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Title + Browse button, top-left */}
      <div className="absolute left-4 top-4 z-[500] flex max-w-sm flex-col items-start gap-2">
        <div className="pointer-events-none rounded-lg bg-[#f4ecd8]/90 px-4 py-3 shadow-md backdrop-blur-sm">
          <h1 className="text-lg font-bold leading-tight text-[#3a2f1b]">
            {t.subtitle}
          </h1>
        </div>
        <button
          onClick={() => setDirectoryOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#d8cba8] bg-[#f4ecd8]/90 px-3.5 py-1.5 text-sm font-semibold text-[#7a6a48] shadow-md backdrop-blur-sm transition-colors hover:bg-[#efe6cf] hover:text-[#3a2f1b]"
        >
          <span aria-hidden>📖</span>
          {t.browseAll}
        </button>
      </div>

      {/* Sites / Routes toggle + modern-borders overlay, top-center */}
      <div className="absolute left-1/2 top-4 z-[500] flex -translate-x-1/2 flex-col items-center gap-2">
        <ModeToggle mode={mode} onChange={setMode} />
        <button
          type="button"
          onClick={() => setShowModern((v) => !v)}
          aria-pressed={showModern}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm transition-colors ${
            showModern
              ? "border-[#374151] bg-[#374151] text-[#f4ecd8]"
              : "border-[#d8cba8] bg-[#f4ecd8]/90 text-[#7a6a48] hover:bg-[#efe6cf]"
          }`}
        >
          <span aria-hidden>🌍</span>
          {t.modernBorders}
        </button>
      </div>

      {/* Language switch + quiz score, top-right */}
      <div className="absolute right-4 top-4 z-[500] flex flex-col items-end gap-2">
        <LanguageToggle />
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
        onSelect={handleSelect}
        showModern={showModern}
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

      {/* Cinematic era caption — only while auto-playing, so the timeline
          narrates itself during a demo. */}
      {playing && playingCaption && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-[450] w-[min(90vw,520px)] -translate-x-1/2 text-center">
          <div className="inline-block rounded-2xl bg-[#2a2013]/85 px-6 py-4 text-[#f4ecd8] shadow-2xl backdrop-blur-sm">
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              {year}
            </div>
            <div className="mt-1 text-lg font-semibold text-[#e9c877]">
              {playingCaption.name}
            </div>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-snug text-[#e7dcc0]/90">
              {playingCaption.note}
            </p>
          </div>
        </div>
      )}

      {/* Timeline slider, docked bottom-center over the map */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-[500] w-[min(92vw,720px)] -translate-x-1/2">
        <TimelineSlider
          year={year}
          onChange={scrubToYear}
          playing={playing}
          atEnd={atEnd}
          onTogglePlay={togglePlay}
        />
      </div>

      <InfoPanel
        selection={selection}
        onClose={() => setSelectedId(null)}
        quizAnsweredIndex={quizAnsweredIndex}
        onQuizAnswer={handleQuizAnswer}
        undimmed={panelUndimmed}
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
      <ChatBot
        year={year}
        selectedName={selection ? locName(selection.name, lang) : null}
        onAction={applyMapActions}
      />
    </main>
  );
}
