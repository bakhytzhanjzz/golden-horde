/**
 * Language-aware accessors for data content. Kazakh overlays live in
 * data/sites.kz.json and data/routes.kz.json (keyed by id); English is the
 * canonical text in the main data files. Everything falls back to English if a
 * Kazakh translation is missing, so the app never shows a blank.
 */

import type { LocalizedName, Quiz, Route, Site } from "./types";
import type { Lang } from "./strings";
import sitesKz from "@/data/sites.kz.json";
import routesKz from "@/data/routes.kz.json";

type SiteKz = {
  story?: string;
  fun_fact?: string;
  quiz?: { question: string; options: string[] };
  sides?: { attacker: string; defender: string };
};
type RouteKz = { story?: string; fun_fact?: string };

const SITES_KZ = sitesKz as Record<string, SiteKz>;
const ROUTES_KZ = routesKz as Record<string, RouteKz>;

/** Localized display name, falling back to English. */
export function locName(name: LocalizedName, lang: Lang): string {
  if (lang === "kz" && name.kz) return name.kz;
  return name.en;
}

export function locSiteStory(site: Site, lang: Lang): string {
  if (lang === "kz") return SITES_KZ[site.id]?.story ?? site.story;
  return site.story;
}

export function locSiteFunFact(site: Site, lang: Lang): string | undefined {
  if (lang === "kz") return SITES_KZ[site.id]?.fun_fact ?? site.fun_fact;
  return site.fun_fact;
}

/** Localized quiz — keeps the original answer index, swaps question/options. */
export function locSiteQuiz(site: Site, lang: Lang): Quiz | undefined {
  if (!site.quiz) return undefined;
  const kz = SITES_KZ[site.id]?.quiz;
  if (lang === "kz" && kz) {
    return { question: kz.question, options: kz.options, answer: site.quiz.answer };
  }
  return site.quiz;
}

export function locSiteSides(site: Site, lang: Lang): Site["sides"] {
  if (!site.sides) return undefined;
  if (lang === "kz") return SITES_KZ[site.id]?.sides ?? site.sides;
  return site.sides;
}

export function locRouteStory(route: Route, lang: Lang): string {
  if (lang === "kz") return ROUTES_KZ[route.id]?.story ?? route.story;
  return route.story;
}

export function locRouteFunFact(route: Route, lang: Lang): string | undefined {
  if (lang === "kz") return ROUTES_KZ[route.id]?.fun_fact ?? route.fun_fact;
  return route.fun_fact;
}
