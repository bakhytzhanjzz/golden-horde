"use client";

import { Circle, Marker } from "react-leaflet";
import L from "leaflet";
import { Fragment, useMemo } from "react";
import { successorsAt, successorName, type Successor } from "@/lib/fragmentation";
import { useLang } from "@/lib/i18n";

type SuccessorLayerProps = {
  year: number;
};

// Fade each region in over the years just after its founding, so during Play
// mode the empire visibly "shatters" into its successors rather than popping.
const FADE_YEARS = 12;

function opacityFor(s: Successor, year: number): number {
  return Math.max(0, Math.min(1, (year - s.from) / FADE_YEARS));
}

/**
 * The breakaway khanates of the 15th century, drawn as soft approximate regions
 * with labels. Appears automatically as the timeline reaches the fragmentation
 * era — the visual proof that the single empire dissolved into many states.
 */
export default function SuccessorLayer({ year }: SuccessorLayerProps) {
  const { lang } = useLang();
  const active = successorsAt(year);

  const labels = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const s of active) {
      const op = opacityFor(s, year);
      map.set(
        s.id,
        L.divIcon({
          className: "gh-successor-label",
          html: `<span style="
            display:inline-block;
            white-space:nowrap;
            transform:translate(-50%,-50%);
            font-family: Georgia, 'Times New Roman', serif;
            font-size:12px;
            font-weight:700;
            color:${s.color};
            opacity:${op};
            text-shadow:0 1px 3px rgba(244,236,216,0.95);
            pointer-events:none;
          ">${successorName(s, lang)}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
      );
    }
    return map;
  }, [active, year, lang]);

  return (
    <>
      {active.map((s) => {
        const op = opacityFor(s, year);
        return (
          <Fragment key={s.id}>
            <Circle
              center={s.center}
              radius={s.radiusM}
              interactive={false}
              pathOptions={{
                color: s.color,
                fillColor: s.color,
                weight: 1.5,
                opacity: op * 0.7,
                fillOpacity: op * 0.12,
                dashArray: "6 6",
              }}
            />
            <Marker
              position={s.center}
              icon={labels.get(s.id)!}
              interactive={false}
              keyboard={false}
            />
          </Fragment>
        );
      })}
    </>
  );
}
