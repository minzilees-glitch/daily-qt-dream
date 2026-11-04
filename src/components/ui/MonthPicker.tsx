"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, formatMonthLabel, formatMonthOnly } from "@/lib/dates";

export function MonthPicker({
  value,
  onChange,
  min,
  max,
  monthOnly = false,
  light = false,
  /** Ivory rounded-full pill; inner chrome matches 나의 QT (range) with black text. */
  capsule = false,
  /** `title` = under page headers (25px); `range` = match scripture range line / 나의 QT. */
  size = "title",
}: {
  value: string;
  onChange: (ym: string) => void;
  min?: string;
  max?: string;
  /** Show "11월" instead of "2026년 11월". */
  monthOnly?: boolean;
  /** High-contrast controls for blue sky backgrounds. */
  light?: boolean;
  capsule?: boolean;
  size?: "title" | "range";
}) {
  const prev = addMonths(value, -1);
  const next = addMonths(value, 1);
  const canPrev = !min || prev >= min;
  const canNext = !max || next <= max;
  // Capsule mirrors 나의 QT `size="range"` metrics exactly.
  const isRange = size === "range" || capsule;
  const labelClass = isRange
    ? "text-[17px] font-semibold tracking-[0.02em]"
    : "text-[25px] font-semibold tracking-[0.02em]";
  const chevronBox = isRange ? "h-8 w-8" : "h-9 w-9";
  const chevronIcon = isRange ? 18 : 22;
  // Capsule: black on ivory. Otherwise light = white on sky.
  const onLight = light && !capsule;
  const ink = onLight ? "text-white" : "text-black";
  // Tight chevrons hugging the month label — flat, no shadow.
  const chevronClass = `flex ${chevronBox} shrink-0 items-center justify-center rounded-full bg-transparent ${ink} shadow-none transition disabled:opacity-30`;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`inline-flex items-center gap-1.5 ${
          capsule ? "rounded-full bg-ivory px-3 py-1.5 shadow-none" : ""
        }`}
      >
        <button
          type="button"
          aria-label="이전 달"
          disabled={!canPrev}
          onClick={() => canPrev && onChange(prev)}
          className={chevronClass}
        >
          <ChevronLeft size={chevronIcon} strokeWidth={2.5} />
        </button>
        <p className={`whitespace-nowrap text-center ${labelClass} ${ink}`}>
          {monthOnly ? formatMonthOnly(value) : formatMonthLabel(value)}
        </p>
        <button
          type="button"
          aria-label="다음 달"
          disabled={!canNext}
          onClick={() => canNext && onChange(next)}
          className={chevronClass}
        >
          <ChevronRight size={chevronIcon} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
