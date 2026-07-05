"use client";

import type { Quiz as QuizData } from "@/lib/types";
import { useStrings } from "@/lib/i18n";

type QuizProps = {
  quiz: QuizData;
  /** The option index the user previously picked, or undefined if unanswered. */
  answeredIndex: number | undefined;
  onAnswer: (index: number) => void;
};

export default function Quiz({ quiz, answeredIndex, onAnswer }: QuizProps) {
  const t = useStrings();
  const answered = answeredIndex !== undefined;
  const correct = answered && answeredIndex === quiz.answer;

  return (
    <section className="rounded-lg border border-[#d8cba8] bg-[#efe6cf] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">🎯</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
          {t.quickQuiz}
        </h3>
      </div>

      <p className="mb-3 text-[15px] font-medium leading-snug text-[#3a2f1b]">
        {quiz.question}
      </p>

      <ul className="space-y-2">
        {quiz.options.map((option, i) => {
          const isCorrect = i === quiz.answer;
          const isChosen = i === answeredIndex;

          // Decide the visual state of each option once answered.
          let cls =
            "border-[#d8cba8] bg-[#f4ecd8] text-[#4a3f28] hover:border-[#8a5a2b] hover:bg-[#efe1c4]";
          if (answered) {
            if (isCorrect) {
              cls = "border-green-600 bg-green-100 text-green-900";
            } else if (isChosen) {
              cls = "border-red-500 bg-red-100 text-red-900";
            } else {
              cls = "border-[#e0d5b6] bg-[#f4ecd8]/60 text-[#9a8860]";
            }
          }

          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onAnswer(i)}
                className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${cls} ${
                  answered ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{option}</span>
                {answered && isCorrect && <span aria-hidden>✓</span>}
                {answered && isChosen && !isCorrect && <span aria-hidden>✕</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <p
          className={`mt-3 text-sm font-semibold ${
            correct ? "text-green-700" : "text-red-600"
          }`}
        >
          {correct
            ? t.correct
            : `${t.notQuitePrefix} ${String.fromCharCode(65 + quiz.answer)}.`}
        </p>
      )}
    </section>
  );
}
