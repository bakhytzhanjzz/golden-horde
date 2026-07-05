"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { Fragment, useMemo } from "react";
import type { Route, Site } from "@/lib/types";
import {
  BORDER_SNAPSHOTS,
  computeBorderWeights,
  snapshotCentroid,
} from "@/lib/borders";
import { ROUTE_STYLES } from "@/lib/routes";
import BorderLayer from "./BorderLayer";
import BorderLabel from "./BorderLabel";
import type { MapMode } from "@/components/Controls/ModeToggle";

type MapViewProps = {
  mode: MapMode;
  sites: Site[];
  routes: Route[];
  year: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Center roughly on the Golden Horde region (lower Volga / western steppe),
// zoomed out enough to see from Sarai on the Volga to Otrar on the Syr Darya.
const DEFAULT_CENTER: [number, number] = [48.0, 55.0];
const DEFAULT_ZOOM = 5;

/**
 * A glowing parchment-toned marker built as a Leaflet DivIcon. Avoids Leaflet's
 * default PNG icons (which 404 under bundlers). The selected marker grows,
 * turns crimson, and emits an animated pulse ring.
 */
function makeIcon(selected: boolean): L.DivIcon {
  const size = selected ? 20 : 15;
  const fill = selected ? "#b8391f" : "#8a5a2b";
  const ring = "#f6efda";
  const pulse = selected
    ? `<span style="
        position:absolute;left:50%;top:50%;width:${size}px;height:${size}px;
        margin:-${size / 2}px 0 0 -${size / 2}px;border-radius:50%;
        background:${fill};animation:gh-pulse 1.8s ease-out infinite;
      "></span>`
    : "";
  return L.divIcon({
    className: "gh-marker",
    html: `<span style="position:relative;display:block;width:${size}px;height:${size}px;">
      ${pulse}
      <span style="
        position:absolute;inset:0;border-radius:50%;
        background:radial-gradient(circle at 35% 30%, #c9803f, ${fill});
        border:2.5px solid ${ring};
        box-shadow:0 1px 5px rgba(0,0,0,0.45), 0 0 10px ${
          selected ? "rgba(184,57,31,0.7)" : "rgba(138,90,43,0.5)"
        };
      "></span>
    </span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapView({
  mode,
  sites,
  routes,
  year,
  selectedId,
  onSelect,
}: MapViewProps) {
  // Recompute icons only when the site set or selection changes.
  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const s of sites) {
      map.set(s.id, makeIcon(s.id === selectedId));
    }
    return map;
  }, [sites, selectedId]);

  // Cross-fade weights for each border snapshot at the current year.
  const borderWeights = useMemo(() => computeBorderWeights(year), [year]);

  // Label positions are static per snapshot; compute once.
  const labelPositions = useMemo(
    () => BORDER_SNAPSHOTS.map((s) => snapshotCentroid(s.data)),
    []
  );

  const showRoutes = mode === "routes";

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={3}
      maxZoom={9}
      scrollWheelZoom
      className="h-full w-full"
    >
      {/* Basemap. A warm sepia filter (see globals.css) turns this into a
          parchment-toned historical map rather than a modern road atlas. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Empire border snapshots — all mounted, opacity cross-fades by year. */}
      {BORDER_SNAPSHOTS.map((snap, i) => (
        <BorderLayer key={snap.year} data={snap.data} weight={borderWeights[i]} />
      ))}

      {/* Territory labels, fading with their border snapshot. */}
      {BORDER_SNAPSHOTS.map((snap, i) => (
        <BorderLabel
          key={`label-${snap.year}`}
          text={snap.label}
          position={labelPositions[i]}
          weight={borderWeights[i]}
        />
      ))}

      {/* ROUTES — flowing arcs that connect the cities. Drawn beneath the
          markers so the city pins always sit on top. */}
      {showRoutes &&
        routes.map((route) => {
          const style = ROUTE_STYLES[route.route_type];
          const selected = route.id === selectedId;
          return (
            <Fragment key={route.id}>
              {/* Soft glow underlay */}
              <Polyline
                positions={route.positions}
                interactive={false}
                pathOptions={{
                  color: style.color,
                  weight: selected ? 14 : 10,
                  opacity: 0.18,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              {/* Animated dashed line on top */}
              <Polyline
                positions={route.positions}
                pathOptions={{
                  color: style.color,
                  weight: selected ? 5 : 3.5,
                  opacity: 1,
                  lineCap: "round",
                  lineJoin: "round",
                  className: `${style.className}${
                    selected ? " gh-route-selected" : ""
                  }`,
                }}
                eventHandlers={{ click: () => onSelect(route.id) }}
              >
                <Tooltip sticky opacity={1}>
                  {route.name.en}
                </Tooltip>
              </Polyline>
            </Fragment>
          );
        })}

      {/* CITY MARKERS — always visible, in both modes, since the routes
          connect them. Rendered last so they sit above the route lines. */}
      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={icons.get(site.id)}
          eventHandlers={{ click: () => onSelect(site.id) }}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={1}
            className="gh-city-tooltip"
          >
            {site.name.en}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
