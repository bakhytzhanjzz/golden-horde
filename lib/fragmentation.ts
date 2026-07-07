/**
 * Fragmentation layer data — two related but distinct overlays:
 *
 *  1. SUCCESSORS — the khanates that broke away from the Golden Horde as it
 *     collapsed in the 15th century. Rendered as soft, approximate regions
 *     (circles, not hard polygons) because these steppe realms had fluid,
 *     contested frontiers — drawing crisp borders would overstate our
 *     precision. Each appears on the timeline at its founding year.
 *
 *  2. MODERN_COUNTRY_NAMES — Kazakh labels for the present-day countries the
 *     Horde's territory is now divided among, used by the "modern borders"
 *     overlay to drive home that one empire is today split across five states.
 */

import type { Lang } from "./strings";

export type Successor = {
  id: string;
  name: { en: string; kz: string };
  /** Approximate centre as Leaflet [lat, lng]. */
  center: [number, number];
  /** Rough extent in metres — deliberately soft, not a real boundary. */
  radiusM: number;
  color: string;
  /** Year the khanate emerged. */
  from: number;
  /** Year it ended (fell / absorbed), if within our timeline. */
  to?: number;
};

/**
 * Approximate — founding years follow the conventional dates; the shapes are
 * illustrative regions, not surveyed borders. See the "About the data" note.
 */
export const SUCCESSORS: Successor[] = [
  {
    id: "kazan",
    name: { en: "Kazan Khanate", kz: "Қазан хандығы" },
    center: [55.6, 49.6],
    radiusM: 260000,
    color: "#2c7a7b",
    from: 1438,
  },
  {
    id: "crimea",
    name: { en: "Crimean Khanate", kz: "Қырым хандығы" },
    center: [45.6, 34.6],
    radiusM: 240000,
    color: "#9c4221",
    from: 1441,
  },
  {
    id: "nogai",
    name: { en: "Nogai Horde", kz: "Ноғай Ордасы" },
    center: [48.2, 52.5],
    radiusM: 300000,
    color: "#6b46c1",
    from: 1440,
  },
  {
    id: "kazakh",
    name: { en: "Kazakh Khanate", kz: "Қазақ хандығы" },
    center: [45.5, 66.0],
    radiusM: 520000,
    color: "#1a7f37",
    from: 1465,
  },
  {
    id: "astrakhan",
    name: { en: "Astrakhan Khanate", kz: "Астрахан хандығы" },
    center: [46.5, 47.7],
    radiusM: 200000,
    color: "#b7791f",
    from: 1466,
  },
  {
    id: "sibir",
    name: { en: "Khanate of Sibir", kz: "Сібір хандығы" },
    center: [57.0, 68.5],
    radiusM: 360000,
    color: "#2b6cb0",
    from: 1468,
  },
];

/** Successor khanates that exist at `year` (founded, not yet ended). */
export function successorsAt(year: number): Successor[] {
  return SUCCESSORS.filter((s) => year >= s.from && (s.to === undefined || year <= s.to));
}

/** Localized successor name, falling back to English. */
export function successorName(s: Successor, lang: Lang): string {
  return lang === "kz" && s.name.kz ? s.name.kz : s.name.en;
}

/** English → Kazakh names for the modern-borders overlay labels. */
export const MODERN_COUNTRY_NAMES: Record<string, string> = {
  Kazakhstan: "Қазақстан",
  Russia: "Ресей",
  Uzbekistan: "Өзбекстан",
  Ukraine: "Украина",
  Mongolia: "Моңғолия",
};

export function modernCountryName(en: string, lang: Lang): string {
  return lang === "kz" ? MODERN_COUNTRY_NAMES[en] ?? en : en;
}
