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

/** A city is visible if it exists at `year`: founded ≤ year ≤ (destroyed || fall). */
function isVisibleAt(site: Site, year: number): boolean {
  const end = site.destroyed ?? YEAR_MAX;
  return site.founded <= year && year <= end;
}

export default function Home() {
  const [year, setYear] = useState(1357); // open near the empire's peak
  const [mode, setMode] = useState<MapMode>("sites");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Title overlay */}
      <div className="pointer-events-none absolute left-4 top-4 z-[500] max-w-sm rounded-lg bg-[#f4ecd8]/90 px-4 py-3 shadow-md backdrop-blur-sm">
        <h1 className="text-lg font-bold leading-tight text-[#3a2f1b]">
          Алтын Орда, Уақыт Саяхаты
        </h1>
        <p className="text-sm text-[#7a6a48]">
          Golden Horde: A Journey Through Time
        </p>
      </div>

      {/* Sites / Routes toggle, top-center */}
      <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <MapView
        mode={mode}
        sites={visibleSites}
        routes={visibleRoutes}
        year={year}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Vignette for depth — sits above tiles, below the UI, ignores clicks */}
      <div className="pointer-events-none absolute inset-0 z-[400] shadow-[inset_0_0_160px_rgba(60,40,15,0.38)]" />

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

      <InfoPanel selection={selection} onClose={() => setSelectedId(null)} />
    </main>
  );
}
