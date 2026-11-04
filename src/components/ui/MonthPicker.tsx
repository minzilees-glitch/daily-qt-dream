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
  /** Ivory mirrored capsule; black ink (overrides `light`). Shared by 나의 QT / 우리순 / 랭킹. */
  capsule = false,
}: {
  value: string;
  onChange: (ym: string) => void;
  min?: string;
  max?: string;
  /** Show "11월" instead of "2026년 11월". */
  monthOnly?: boolean;
  /** White ink on sky backgrounds. Ignored when `capsule`. */
  light?: boolean;
  capsule?: boolean;
}) {
  const prev = addMonths(value, -1);
  const next = addMonths(value, 1);
  const canPrev = !min || prev >= min;
  const canNext = !max || next <= max;
  // Color only: capsule → black on ivory; light → white on sky; else black.
  const onLight = light && !capsule;
  const ink = onLight ? "text-white" : "text-black";
  const chevronClass = `relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transparent ${ink} shadow-none transition disabled:opacity-30`;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`inline-flex items-center gap-1.5 ${
          capsule ? "month-capsule relative px-3 py-1.5" : ""
        }`}
      >
        <button
          type="button"
          aria-label="이전 달"
          disabled={!canPrev}
          onClick={() => canPrev && onChange(prev)}
          className={chevronClass}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <p className={`relative z-[1] type-month whitespace-nowrap text-center ${ink}`}>
          {monthOnly ? formatMonthOnly(value) : formatMonthLabel(value)}
        </p>
        <button
          type="button"
          aria-label="다음 달"
          disabled={!canNext}
          onClick={() => canNext && onChange(next)}
          className={chevronClass}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
