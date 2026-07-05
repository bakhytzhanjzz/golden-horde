"use client";

import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/strings";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "kz", label: "ҚАЗ" },
  { value: "en", label: "ENG" },
];

export default function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language"
      className="pointer-events-auto inline-flex rounded-full border border-[#d8cba8] bg-[#f4ecd8]/95 p-1 shadow-md backdrop-blur-sm"
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              active
                ? "bg-[#8a5a2b] text-[#f4ecd8]"
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
