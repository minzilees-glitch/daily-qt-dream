"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
const SWIPE_THRESHOLD = 40;

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
  const weekKeyRef = useRef<string | null>(null);
  const pendingSlideRef = useRef<"next" | "prev" | null>(null);
  const [weekSlide, setWeekSlide] = useState<"next" | "prev" | null>(null);
  const swipeRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, moved: false });

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
      // next week enters from right; previous from left
      pendingSlideRef.current = direction === 1 ? "next" : "prev";
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

  /* Horizontal wheel / trackpad: one threshold → one week. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !onSelect || !collapsed) return;

    const onWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      // Prefer horizontal; allow vertical-as-horizontal when shift-held.
      const delta = absX >= absY || e.shiftKey ? (e.shiftKey ? e.deltaY : e.deltaX) : 0;
      if (delta === 0) return;
      e.preventDefault();
      wheelAccRef.current += delta;
      if (Math.abs(wheelAccRef.current) < WHEEL_THRESHOLD) return;
      const dir: -1 | 1 = wheelAccRef.current > 0 ? 1 : -1;
      wheelAccRef.current = 0;
      stepWeek(dir);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [collapsed, onSelect, stepWeek]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!collapsed) return;
    swipeRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe.active) return;
    const dx = e.clientX - swipe.startX;
    const dy = e.clientY - swipe.startY;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      swipe.moved = true;
    }
  };

  const endSwipe = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe.active) return;
    swipe.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (!swipe.moved) return;
    const dx = e.clientX - swipe.startX;
    const dy = e.clientY - swipe.startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    // Swipe left (dx < 0) → next week; swipe right → previous week.
    stepWeek(dx < 0 ? 1 : -1);
  };

  const weekDates = weekDatesMonFirst(focusDate);
  const weekKey = weekDates[0] ?? focusDate;
  const allRows = buildWeekRows(yearMonth);

  useEffect(() => {
    if (!collapsed) {
      weekKeyRef.current = weekKey;
      setWeekSlide(null);
      return;
    }
    const prev = weekKeyRef.current;
    weekKeyRef.current = weekKey;
    if (!prev || prev === weekKey) return;

    const pending = pendingSlideRef.current;
    pendingSlideRef.current = null;
    if (pending) {
      setWeekSlide(pending);
      return;
    }
    // External date jump (month picker / day tap in another week).
    setWeekSlide(weekKey > prev ? "next" : "prev");
  }, [collapsed, weekKey]);

  return (
    <div
      ref={rootRef}
      className={
        collapsed
          ? "premium-cal-week-viewport touch-pan-x select-none"
          : "touch-pan-y"
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
    >
      {collapsed ? (
        <div
          key={`week-${weekKey}`}
          className={`grid grid-cols-7 gap-1.5 ${
            weekSlide === "next"
              ? "premium-cal-week-slide-next"
              : weekSlide === "prev"
                ? "premium-cal-week-slide-prev"
                : "premium-cal-month-anim"
          }`}
          aria-label="주간 달력 — 좌우로 밀면 일주일씩 이동합니다"
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
                onClick={(ev) => {
                  if (swipeRef.current.moved) {
                    ev.preventDefault();
                    return;
                  }
                  onSelect?.(date);
                }}
                aria-label={`${date}${done ? ", 완료" : ""}`}
                aria-pressed={selected}
                className={`premium-cal-day relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 transition ${
                  selected ? "premium-cal-day-selected" : ""
                } ${!inMonth ? "opacity-40" : ""}`}
              >
                <span
                  className={`type-micro ${
                    selected
                      ? "font-semibold text-white"
                      : "text-text-secondary"
                  }`}
                >
                  {WEEKDAYS[i]}
                </span>
                <span
                  className={`relative z-[1] text-[17px] font-semibold tabular-nums leading-none ${
                    selected
                      ? "text-white"
                      : isToday
                        ? "text-cta"
                        : future
                          ? "premium-cal-day-muted"
                          : "text-text-main"
                  }`}
                >
                  {day}
                </span>
                <span className="relative z-[1] flex h-4 w-4 items-center justify-center">
                  {done ? (
                    <LightIcon
                      tone={selected ? "white" : "active"}
                      size={14}
                      rays={false}
                      label="빛 수집됨"
                      justEarned={justEarnedDate === date}
                    />
                  ) : selected ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-white/55"
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
          <div className="mb-2 grid grid-cols-7 gap-1 text-center type-micro text-text-secondary">
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
                            ? "text-white"
                            : isToday
                              ? "text-cta"
                              : future
                                ? "premium-cal-day-muted"
                                : "text-text-main"
                        }`}
                      >
                        {day}
                      </span>
                      {done ? (
                        <span className="relative z-[1] mt-0.5 flex h-3.5 w-3.5 items-center justify-center">
                          <LightIcon
                            tone={selected ? "white" : "active"}
                            size={12}
                            rays={false}
                            label="빛 수집됨"
                            justEarned={justEarnedDate === date}
                          />
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
