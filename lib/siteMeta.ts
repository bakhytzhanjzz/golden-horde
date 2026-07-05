/**
 * Presentation metadata for each site type — labels and accent colors shared
 * by the info panel and legend. Marker SVGs live in MapView's own TYPE_CONFIG.
 */

import type { SiteType } from "@/lib/types";

export const SITE_TYPE_META: Record<
  SiteType,
  { label: string; color: string }
> = {
  city: { label: "City", color: "#8a5a2b" },
  capital: { label: "Capital", color: "#6b4c0a" },
  sacred: { label: "Sacred site", color: "#2a5e6e" },
  port: { label: "Port / trading post", color: "#1a4a6b" },
  battle: { label: "Battle site", color: "#8b1a1a" },
};

export function siteTypeMeta(type: SiteType) {
  return SITE_TYPE_META[type] ?? SITE_TYPE_META.city;
}
