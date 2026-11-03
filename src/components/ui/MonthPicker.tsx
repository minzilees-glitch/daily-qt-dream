"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, formatMonthLabel } from "@/lib/dates";

export function MonthPicker({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (ym: string) => void;
  min?: string;
  max?: string;
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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-text-main shadow-[0_6px_16px_rgba(36,55,70,0.06)] transition disabled:opacity-30"
      >
        <ChevronLeft size={18} strokeWidth={1.75} />
      </button>
      <p className="text-[17px] font-semibold tracking-tight text-text-main">
        {formatMonthLabel(value)}
      </p>
      <button
        type="button"
        aria-label="다음 달"
        disabled={!canNext}
        onClick={() => canNext && onChange(next)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-text-main shadow-[0_6px_16px_rgba(36,55,70,0.06)] transition disabled:opacity-30"
      >
        <ChevronRight size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}
