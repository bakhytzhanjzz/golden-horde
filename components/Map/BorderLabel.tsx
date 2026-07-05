"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

type BorderLabelProps = {
  text: string;
  position: [number, number];
  /** Cross-fade weight in [0, 1] from the timeline. */
  weight: number;
};

/**
 * An antique-map-style territory label rendered as a non-interactive DivIcon.
 * Fades in/out with its border snapshot's weight.
 */
export default function BorderLabel({ text, position, weight }: BorderLabelProps) {
  const icon = useMemo(() => {
    return L.divIcon({
      className: "gh-border-label",
      html: `<span style="
        display:inline-block;
        white-space:nowrap;
        transform:translate(-50%,-50%);
        font-family: Georgia, 'Times New Roman', serif;
        font-size:15px;
        font-weight:600;
        letter-spacing:2px;
        color:#6b4a22;
        opacity:${weight};
        text-shadow:0 1px 2px rgba(244,236,216,0.9), 0 0 6px rgba(244,236,216,0.7);
        pointer-events:none;
      ">${text}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }, [text, weight]);

  if (weight <= 0.01) return null;

  return (
    <Marker
      position={position}
      icon={icon}
      interactive={false}
      keyboard={false}
    />
  );
}
