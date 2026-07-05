"use client";

import { useStrings } from "@/lib/i18n";

export type MapMode = "sites" | "routes";

type ModeToggleProps = {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const t = useStrings();
  const OPTIONS: { value: MapMode; label: string }[] = [
    { value: "sites", label: t.sites },
    { value: "routes", label: t.routes },
  ];
  return (
    <div
      role="tablist"
      aria-label="Map layer"
      className="pointer-events-auto inline-flex rounded-full border border-[#d8cba8] bg-[#f4ecd8]/95 p-1 shadow-lg backdrop-blur-sm"
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-[#8a5a2b] text-[#f4ecd8] shadow"
                : "text-[#7a6a48] hover:text-[#3a2f1b]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
