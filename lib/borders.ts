/**
 * Border snapshot handling + timeline cross-fade math.
 *
 * We do NOT compute borders live. We keep a handful of pre-baked GeoJSON
 * snapshots and blend the opacity of the two nearest ones as the slider moves,
 * which looks like a continuous morph for a fraction of the cost.
 */

import type { FeatureCollection } from "geojson";
import b1240 from "@/data/borders/1240.json";
import b1357 from "@/data/borders/1357.json";
import b1460 from "@/data/borders/1460.json";

export const YEAR_MIN = 1206;
export const YEAR_MAX = 1502;

export type BorderSnapshot = {
  year: number;
  /** Short map label drawn over the territory for this era. */
  label: string;
  data: FeatureCollection;
};

/** Snapshots MUST stay sorted ascending by year. */
export const BORDER_SNAPSHOTS: BorderSnapshot[] = [
  { year: 1240, label: "Алтын Орда · Golden Horde", data: b1240 as FeatureCollection },
  { year: 1357, label: "Алтын Орда · Golden Horde", data: b1357 as FeatureCollection },
  { year: 1460, label: "Ұлы Орда · Great Horde", data: b1460 as FeatureCollection },
];

/**
 * Rough centroid (average of the outer ring's vertices) of the first polygon
 * in a snapshot, returned as Leaflet [lat, lng]. Good enough for placing a
 * label over the territory; not a true area-weighted centroid.
 */
export function snapshotCentroid(fc: FeatureCollection): [number, number] {
  const feature = fc.features[0];
  const geom = feature?.geometry;
  let ring: number[][] = [];
  if (geom?.type === "Polygon") {
    ring = geom.coordinates[0];
  } else if (geom?.type === "MultiPolygon") {
    ring = geom.coordinates[0][0];
  }
  if (ring.length === 0) return [50, 55];

  // Drop the closing vertex if the ring is explicitly closed.
  const pts =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;

  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of pts) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLat / pts.length, sumLng / pts.length];
}

/**
 * Returns a cross-fade weight in [0, 1] for each snapshot at `currentYear`.
 * The two snapshots bracketing the year share the weight (linear blend);
 * every other snapshot gets 0. Outside the snapshot range, the nearest
 * endpoint gets the full weight.
 */
export function computeBorderWeights(
  currentYear: number,
  snapshots: BorderSnapshot[] = BORDER_SNAPSHOTS
): number[] {
  const weights = new Array(snapshots.length).fill(0);
  if (snapshots.length === 0) return weights;

  // Clamp below the earliest / above the latest snapshot.
  if (currentYear <= snapshots[0].year) {
    weights[0] = 1;
    return weights;
  }
  const lastIdx = snapshots.length - 1;
  if (currentYear >= snapshots[lastIdx].year) {
    weights[lastIdx] = 1;
    return weights;
  }

  // Find the bracketing pair [i, i+1].
  for (let i = 0; i < lastIdx; i++) {
    const lo = snapshots[i].year;
    const hi = snapshots[i + 1].year;
    if (currentYear >= lo && currentYear <= hi) {
      const t = (currentYear - lo) / (hi - lo);
      weights[i] = 1 - t;
      weights[i + 1] = t;
      break;
    }
  }
  return weights;
}
