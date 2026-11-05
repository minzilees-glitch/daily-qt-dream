"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  addDays,
  daysInMonth,
  formatYmd,
  isFutureDate,
  todaySeoul,
  weekdayIndexMonFirst,
  yearMonthOf,
} from "@/lib/dates";
import { LightIcon } from "@/components/ui/LightIcon";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const WHEEL_THRESHOLD = 48;
const TOUCH_THRESHOLD = 40;

/**
 * Build Mon-first month grid, then optionally collapse to ~2 recent weeks.
 * Collapsed: 2 week-rows around the focus date within the viewed month
 * (capped at today for the current month).
 */
function buildWeekRows(yearMonth: string): (number | null)[][] {
  const [y, m] = yearMonth.split("-").map(Number);
  const total = daysInMonth(y, m);
  const first = formatYmd(y, m, 1);
  const offset = weekdayIndexMonFirst(first);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function collapsedWeekRows(
  yearMonth: string,
  rows: (number | null)[][],
  today: string,
  focusDate: string,
): (number | null)[][] {
  const [y, m] = yearMonth.split("-").map(Number);
  const todayYm = yearMonthOf(today);
  let focusDay =
    yearMonthOf(focusDate) === yearMonth
      ? Number(focusDate.slice(8, 10))
      : yearMonth === todayYm
        ? Number(today.slice(8, 10))
        : daysInMonth(y, m);

  if (yearMonth === todayYm) {
    focusDay = Math.min(focusDay, Number(today.slice(8, 10)));
  }

  let lastRelevant = -1;
  rows.forEach((row, ri) => {
    for (const day of row) {
      if (day != null && day <= focusDay) lastRelevant = ri;
    }
  });
  if (lastRelevant < 0) return rows.slice(0, Math.min(2, rows.length));
  const start = Math.max(0, lastRelevant - 1);
  return rows.slice(start, lastRelevant + 1);
}

/** Whether `date` appears in the collapsed (~2 week) view for its month. */
export function isDateInCollapsedCalendar(
  date: string,
  today = todaySeoul(),
): boolean {
  const ym = yearMonthOf(date);
  const day = Number(date.slice(8, 10));
  const rows = collapsedWeekRows(ym, buildWeekRows(ym), today, date);
  return rows.some((row) => row.includes(day));
}

export function QtCalendar({
  yearMonth,
  completedDates,
  selectedDate,
  onSelect,
  /** When true, only render ~2 recent weeks (accordion collapsed). */
  collapsed = false,
  /** Date that just earned a light — one-shot ray burst on that cell. */
  justEarnedDate = null,
  /** Optional YYYY-MM bounds for week scroll (MonthPicker range). */
  minYearMonth,
  maxYearMonth,
}: {
  yearMonth: string;
  completedDates: Set<string>;
  selectedDate?: string | null;
  onSelect?: (date: string) => void;
  collapsed?: boolean;
  justEarnedDate?: string | null;
  minYearMonth?: string;
  maxYearMonth?: string;
}) {
  const [y, m] = yearMonth.split("-").map(Number);
  const today = todaySeoul();
  const focusDate =
    selectedDate && yearMonthOf(selectedDate) === yearMonth
      ? selectedDate
      : yearMonth === yearMonthOf(today)
        ? today
        : formatYmd(y, m, daysInMonth(y, m));
  const allRows = buildWeekRows(yearMonth);
  const rows = collapsed
    ? collapsedWeekRows(yearMonth, allRows, today, focusDate)
    : allRows;

  const rootRef = useRef<HTMLDivElement>(null);
  const wheelAccRef = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const touchMoved = useRef(false);

  const stepWeek = useCallback(
    (direction: -1 | 1) => {
      if (!onSelect) return;
      const base =
        selectedDate && yearMonthOf(selectedDate) === yearMonth
          ? selectedDate
          : focusDate;
      const next = addDays(base, direction * 7);
      const nextYm = yearMonthOf(next);
      if (minYearMonth && nextYm < minYearMonth) return;
      if (maxYearMonth && nextYm > maxYearMonth) return;
      onSelect(next);
    },
    [
      focusDate,
      maxYearMonth,
      minYearMonth,
      onSelect,
      selectedDate,
      yearMonth,
    ],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !onSelect) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      wheelAccRef.current += e.deltaY;
      if (Math.abs(wheelAccRef.current) < WHEEL_THRESHOLD) return;
      const dir: -1 | 1 = wheelAccRef.current > 0 ? 1 : -1;
      wheelAccRef.current = 0;
      stepWeek(dir);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onSelect, stepWeek]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
    touchMoved.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const yPos = e.touches[0]?.clientY;
    if (yPos == null) return;
    if (Math.abs(yPos - touchStartY.current) > 12) touchMoved.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start == null || !touchMoved.current) return;
    const end = e.changedTouches[0]?.clientY;
    if (end == null) return;
    const dy = end - start;
    if (Math.abs(dy) < TOUCH_THRESHOLD) return;
    // Finger up → next week (same as wheel down); finger down → previous week
    stepWeek(dy < 0 ? 1 : -1);
  };

  return (
    <div
      ref={rootRef}
      className="touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="mb-2 grid grid-cols-7 gap-2 text-center type-micro text-text-secondary">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 overflow-visible touch-pan-y">
        {rows.flatMap((row, ri) =>
          row.map((day, ci) => {
            const idx = ri * 7 + ci;
            if (day == null) {
              return <div key={`e-${yearMonth}-${idx}`} className="aspect-square" />;
            }
            const date = formatYmd(y, m, day);
            const done = completedDates.has(date);
            const future = isFutureDate(date, today);
            const selected = selectedDate === date;
            const isToday = date === today;

            return (
              <button
                key={date}
                type="button"
                disabled={future && !onSelect}
                onClick={() => onSelect?.(date)}
                aria-label={`${date}${done ? ", 완료" : ""}`}
                aria-pressed={selected}
                className="group relative flex min-h-[44px] aspect-square items-center justify-center overflow-visible touch-pan-y transition"
              >
                <span
                  className={`relative mx-auto flex h-full w-[calc(100%-2px)] flex-col items-center justify-center gap-1 py-2 text-center ${
                    selected
                      ? "!text-white"
                      : isToday
                        ? "text-cta"
                        : done
                          ? "text-text-main"
                          : future
                            ? "text-text-secondary/40"
                            : "text-text-main"
                  }`}
                >
                  {/* Selection / light-active fill — 2px up vs date copy */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-x-0 top-[-2px] bottom-[2px] rounded-[var(--radius-day)] ${
                      selected
                        ? "bg-cta shadow-none"
                        : isToday
                          ? "bg-cta/18 group-hover:bg-cta/24"
                          : done
                            ? "bg-white"
                            : future
                              ? ""
                              : "group-hover:bg-white/70"
                    }`}
                  />
                  <span
                    className={`relative z-[1] text-center text-label leading-none font-medium tabular-nums ${
                      selected
                        ? ""
                        : isToday
                          ? "font-semibold text-cta"
                          : done
                            ? "text-sky"
                            : ""
                    }`}
                  >
                    {day}
                  </span>
                  {done ? (
                    <span className="relative z-[1] mx-auto flex h-5 w-5 shrink-0 -translate-y-[2px] items-center justify-center overflow-visible">
                      <LightIcon
                        tone="active"
                        size={16}
                        label="빛 수집됨"
                        justEarned={justEarnedDate === date}
                      />
                    </span>
                  ) : (
                    <span className="relative z-[1] mx-auto h-5 w-5 shrink-0 -translate-y-[2px]" />
                  )}
                </span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
