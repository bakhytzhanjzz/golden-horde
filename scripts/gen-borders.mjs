/**
 * Generates the Golden Horde border snapshots as GeoJSON.
 *
 * These are stylised, not survey-accurate — medieval steppe frontiers were
 * fuzzy. But instead of plain ellipses we build genuinely irregular outlines
 * with the region's defining features (the Caspian and Aral seas carved out of
 * the south edge, the Crimean peninsula, a ragged northern forest frontier) and
 * show the empire grow, peak, fragment, and collapse across nine eras.
 *
 * Run:  node scripts/gen-borders.mjs
 * Output: data/borders/<year>.json
 *
 * Coordinates are GeoJSON order: [lng, lat].
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "data", "borders");

// ── helpers ────────────────────────────────────────────────────────────────

const round = (n) => Math.round(n * 1000) / 1000;

function centroid(ring) {
  let x = 0,
    y = 0;
  for (const [lng, lat] of ring) {
    x += lng;
    y += lat;
  }
  return [x / ring.length, y / ring.length];
}

/** Scale/translate a ring about its own centroid. */
function transform(ring, { sx = 1, sy = 1, dx = 0, dy = 0 } = {}) {
  const [cx, cy] = centroid(ring);
  return ring.map(([lng, lat]) => [
    cx + (lng - cx) * sx + dx,
    cy + (lat - cy) * sy + dy,
  ]);
}

/**
 * Roughen a coarse ring: subdivide every edge and push the new midpoints
 * perpendicular to the edge by a deterministic amount, turning straight lines
 * into crinkled, coastline-like frontiers. `phase` varies the wiggle per era so
 * successive snapshots don't share an identical silhouette.
 */
function roughen(ring, { amp = 0.4, subdiv = 2, phase = 0 } = {}) {
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    out.push([round(a[0]), round(a[1])]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    for (let k = 1; k <= subdiv; k++) {
      const t = k / (subdiv + 1);
      const mx = a[0] + dx * t;
      const my = a[1] + dy * t;
      // deterministic pseudo-noise from position + phase
      const off =
        amp *
        Math.sin(i * 2.3 + k * 1.9 + phase) *
        (0.6 + 0.4 * Math.cos(i * 1.1 + phase * 0.5));
      out.push([round(mx + px * off), round(my + py * off)]);
    }
  }
  const last = ring[ring.length - 1];
  out.push([round(last[0]), round(last[1])]);
  return out;
}

function close(ring) {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) return [...ring, first];
  return ring;
}

function polygon(ring) {
  return close(ring);
}

// ── base outlines (coarse; roughen() adds the detail) ────────────────────────

// The empire at its greatest extent — the master silhouette other eras derive
// from. Clockwise: ragged northern forest edge (W→E), eastern steppe (N→S),
// then the intricate southern coast: Syr Darya, the Aral notch, the north
// Caspian shore, the Caucasus lobe, Crimea, and the Black Sea coast.
const PEAK = [
  [28, 49], [30, 52], [33, 54.5], [38, 56], [43, 57], [49, 57.8],
  [55, 57.5], [61, 58], [67, 57], [73, 56], [78, 54], [81, 52],
  [82, 50], [81, 48], [79, 46], [76, 45], [73, 45], [70, 44],
  [68.5, 42.8], [66, 43.5], [63, 45], [62, 46.2], [60.5, 45], [59, 46],
  [56, 45.2], [54, 44.5], [52, 45.8], [50, 47], [48, 46.5], [47, 45],
  [45.5, 43.5], [44, 44], [42.5, 45.2], [40, 46], [38.5, 46.6], [37, 45.6],
  [36, 45.2], [35, 45], [34, 45.4], [33, 46.2], [31, 46.6], [29.5, 47],
  [28.5, 48],
];

// Early Ulus of Jochi — the eastern nucleus around the Irtysh, Ishim, Aral, and
// the Syr Darya cities, before Batu's western conquests.
const EARLY = [
  [55, 50], [58, 52.5], [63, 53.5], [69, 53], [75, 52], [80, 50],
  [82, 48], [80, 46], [76, 45], [72, 44.5], [70, 44], [68.5, 42.8],
  [66, 43.5], [63, 45], [61, 46], [59, 45.5], [57, 46.5], [55, 47],
  [54, 49],
];

// Post-Timur (1395): western steppe held, but the empire is frayed and pulled
// back on the north and the far east.
const POST_TIMUR = [
  [29, 48], [32, 51], [37, 53], [43, 54], [49, 54], [55, 53.5],
  [61, 53], [66, 51.5], [69, 49], [70, 46], [68.5, 43.2], [65, 44],
  [62, 45.5], [60, 44.8], [58, 45.5], [55, 44.8], [52, 45.6], [50, 46.8],
  [47.5, 45], [45.5, 43.6], [43.5, 44.2], [41.5, 45.4], [39, 46.2],
  [37, 45.8], [35.5, 45.2], [34, 45.6], [32, 46.4], [30, 47],
];

// Fragmentation (1430): Crimea and Kazan splitting away — the core retracts to
// the Volga–Don steppe and the western grasslands. No Crimean tip, no far NE.
const FRAGMENTED = [
  [30, 49], [33, 52], [38, 53], [44, 53.5], [49, 52.5], [53, 51],
  [55, 49], [54, 47], [52, 45.8], [50, 47], [48, 46.5], [47, 45],
  [45.5, 43.8], [44, 44.5], [42, 45.5], [40, 46.3], [38, 46.8],
  [36.5, 47], [34, 48], [31, 48],
];

// The Great Horde (1466): a lower-Volga and Don-steppe rump.
const GREAT_HORDE = [
  [38, 48], [41, 50], [45, 50.5], [49, 49.5], [52, 48], [52.5, 46.5],
  [50, 46], [48, 46.8], [46, 45.5], [44, 46], [42, 46.8], [40, 47],
  [38.5, 47.2],
];

// The final remnant (1502): a shrunken patch around the old Volga capitals.
const REMNANT = [
  [43, 47], [45, 48.5], [48, 48.5], [50.5, 47.5], [51, 46], [49, 45.3],
  [46.5, 45.5], [44.5, 46],
];

// ── era definitions ──────────────────────────────────────────────────────────

const GOLDEN = "Алтын Орда · Golden Horde";
const GREAT = "Ұлы Орда · Great Horde";

const ERAS = [
  {
    year: 1224,
    label: "Жошы Ұлысы · Ulus of Jochi",
    name: "Ulus of Jochi — the eastern nucleus",
    ring: roughen(EARLY, { amp: 0.45, phase: 0.2 }),
  },
  {
    year: 1240,
    label: GOLDEN,
    name: "Golden Horde — Batu's western conquests",
    // Slightly smaller and pushed south vs. the peak (still expanding north).
    ring: roughen(transform(PEAK, { sx: 0.97, sy: 0.95, dy: -0.4 }), {
      amp: 0.5,
      phase: 1.1,
    }),
  },
  {
    year: 1266,
    label: GOLDEN,
    name: "Golden Horde — independent under Mengu-Timur",
    ring: roughen(transform(PEAK, { sx: 0.99, sy: 0.99 }), {
      amp: 0.45,
      phase: 2.0,
    }),
  },
  {
    year: 1313,
    label: GOLDEN,
    name: "Golden Horde — Ozbeg Khan, Islam adopted",
    ring: roughen(transform(PEAK, { sx: 1.01, sy: 1.0 }), {
      amp: 0.42,
      phase: 3.3,
    }),
  },
  {
    year: 1357,
    label: GOLDEN,
    name: "Golden Horde — economic peak under Jani Beg",
    ring: roughen(transform(PEAK, { sx: 1.03, sy: 1.01 }), {
      amp: 0.4,
      phase: 4.6,
    }),
  },
  {
    year: 1395,
    label: GOLDEN,
    name: "Golden Horde — broken by Timur",
    ring: roughen(POST_TIMUR, { amp: 0.5, phase: 5.2 }),
  },
  {
    year: 1430,
    label: GOLDEN,
    name: "Golden Horde — fragmenting into successor khanates",
    ring: roughen(FRAGMENTED, { amp: 0.5, phase: 6.1 }),
  },
  {
    year: 1466,
    label: GREAT,
    name: "Great Horde — lower-Volga rump",
    ring: roughen(GREAT_HORDE, { amp: 0.45, phase: 7.0 }),
  },
  {
    year: 1502,
    label: GREAT,
    name: "Great Horde — the final remnant",
    ring: roughen(REMNANT, { amp: 0.4, phase: 8.0 }),
  },
];

// ── write files ──────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

for (const era of ERAS) {
  const fc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { year: era.year, name: era.name },
        geometry: { type: "Polygon", coordinates: [polygon(era.ring)] },
      },
    ],
  };
  const file = join(OUT_DIR, `${era.year}.json`);
  writeFileSync(file, JSON.stringify(fc, null, 0) + "\n");
  console.log(`wrote ${file} (${era.ring.length} pts)`);
}

console.log(`\n${ERAS.length} border snapshots generated.`);
