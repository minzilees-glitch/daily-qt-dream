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
}) {
  const prev = addMonths(value, -1);
  const next = addMonths(value, 1);
  const canPrev = !min || prev >= min;
  const canNext = !max || next <= max;

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        aria-label="이전 달"
        disabled={!canPrev}
        onClick={() => canPrev && onChange(prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-text-main shadow-none transition disabled:opacity-30"
      >
        <ChevronLeft size={18} strokeWidth={1.75} />
      </button>
      <div className="flex min-w-0 items-center justify-center gap-2">
        <p className="text-[17px] font-semibold tracking-tight text-text-main">
          {monthOnly ? formatMonthOnly(value) : formatMonthLabel(value)}
        </p>
        {showTodayButton && onToday ? (
          <button
            type="button"
            onClick={onToday}
            className="shrink-0 text-[13px] font-semibold text-cta transition hover:brightness-95"
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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-text-main shadow-none transition disabled:opacity-30"
      >
        <ChevronRight size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}
