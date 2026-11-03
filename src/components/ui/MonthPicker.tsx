"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, formatMonthLabel, formatMonthOnly } from "@/lib/dates";

export function MonthPicker({
  value,
  onChange,
  min,
  max,
  monthOnly = false,
  showTodayButton = false,
  onToday,
  light = false,
}: {
  value: string;
  onChange: (ym: string) => void;
  min?: string;
  max?: string;
  /** Show "11월" instead of "2026년 11월". */
  monthOnly?: boolean;
  /** Optional 「오늘」 control next to the month title. */
  showTodayButton?: boolean;
  onToday?: () => void;
  /** High-contrast controls for blue sky backgrounds. */
  light?: boolean;
}) {
  const prev = addMonths(value, -1);
  const next = addMonths(value, 1);
  const canPrev = !min || prev >= min;
  const canNext = !max || next <= max;
  const chevronClass = light
    ? "flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white shadow-none transition disabled:opacity-30"
    : "flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-text-main shadow-none transition disabled:opacity-30";

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        aria-label="이전 달"
        disabled={!canPrev}
        onClick={() => canPrev && onChange(prev)}
        className={chevronClass}
      >
        <ChevronLeft size={18} strokeWidth={1.75} />
      </button>
      <div className="flex min-w-0 items-center justify-center gap-4">
        <p
          className={`text-[17px] font-semibold tracking-tight ${
            light ? "text-white" : "text-text-main"
          }`}
        >
          {monthOnly ? formatMonthOnly(value) : formatMonthLabel(value)}
        </p>
        {showTodayButton && onToday ? (
          <button
            type="button"
            onClick={onToday}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold tracking-tight transition hover:brightness-95 ${
              light
                ? "bg-white/25 text-white"
                : "bg-sky-light text-cta"
            }`}
          >
            오늘
          </button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="다음 달"
        disabled={!canNext}
        onClick={() => canNext && onChange(next)}
        className={chevronClass}
      >
        <ChevronRight size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}
