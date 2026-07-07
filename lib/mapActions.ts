/**
 * A map action the AI historian (Bek) can request via function-calling, applied
 * on the client to drive the interactive map. All fields are optional; the AI
 * fills only what a given request implies (e.g. year + siteId to show a place
 * at a moment in time).
 */
export type MapAction = {
  /** Set the timeline to this year (1206–1502). */
  year?: number;
  /** Open a site/city/battle by its id. */
  siteId?: string;
  /** Open a route by its id. */
  routeId?: string;
  /** Switch the map layer. */
  mode?: "sites" | "routes";
  /** Show or hide the modern-borders overlay. */
  modern?: boolean;
};

/** Marker the chat stream uses to carry actions ahead of the narrated reply. */
export const ACTIONS_OPEN = "[[GH_ACTIONS]]";
export const ACTIONS_CLOSE = "[[/GH_ACTIONS]]";
export const ACTIONS_RE = /\[\[GH_ACTIONS\]\]([\s\S]*?)\[\[\/GH_ACTIONS\]\]/;
