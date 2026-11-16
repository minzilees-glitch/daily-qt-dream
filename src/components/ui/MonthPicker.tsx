"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatMonthOnly,
  yearMonthOf,
} from "@/lib/dates";

export function MonthPicker({
  value,
  onChange,
  min,
  max,
  monthOnly = false,
  light = false,
  /** Glass month-capsule chrome; black ink (overrides `light`). Shared by 나의 QT들 / 우리순 / 랭킹. */
  capsule = false,
  /** Start-align the control (premium history header). Default centers. */
  align = "center",
  /**
   * Chevron step unit. `week` uses `focusDate` + `onFocusDateChange`
   * (history weekly calendar). Default `month`.
   */
  step = "month",
  /** Anchor date for week stepping (YYYY-MM-DD). Required when step="week". */
  focusDate,
  onFocusDateChange,
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
  align?: "center" | "start";
  step?: "month" | "week";
  focusDate?: string;
  onFocusDateChange?: (ymd: string) => void;
}) {
  const weekMode = step === "week" && !!focusDate && !!onFocusDateChange;
  const prevMonth = addMonths(value, -1);
  const nextMonth = addMonths(value, 1);
  const prevWeek = weekMode ? addDays(focusDate, -7) : "";
  const nextWeek = weekMode ? addDays(focusDate, 7) : "";

  const canPrev = weekMode
    ? !min || yearMonthOf(prevWeek) >= min
    : !min || prevMonth >= min;
  const canNext = weekMode
    ? !max || yearMonthOf(nextWeek) <= max
    : !max || nextMonth <= max;

  // Color only: capsule → black on ivory; light → white on sky; else black.
  const onLight = light && !capsule;
  const ink = onLight ? "text-white" : "text-black";
  const chevronClass = `relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transparent ${ink} shadow-none transition disabled:opacity-30`;

  const goPrev = () => {
    if (!canPrev) return;
    if (weekMode) onFocusDateChange(prevWeek);
    else onChange(prevMonth);
  };

  const goNext = () => {
    if (!canNext) return;
    if (weekMode) onFocusDateChange(nextWeek);
    else onChange(nextMonth);
  };

  return (
    <div
      className={`flex items-center ${
        align === "start" ? "justify-start" : "justify-center"
      }`}
    >
      <div
        className={`inline-flex items-center gap-1.5 ${
          capsule ? "month-capsule relative px-3 py-1.5" : ""
        }`}
      >
        <button
          type="button"
          aria-label={weekMode ? "이전 주" : "이전 달"}
          disabled={!canPrev}
          onClick={goPrev}
          className={chevronClass}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <p className={`relative z-[1] type-month whitespace-nowrap text-center ${ink}`}>
          {monthOnly ? formatMonthOnly(value) : formatMonthLabel(value)}
        </p>
        <button
          type="button"
          aria-label={weekMode ? "다음 주" : "다음 달"}
          disabled={!canNext}
          onClick={goNext}
          className={chevronClass}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
