"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  addDays,
  daysInMonth,
  formatYmd,
  isFutureDate,
  todaySeoul,
  weekDatesMonFirst,
  weekdayIndexMonFirst,
  yearMonthOf,
} from "@/lib/dates";
import { LightIcon } from "@/components/ui/LightIcon";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const WHEEL_THRESHOLD = 48;
const TOUCH_THRESHOLD = 40;

/**
 * Build Mon-first month grid, then optionally collapse to ~2 recent weeks.
 * Collapsed (legacy helper): 2 week-rows around the focus date within the viewed month
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
  /** When true, render a single premium week strip (accordion collapsed). */
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
    stepWeek(dy < 0 ? 1 : -1);
  };

  const weekDates = weekDatesMonFirst(focusDate);
  const allRows = buildWeekRows(yearMonth);

  return (
    <div
      ref={rootRef}
      className="touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {collapsed ? (
        <div
          key={`week-${weekDates[0]}`}
          className="premium-cal-month-anim grid grid-cols-7 gap-1.5"
        >
          {weekDates.map((date, i) => {
            const day = Number(date.slice(8, 10));
            const inMonth = yearMonthOf(date) === yearMonth;
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
                className={`premium-cal-day relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 transition ${
                  selected ? "premium-cal-day-selected" : ""
                } ${!inMonth ? "opacity-40" : ""}`}
              >
                <span
                  className={`type-micro ${
                    selected
                      ? "font-semibold text-[var(--premium-ink)]"
                      : "text-white/45"
                  }`}
                >
                  {WEEKDAYS[i]}
                </span>
                <span
                  className={`relative z-[1] text-[17px] font-semibold tabular-nums leading-none ${
                    selected
                      ? "text-[var(--premium-ink)]"
                      : isToday
                        ? "text-white"
                        : future
                          ? "text-white/35"
                          : "text-white"
                  }`}
                >
                  {day}
                </span>
                <span className="relative z-[1] flex h-4 w-4 items-center justify-center">
                  {done ? (
                    <LightIcon
                      tone={selected ? "active" : "white"}
                      size={14}
                      rays={false}
                      label="빛 수집됨"
                      justEarned={justEarnedDate === date}
                    />
                  ) : selected ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[var(--premium-ink)]/35"
                      aria-hidden
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div key={`month-${yearMonth}`} className="premium-cal-month-anim">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center type-micro text-white/40">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 gap-x-1 overflow-visible touch-pan-y">
            {allRows.flatMap((row, ri) =>
              row.map((day, ci) => {
                const idx = ri * 7 + ci;
                if (day == null) {
                  return (
                    <div
                      key={`e-${yearMonth}-${idx}`}
                      className="aspect-square"
                    />
                  );
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
                    className="group relative flex min-h-[44px] aspect-square items-center justify-center overflow-visible touch-pan-y"
                  >
                    <span
                      className={`relative flex h-[42px] w-[42px] flex-col items-center justify-center rounded-full transition ${
                        selected ? "premium-cal-glow" : ""
                      }`}
                    >
                      <span
                        className={`relative z-[1] text-center text-[15px] leading-none font-semibold tabular-nums ${
                          selected
                            ? "text-[var(--premium-ink)]"
                            : isToday
                              ? "text-white"
                              : future
                                ? "text-white/30"
                                : "text-white"
                        }`}
                      >
                        {day}
                      </span>
                      {done ? (
                        <span className="relative z-[1] mt-0.5 flex h-3.5 w-3.5 items-center justify-center">
                          <span
                            className="absolute h-1.5 w-1.5 rounded-full bg-[var(--premium-dot)]"
                            aria-hidden
                          />
                          <span className="sr-only">빛 수집됨</span>
                          {justEarnedDate === date ? (
                            <LightIcon
                              tone="active"
                              size={14}
                              justEarned
                              label=""
                              className="absolute"
                            />
                          ) : null}
                        </span>
                      ) : (
                        <span className="mt-0.5 h-3.5 w-3.5" aria-hidden />
                      )}
                    </span>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
