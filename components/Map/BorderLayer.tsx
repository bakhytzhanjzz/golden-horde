"use client";

import { GeoJSON } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { FeatureCollection } from "geojson";

type BorderLayerProps = {
  data: FeatureCollection;
  /** Cross-fade weight in [0, 1] from the timeline. */
  weight: number;
  color?: string;
};

// Keep the fill light so city labels on the basemap stay readable through it;
// the stroke stays strong so the territory outline is still clearly defined.
const MAX_FILL_OPACITY = 0.14;
const MAX_STROKE_OPACITY = 0.95;

/**
 * A single border snapshot. Stays mounted at all times and only animates its
 * opacity via `setStyle`, so cross-fading between snapshots is smooth (no
 * remount flicker). react-leaflet's <GeoJSON> applies `style` once at creation,
 * so opacity updates must go through the layer ref imperatively.
 */
export default function BorderLayer({
  data,
  weight,
  color = "#8a3b1f",
}: BorderLayerProps) {
  const ref = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    layer.setStyle({
      color,
      fillColor: color,
      weight: 2.5,
      opacity: weight * MAX_STROKE_OPACITY,
      fillOpacity: weight * MAX_FILL_OPACITY,
    });
  }, [weight, color]);

  return (
    <GeoJSON
      ref={ref}
      data={data}
      interactive={false}
      style={{
        color,
        fillColor: color,
        weight: 2,
        opacity: weight * MAX_STROKE_OPACITY,
        fillOpacity: weight * MAX_FILL_OPACITY,
      }}
    />
  );
}
