"use client";

const ENTRIES = [
  { icon: "🏰", label: "City", color: "#8a5a2b" },
  { icon: "👑", label: "Capital", color: "#6b4c0a" },
  { icon: "⚔️", label: "Battle site", color: "#8b1a1a" },
  { icon: "☽", label: "Sacred site", color: "#2a5e6e" },
  { icon: "⚓", label: "Port / trading post", color: "#1a4a6b" },
];

export default function MarkerLegend() {
  return (
    <div className="pointer-events-auto rounded-xl border border-[#d8cba8] bg-[#f4ecd8]/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
        Sites
      </p>
      <ul className="space-y-1.5">
        {ENTRIES.map(({ icon, label, color }) => (
          <li key={label} className="flex items-center gap-2.5 text-sm">
            <span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px]"
              style={{
                background: `radial-gradient(circle at 35% 30%, #ede0c0, ${color})`,
                border: "1.5px solid #f6efda",
                boxShadow: `0 1px 4px rgba(0,0,0,0.4), 0 0 6px ${color}88`,
              }}
            >
              {icon}
            </span>
            <span className="text-[#4a3f28]">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
