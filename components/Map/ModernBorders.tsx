"use client";

import { GeoJSON, Marker } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import modernData from "@/data/modern-borders.json";
import { modernCountryName } from "@/lib/fragmentation";
import { useLang } from "@/lib/i18n";

const MODERN = modernData as FeatureCollection;

// Approximate label anchors for the five countries the Horde is split across,
// placed where each is visible over the historical heartland.
const CORE_LABELS: { en: string; at: [number, number] }[] = [
  { en: "Russia", at: [54.5, 44.0] },
  { en: "Kazakhstan", at: [48.5, 66.0] },
  { en: "Ukraine", at: [49.0, 31.5] },
  { en: "Uzbekistan", at: [41.6, 63.5] },
  { en: "Mongolia", at: [47.0, 100.0] },
];

function styleFor(feature?: Feature<Geometry, { core?: boolean }>) {
  const core = !!feature?.properties?.core;
  return {
    color: core ? "#1f2937" : "#6b7280",
    weight: core ? 1.6 : 0.8,
    opacity: core ? 0.85 : 0.45,
    dashArray: "4 4",
    fill: false as const,
    interactive: false,
  };
}

/**
 * Present-day country borders overlaid on the historical map — the visual
 * argument that one empire is now divided among five modern states. Drawn as
 * dashed outlines (no fill) so the era borders and cities stay readable.
 */
export default function ModernBorders() {
  const { lang } = useLang();

  const labels = useMemo(
    () =>
      CORE_LABELS.map(({ en, at }) => ({
        at,
        icon: L.divIcon({
          className: "gh-modern-label",
          html: `<span style="
            display:inline-block;
            white-space:nowrap;
            transform:translate(-50%,-50%);
            font-family: system-ui, sans-serif;
            font-size:12px;
            font-weight:700;
            letter-spacing:1px;
            text-transform:uppercase;
            color:#374151;
            opacity:0.85;
            text-shadow:0 1px 3px rgba(255,255,255,0.95);
            pointer-events:none;
          ">${modernCountryName(en, lang)}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      })),
    [lang]
  );

  return (
    <>
      {/* Re-key by lang so the layer re-renders cleanly; styling is static. */}
      <GeoJSON key="modern" data={MODERN} style={styleFor} interactive={false} />
      {labels.map((l, i) => (
        <Marker key={i} position={l.at} icon={l.icon} interactive={false} keyboard={false} />
      ))}
    </>
  );
}
