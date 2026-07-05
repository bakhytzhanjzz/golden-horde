"use client";

import { useStrings } from "@/lib/i18n";

type ScoreBadgeProps = {
  score: number;
  answered: number;
  total: number;
};

export default function ScoreBadge({ score, answered, total }: ScoreBadgeProps) {
  const t = useStrings();
  return (
    <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-[#d8cba8] bg-[#f4ecd8]/95 px-4 py-2 shadow-lg backdrop-blur-sm">
      <span className="text-lg leading-none">🏅</span>
      <div className="leading-tight">
        <div className="text-sm font-bold text-[#3a2f1b]">
          {score} {score === 1 ? t.point : t.points}
        </div>
        <div className="text-[11px] text-[#9a8860]">
          {answered}/{total} {t.answered}
        </div>
      </div>
    </div>
  );
}
