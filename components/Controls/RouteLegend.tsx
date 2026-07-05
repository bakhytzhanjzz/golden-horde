"use client";

import { ROUTE_STYLES } from "@/lib/routes";
import type { RouteType } from "@/lib/types";

const ORDER: RouteType[] = ["trade", "military", "postal"];

export default function RouteLegend() {
  return (
    <div className="pointer-events-auto rounded-xl border border-[#d8cba8] bg-[#f4ecd8]/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
        Routes
      </p>
      <ul className="space-y-1.5">
        {ORDER.map((type) => {
          const s = ROUTE_STYLES[type];
          return (
            <li key={type} className="flex items-center gap-2.5 text-sm">
              <span
                className="inline-block h-0.5 w-6 rounded-full"
                style={{
                  backgroundColor: s.color,
                  boxShadow: `0 0 6px ${s.glow}`,
                }}
              />
              <span className="text-[#4a3f28]">{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
