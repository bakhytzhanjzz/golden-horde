/**
 * Shared data model for the Golden Horde map.
 *
 * NOTE on coordinate order: sites store `lat` / `lng` as separate fields
 * (Leaflet's native order is [lat, lng]). Routes/GeoJSON layers introduced in
 * later phases use their own conventions — keep this in mind to avoid flipped
 * coordinates.
 */

export type LocalizedName = {
  en: string;
  kz?: string;
  ru?: string;
};

export type Quiz = {
  question: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  answer: number;
};

export type SiteType = "city" | "battle";

export type RouteType = "trade" | "military" | "postal";

/** A point in Leaflet order: [lat, lng]. */
export type LatLng = [number, number];

export type Route = {
  id: string;
  name: LocalizedName;
  route_type: RouteType;
  /** Years the route was active: active_from ≤ year ≤ active_to. */
  active_from: number;
  active_to: number;
  story: string;
  fun_fact?: string;
  /** Raw city/waypoint anchor points the route connects. */
  anchors: LatLng[];
  /** Smoothed, arc-sampled polyline vertices for drawing. */
  positions: LatLng[];
};

export type Site = {
  id: string;
  name: LocalizedName;
  type: SiteType;
  lat: number;
  lng: number;
  /** Year the settlement was founded. */
  founded: number;
  /** Year the settlement was destroyed/abandoned (optional for still-standing sites). */
  destroyed?: number;
  /** [start, end] years of the site's historical peak. */
  peak_period?: [number, number];
  story: string;
  fun_fact?: string;
  image?: string;
  quiz?: Quiz;
};
