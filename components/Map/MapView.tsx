"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { Fragment, useMemo } from "react";
import type { Route, Site } from "@/lib/types";
import {
  BORDER_SNAPSHOTS,
  computeBorderWeights,
  snapshotCentroid,
} from "@/lib/borders";
import { ROUTE_STYLES } from "@/lib/routes";
import BorderLayer from "./BorderLayer";
import BorderLabel from "./BorderLabel";
import type { MapMode } from "@/components/Controls/ModeToggle";

type MapViewProps = {
  mode: MapMode;
  sites: Site[];
  routes: Route[];
  year: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Center roughly on the Golden Horde region (lower Volga / western steppe),
// zoomed out enough to see from Sarai on the Volga to Otrar on the Syr Darya.
const DEFAULT_CENTER: [number, number] = [48.0, 55.0];
const DEFAULT_ZOOM = 5;

// ─── Per-type marker config ────────────────────────────────────────────────
type SiteTypeKey = "city" | "battle" | "capital" | "sacred" | "port" | string;

const TYPE_CONFIG: Record<string, { color: string; selectedColor: string; glow: string; svg: string }> = {
  city: {
    color: "#8a5a2b",
    selectedColor: "#b8391f",
    glow: "rgba(138,90,43,0.55)",
    // Stylised tower / battlement silhouette
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 22" fill="COLOR" stroke="RING" stroke-width="1">
      <rect x="2" y="8" width="16" height="12" rx="1"/>
      <rect x="2" y="5" width="3" height="4" rx="0.5"/>
      <rect x="8.5" y="5" width="3" height="4" rx="0.5"/>
      <rect x="15" y="5" width="3" height="4" rx="0.5"/>
      <rect x="7" y="13" width="6" height="7" rx="1"/>
    </svg>`,
  },
  battle: {
    color: "#8b1a1a",
    selectedColor: "#c0392b",
    glow: "rgba(139,26,26,0.65)",
    // Crossed swords
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round">
      <line x1="3" y1="3" x2="19" y2="19"/>
      <line x1="19" y1="3" x2="3" y2="19"/>
      <line x1="3" y1="3" x2="6" y2="6"/>
      <line x1="19" y1="3" x2="16" y2="6"/>
      <line x1="3" y1="6" x2="6" y2="3"/>
      <line x1="19" y1="6" x2="16" y2="3"/>
    </svg>`,
  },
  capital: {
    color: "#6b4c0a",
    selectedColor: "#b8391f",
    glow: "rgba(107,76,10,0.7)",
    // Crown
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" fill="COLOR" stroke="RING" stroke-width="1">
      <polygon points="1,17 4,5 11,12 18,5 21,17"/>
      <rect x="1" y="15" width="20" height="3" rx="1"/>
    </svg>`,
  },
  sacred: {
    color: "#2a5e6e",
    selectedColor: "#1a7a8a",
    glow: "rgba(42,94,110,0.6)",
    // Crescent + small star
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="COLOR">
      <path d="M11 3 A8 8 0 1 0 19 11 A5.5 5.5 0 1 1 11 3Z"/>
      <polygon points="17,3 17.7,5.2 20,5.2 18.2,6.5 18.9,8.7 17,7.4 15.1,8.7 15.8,6.5 14,5.2 16.3,5.2" />
    </svg>`,
  },
  port: {
    color: "#1a4a6b",
    selectedColor: "#1a6b9a",
    glow: "rgba(26,74,107,0.6)",
    // Anchor
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round">
      <circle cx="11" cy="5" r="2.5"/>
      <line x1="11" y1="7.5" x2="11" y2="20"/>
      <line x1="5" y1="10" x2="17" y2="10"/>
      <path d="M5,20 Q5,15 11,20 Q17,15 17,20"/>
    </svg>`,
  },
};

// Fallback for any unknown type
const FALLBACK_CONFIG = TYPE_CONFIG.city;

/**
 * Builds a Leaflet DivIcon with a type-specific SVG badge.
 * Cities → tower, battles → crossed swords, capitals → crown,
 * sacred → crescent, ports → anchor.
 * Selected markers scale up and emit a crimson pulse ring.
 */
function makeIcon(type: SiteTypeKey, selected: boolean): L.DivIcon {
  const cfg = TYPE_CONFIG[type] ?? FALLBACK_CONFIG;
  const fill   = selected ? cfg.selectedColor : cfg.color;
  const ring   = "#f6efda";
  const glow   = selected ? cfg.glow.replace(/[\d.]+\)$/, "0.85)") : cfg.glow;
  const base   = selected ? 28 : 22;

  const svgContent = cfg.svg
    .replace(/COLOR/g, fill)
    .replace(/RING/g,  ring);

  const pulse = selected
    ? `<span style="
        position:absolute;left:50%;top:50%;
        width:${base}px;height:${base}px;
        margin:-${base / 2}px 0 0 -${base / 2}px;
        border-radius:50%;background:${fill};
        animation:gh-pulse 1.8s ease-out infinite;
      "></span>`
    : "";

  const html = `
    <span style="
      position:relative;display:flex;align-items:center;justify-content:center;
      width:${base}px;height:${base}px;
    ">
      ${pulse}
      <span style="
        position:absolute;inset:0;border-radius:${type === "battle" ? "4px" : "50%"};
        background:radial-gradient(circle at 35% 30%, #ede0c0, ${fill === cfg.selectedColor ? "#8b1a1a" : "#5a3a10"});
        border:2px solid ${ring};
        box-shadow:0 1px 6px rgba(0,0,0,0.5), 0 0 ${selected ? 14 : 8}px ${glow};
        display:flex;align-items:center;justify-content:center;
        padding:${base < 24 ? 3 : 4}px;
      ">
        ${svgContent}
      </span>
    </span>`;

  return L.divIcon({
    className: "gh-marker",
    html,
    iconSize:   [base, base],
    iconAnchor: [base / 2, base / 2],
  });
}

export default function MapView({
  mode,
  sites,
  routes,
  year,
  selectedId,
  onSelect,
}: MapViewProps) {
  // Recompute icons only when the site set or selection changes.
  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const s of sites) {
      map.set(s.id, makeIcon(s.type, s.id === selectedId));
    }
    return map;
  }, [sites, selectedId]);

  // Cross-fade weights for each border snapshot at the current year.
  const borderWeights = useMemo(() => computeBorderWeights(year), [year]);

  // Label positions are static per snapshot; compute once.
  const labelPositions = useMemo(
    () => BORDER_SNAPSHOTS.map((s) => snapshotCentroid(s.data)),
    []
  );

  const showRoutes = mode === "routes";

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={3}
      maxZoom={9}
      scrollWheelZoom
      className="h-full w-full"
    >
      {/* Basemap. A warm sepia filter (see globals.css) turns this into a
          parchment-toned historical map rather than a modern road atlas. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Empire border snapshots — all mounted, opacity cross-fades by year. */}
      {BORDER_SNAPSHOTS.map((snap, i) => (
        <BorderLayer key={snap.year} data={snap.data} weight={borderWeights[i]} />
      ))}

      {/* Territory labels, fading with their border snapshot. */}
      {BORDER_SNAPSHOTS.map((snap, i) => (
        <BorderLabel
          key={`label-${snap.year}`}
          text={snap.label}
          position={labelPositions[i]}
          weight={borderWeights[i]}
        />
      ))}

      {/* ROUTES — flowing arcs that connect the cities. Drawn beneath the
          markers so the city pins always sit on top. */}
      {showRoutes &&
        routes.map((route) => {
          const style = ROUTE_STYLES[route.route_type];
          const selected = route.id === selectedId;
          return (
            <Fragment key={route.id}>
              {/* Soft glow underlay */}
              <Polyline
                positions={route.positions}
                interactive={false}
                pathOptions={{
                  color: style.color,
                  weight: selected ? 14 : 10,
                  opacity: 0.18,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              {/* Animated dashed line on top */}
              <Polyline
                positions={route.positions}
                pathOptions={{
                  color: style.color,
                  weight: selected ? 5 : 3.5,
                  opacity: 1,
                  lineCap: "round",
                  lineJoin: "round",
                  className: `${style.className}${
                    selected ? " gh-route-selected" : ""
                  }`,
                }}
                eventHandlers={{ click: () => onSelect(route.id) }}
              >
                <Tooltip sticky opacity={1}>
                  {route.name.en}
                </Tooltip>
              </Polyline>
            </Fragment>
          );
        })}

      {/* CITY MARKERS — always visible, in both modes, since the routes
          connect them. Rendered last so they sit above the route lines. */}
      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={icons.get(site.id)}
          eventHandlers={{ click: () => onSelect(site.id) }}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={1}
            className="gh-city-tooltip"
          >
            {site.name.en}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
