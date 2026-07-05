"use client";

import { useMemo, useState } from "react";
import type { Route, Site, SiteType } from "@/lib/types";
import { siteTypeMeta } from "@/lib/siteMeta";
import { ROUTE_STYLES } from "@/lib/routes";

type SiteDirectoryProps = {
  open: boolean;
  onClose: () => void;
  sites: Site[];
  routes: Route[];
  onPickSite: (site: Site) => void;
  onPickRoute: (route: Route) => void;
};

type Filter = "all" | "places" | "battles" | "routes";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "places", label: "Places" },
  { value: "battles", label: "Battles" },
  { value: "routes", label: "Routes" },
];

const TYPE_EMBLEM: Record<SiteType, string> = {
  city: "🏛️",
  capital: "👑",
  sacred: "🕌",
  port: "⚓",
  battle: "⚔️",
};

function matches(query: string, name: string): boolean {
  return name.toLowerCase().includes(query.toLowerCase());
}

export default function SiteDirectory({
  open,
  onClose,
  sites,
  routes,
  onPickSite,
  onPickRoute,
}: SiteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { places, battles, routeList } = useMemo(() => {
    const q = query.trim();
    const inName = (n: string) => q === "" || matches(q, n);

    const places = sites
      .filter((s) => s.type !== "battle" && inName(s.name.en))
      .sort((a, b) => a.name.en.localeCompare(b.name.en));

    const battles = sites
      .filter((s) => s.type === "battle" && inName(s.name.en))
      .sort((a, b) => a.founded - b.founded); // chronological — events read as a timeline

    const routeList = routes
      .filter((r) => inName(r.name.en))
      .sort((a, b) => a.active_from - b.active_from);

    return { places, battles, routeList };
  }, [sites, routes, query]);

  const showPlaces = filter === "all" || filter === "places";
  const showBattles = filter === "all" || filter === "battles";
  const showRoutes = filter === "all" || filter === "routes";

  const total = places.length + battles.length + routeList.length;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-[1000] bg-black/20 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Left drawer */}
      <aside
        aria-hidden={!open}
        className={`fixed left-0 top-0 z-[1001] flex h-full w-full max-w-sm flex-col bg-[#f4ecd8] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-[#d8cba8] bg-[#efe6cf] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#3a2f1b]">Explore the Horde</h2>
            <p className="text-xs text-[#9a8860]">
              Jump to any site, battle, or route
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close directory"
            className="rounded-full p-1 text-2xl leading-none text-[#7a6a48] transition-colors hover:bg-[#e0d5b6] hover:text-[#3a2f1b]"
          >
            ×
          </button>
        </header>

        {/* Search + filters */}
        <div className="space-y-3 border-b border-[#d8cba8] px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-lg border border-[#d8cba8] bg-[#faf5e6] px-3 py-2 text-sm text-[#3a2f1b] placeholder:text-[#b3a37c] focus:border-[#8a5a2b] focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === f.value
                    ? "bg-[#8a5a2b] text-[#f4ecd8]"
                    : "bg-[#e6dcc0] text-[#7a6a48] hover:bg-[#ddd0af]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {total === 0 && (
            <p className="px-2 py-6 text-center text-sm text-[#9a8860]">
              Nothing matches “{query}”.
            </p>
          )}

          {showPlaces && places.length > 0 && (
            <Group label={`Places (${places.length})`}>
              {places.map((s) => (
                <Row
                  key={s.id}
                  emblem={TYPE_EMBLEM[s.type]}
                  title={s.name.en}
                  subtitle={`${siteTypeMeta(s.type).label} · ${s.founded}${
                    s.destroyed ? `–${s.destroyed}` : ""
                  }`}
                  accent={siteTypeMeta(s.type).color}
                  onClick={() => onPickSite(s)}
                />
              ))}
            </Group>
          )}

          {showBattles && battles.length > 0 && (
            <Group label={`Battles (${battles.length})`}>
              {battles.map((s) => (
                <Row
                  key={s.id}
                  emblem={TYPE_EMBLEM.battle}
                  title={s.name.en}
                  subtitle={`Battle · ${s.founded}`}
                  accent={siteTypeMeta("battle").color}
                  onClick={() => onPickSite(s)}
                />
              ))}
            </Group>
          )}

          {showRoutes && routeList.length > 0 && (
            <Group label={`Routes (${routeList.length})`}>
              {routeList.map((r) => (
                <Row
                  key={r.id}
                  emblem="〰️"
                  title={r.name.en}
                  subtitle={`${ROUTE_STYLES[r.route_type].label} · ${r.active_from}–${r.active_to}`}
                  accent={ROUTE_STYLES[r.route_type].color}
                  onClick={() => onPickRoute(r)}
                />
              ))}
            </Group>
          )}
        </div>
      </aside>
    </>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#9a8860]">
        {label}
      </h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function Row({
  emblem,
  title,
  subtitle,
  accent,
  onClick,
}: {
  emblem: string;
  title: string;
  subtitle: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors hover:border-[#d8cba8] hover:bg-[#efe6cf]"
      >
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: `${accent}22` }}
        >
          {emblem}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#3a2f1b]">
            {title}
          </span>
          <span className="block truncate text-xs text-[#9a8860]">
            {subtitle}
          </span>
        </span>
      </button>
    </li>
  );
}
