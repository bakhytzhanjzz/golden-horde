"use client";

import { BORDER_SNAPSHOTS, YEAR_MAX, YEAR_MIN } from "@/lib/borders";

type TimelineSliderProps = {
  year: number;
  onChange: (year: number) => void;
};

// Key historical moments to mark on the track (founding → fall).
const TICKS = [1206, 1240, 1266, 1313, 1357, 1395, 1420, 1460, 1502];

export default function TimelineSlider({ year, onChange }: TimelineSliderProps) {
  const pct = ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;
  const snapshotYears = new Set(BORDER_SNAPSHOTS.map((s) => s.year));

  return (
    <div className="pointer-events-auto w-full rounded-xl border border-[#d8cba8] bg-[#f4ecd8]/95 px-5 py-4 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
          Timeline
        </span>
        <span className="text-2xl font-bold tabular-nums text-[#3a2f1b]">
          {year}
        </span>
      </div>

      <div className="relative">
        {/* Filled portion of the track */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#d8cba8]" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#8a5a2b]"
          style={{ width: `${pct}%` }}
        />

        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={year}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Year"
          className="relative z-10 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#f4ecd8]
            [&::-webkit-slider-thumb]:bg-[#b8391f] [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#f4ecd8]
            [&::-moz-range-thumb]:bg-[#b8391f]"
        />
      </div>

      {/* Tick labels */}
      <div className="relative mt-1 h-4">
        {TICKS.map((t) => {
          const left = ((t - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;
          const isSnapshot = snapshotYears.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              title={
                isSnapshot ? `${t} — border snapshot` : `Jump to ${t}`
              }
              style={{ left: `${left}%` }}
              className={`absolute -translate-x-1/2 text-[10px] tabular-nums transition-colors hover:text-[#b8391f] ${
                isSnapshot
                  ? "font-bold text-[#8a5a2b]"
                  : "text-[#9a8860]"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
