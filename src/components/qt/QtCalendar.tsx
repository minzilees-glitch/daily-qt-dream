"use client";

import {
  daysInMonth,
  formatYmd,
  isFutureDate,
  todaySeoul,
  weekdayIndexMonFirst,
  yearMonthOf,
} from "@/lib/dates";
import { LightIcon } from "@/components/ui/LightIcon";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

/**
 * Build Mon-first month grid, then optionally collapse to ~2 recent weeks.
 * Collapsed assumption (나의 QT): show the last 2 week-rows that contain
 * dates ≤ today within the viewed month (current month → weeks around today;
 * past month → last 2 weeks of that month).
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
): (number | null)[][] {
  const [y, m] = yearMonth.split("-").map(Number);
  const limitDay =
    yearMonth === yearMonthOf(today)
      ? Number(today.slice(8, 10))
      : daysInMonth(y, m);

  let lastRelevant = -1;
  rows.forEach((row, ri) => {
    for (const day of row) {
      if (day != null && day <= limitDay) lastRelevant = ri;
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
  const rows = collapsedWeekRows(ym, buildWeekRows(ym), today);
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
}: {
  yearMonth: string;
  completedDates: Set<string>;
  selectedDate?: string | null;
  onSelect?: (date: string) => void;
  collapsed?: boolean;
  justEarnedDate?: string | null;
}) {
  const [y, m] = yearMonth.split("-").map(Number);
  const today = todaySeoul();
  const allRows = buildWeekRows(yearMonth);
  const rows = collapsed
    ? collapsedWeekRows(yearMonth, allRows, today)
    : allRows;

  return (
    <div className="touch-pan-y">
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[12px] font-medium text-text-secondary">
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
                  className={`mx-auto flex h-full w-[calc(100%-2px)] flex-col items-center justify-center gap-1 rounded-[var(--radius-day)] py-2 text-center ${
                    selected
                      ? "bg-cta !text-white shadow-none"
                      : isToday
                        ? "bg-cta/18 text-cta group-hover:bg-cta/24"
                        : done
                          ? "bg-white text-text-main"
                          : future
                            ? "text-text-secondary/40"
                            : "text-text-main group-hover:bg-white/70"
                  }`}
                >
                  <span
                    className={`text-center text-label leading-none font-medium tabular-nums ${
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
                    <span className="mx-auto flex h-5 w-5 shrink-0 items-center justify-center overflow-visible">
                      <LightIcon
                        tone="active"
                        size={16}
                        label="빛 수집됨"
                        justEarned={justEarnedDate === date}
                      />
                    </span>
                  ) : (
                    <span className="mx-auto h-5 w-5 shrink-0" />
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
