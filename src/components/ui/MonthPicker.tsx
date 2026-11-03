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
  /** `title` = page headers (22px); `range` = match scripture range line (16px). */
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
  size?: "title" | "range";
}) {
  const prev = addMonths(value, -1);
  const next = addMonths(value, 1);
  const canPrev = !min || prev >= min;
  const canNext = !max || next <= max;
  const isRange = size === "range";
  const labelClass = isRange
    ? "text-[16px] font-semibold tracking-[0.02em]"
    : "text-[22px] font-semibold tracking-[0.02em]";
  const chevronBox = isRange ? "h-8 w-8" : "h-9 w-9";
  const chevronIcon = isRange ? 18 : 22;
  // Tight chevrons hugging the month label — flat, no shadow.
  const chevronClass = light
    ? `flex ${chevronBox} shrink-0 items-center justify-center rounded-full bg-transparent text-white shadow-none transition disabled:opacity-30`
    : `flex ${chevronBox} shrink-0 items-center justify-center rounded-full bg-transparent text-text-main shadow-none transition disabled:opacity-30`;

  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          aria-label="이전 달"
          disabled={!canPrev}
          onClick={() => canPrev && onChange(prev)}
          className={chevronClass}
        >
          <ChevronLeft size={chevronIcon} strokeWidth={2.5} />
        </button>
        <p
          className={`whitespace-nowrap text-center ${labelClass} ${
            light ? "text-white" : "text-text-main"
          }`}
        >
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
