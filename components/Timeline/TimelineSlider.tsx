"use client";

import { BORDER_SNAPSHOTS, YEAR_MAX, YEAR_MIN } from "@/lib/borders";
import { useLang, useStrings } from "@/lib/i18n";
import { rulerAt, rulerName, rulerNote } from "@/lib/rulers";

type TimelineSliderProps = {
  year: number;
  onChange: (year: number) => void;
  playing: boolean;
  atEnd: boolean;
  onTogglePlay: () => void;
};

// Tick marks align with the border snapshots, so every labelled year is a
// moment the map's territory actually changes.
const TICKS = BORDER_SNAPSHOTS.map((s) => s.year);

export default function TimelineSlider({
  year,
  onChange,
  playing,
  atEnd,
  onTogglePlay,
}: TimelineSliderProps) {
  const t = useStrings();
  const { lang } = useLang();
  const snapshotYears = new Set(BORDER_SNAPSHOTS.map((s) => s.year));
  const ruler = rulerAt(year);

  // The range thumb is 20px wide, so its centre travels within (track − 20px),
  // insetting 10px at each end. Position the fill and ticks the same way so
  // they line up with the handle rather than the raw track width.
  const THUMB = 20;
  const posFor = (yr: number) => {
    const frac = (yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
    return `calc(${frac} * (100% - ${THUMB}px) + ${THUMB / 2}px)`;
  };

  const playLabel = playing ? t.pause : atEnd ? t.replay : t.play;
  const playGlyph = playing ? "⏸" : atEnd ? "↻" : "▶";

  return (
    <div className="pointer-events-auto w-full rounded-xl border border-[#d8cba8] bg-[#f4ecd8]/95 px-5 py-4 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playLabel}
            title={playLabel}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-sm transition-colors ${
              playing
                ? "bg-[#b8391f] text-[#f4ecd8] hover:bg-[#a02f18]"
                : "bg-[#8a5a2b] text-[#f4ecd8] hover:bg-[#764a22]"
            }`}
          >
            <span aria-hidden>{playGlyph}</span>
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
            {t.timeline}
          </span>
        </div>
        <span className="text-2xl font-bold tabular-nums text-[#3a2f1b]">
          {year}
        </span>
      </div>

      {/* Reigning ruler — puts a human face on the current year. */}
      {ruler && (
        <div className="mb-3 flex items-start gap-2 border-b border-[#e4d9bc] pb-2.5">
          <span className="mt-0.5 text-base leading-none" aria-hidden>
            {ruler.interregnum ? "⚔️" : "👑"}
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-sm font-bold text-[#3a2f1b]">
                {rulerName(ruler, lang)}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-[#9a8860]">
                {ruler.from}–{ruler.to}
              </span>
            </div>
            <p className="truncate text-[11px] leading-snug text-[#7a6a48]">
              {rulerNote(ruler, lang)}
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Filled portion of the track */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#d8cba8]" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#8a5a2b]"
          style={{ width: posFor(year) }}
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
        {TICKS.map((yr) => {
          const isSnapshot = snapshotYears.has(yr);
          return (
            <button
              key={yr}
              type="button"
              onClick={() => onChange(yr)}
              title={String(yr)}
              style={{ left: posFor(yr) }}
              className={`absolute -translate-x-1/2 text-[10px] tabular-nums transition-colors hover:text-[#b8391f] ${
                isSnapshot ? "font-bold text-[#8a5a2b]" : "text-[#9a8860]"
              }`}
            >
              {yr}
            </button>
          );
        })}
      </div>
    </div>
  );
}
