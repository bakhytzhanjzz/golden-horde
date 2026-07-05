/**
 * Loads routes.json and turns each route into a smooth, city-connecting
 * polyline. Route "stops" reference cities by id (resolved against sites.json)
 * or give explicit coordinates for non-city waypoints (e.g. Kyiv, Bolgar).
 *
 * The raw stops are then (a) bowed with perpendicular midpoints and
 * (b) smoothed with a Catmull-Rom spline, so routes read as graceful trade-map
 * arcs between cities rather than boring straight segments.
 */

import type { LatLng, Route, RouteType, Site } from "@/lib/types";
import routesData from "@/data/routes.json";
import sitesData from "@/data/sites.json";

type Stop = { city: string } | { lat: number; lng: number; label?: string };

type RawRoute = {
  id: string;
  name: Route["name"];
  route_type: RouteType;
  active_from: number;
  active_to: number;
  story: string;
  fun_fact?: string;
  stops: Stop[];
};

const sites = sitesData as Site[];
const siteById = new Map(sites.map((s) => [s.id, s]));

function resolveStop(stop: Stop): LatLng {
  if ("city" in stop) {
    const s = siteById.get(stop.city);
    if (!s) throw new Error(`Route references unknown city id: ${stop.city}`);
    return [s.lat, s.lng];
  }
  return [stop.lat, stop.lng];
}

/**
 * Insert a perpendicular-offset midpoint between each pair of points so every
 * segment bows outward into an arc. `curvature` is a fraction of segment length.
 */
function bow(points: LatLng[], curvature: number): LatLng[] {
  if (points.length < 2) return points;
  const out: LatLng[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const [aLat, aLng] = points[i];
    const [bLat, bLng] = points[i + 1];
    const mLat = (aLat + bLat) / 2;
    const mLng = (aLng + bLng) / 2;
    // Perpendicular to the segment (rotate the delta 90°), scaled by curvature.
    const dLat = bLat - aLat;
    const dLng = bLng - aLng;
    out.push([mLat - dLng * curvature, mLng + dLat * curvature]);
    out.push([bLat, bLng]);
  }
  return out;
}

/** Catmull-Rom spline through the points → densely-sampled smooth curve. */
function smooth(points: LatLng[], samplesPerSegment = 16): LatLng[] {
  if (points.length < 3) return points;
  const p = points;
  const out: LatLng[] = [];
  const crv = (a: number, b: number, c: number, d: number, t: number) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * b +
        (-a + c) * t +
        (2 * a - 5 * b + 4 * c - d) * t2 +
        (-a + 3 * b - 3 * c + d) * t3)
    );
  };
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p[i + 1];
    for (let j = 0; j < samplesPerSegment; j++) {
      const t = j / samplesPerSegment;
      out.push([
        crv(p0[0], p1[0], p2[0], p3[0], t),
        crv(p0[1], p1[1], p2[1], p3[1], t),
      ]);
    }
  }
  out.push(p[p.length - 1]);
  return out;
}

export const ROUTES: Route[] = (routesData as RawRoute[]).map((r) => {
  const anchors = r.stops.map(resolveStop);
  return {
    id: r.id,
    name: r.name,
    route_type: r.route_type,
    active_from: r.active_from,
    active_to: r.active_to,
    story: r.story,
    fun_fact: r.fun_fact,
    anchors, // the raw city/waypoint points (for endpoint dots if wanted)
    positions: smooth(bow(anchors, 0.12)),
  };
});

/** Visual style per route type. `className` drives the CSS flow animation. */
export const ROUTE_STYLES: Record<
  RouteType,
  { color: string; glow: string; className: string; label: string }
> = {
  trade: {
    color: "#c9922b",
    glow: "rgba(201,146,43,0.9)",
    className: "gh-route-trade",
    label: "Trade",
  },
  military: {
    color: "#c0392b",
    glow: "rgba(192,57,43,0.9)",
    className: "gh-route-military",
    label: "Military",
  },
  postal: {
    color: "#2c7a7b",
    glow: "rgba(44,122,123,0.9)",
    className: "gh-route-postal",
    label: "Postal (yam)",
  },
};

/** A route is visible if active_from ≤ year ≤ active_to. */
export function isRouteActiveAt(route: Route, year: number): boolean {
  return route.active_from <= year && year <= route.active_to;
}
