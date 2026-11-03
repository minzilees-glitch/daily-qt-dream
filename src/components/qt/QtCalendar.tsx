"use client";

import {
  daysInMonth,
  formatYmd,
  isFutureDate,
  todaySeoul,
  weekdayIndexMonFirst,
} from "@/lib/dates";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function QtCalendar({
  yearMonth,
  completedDates,
  selectedDate,
  onSelect,
}: {
  yearMonth: string;
  completedDates: Set<string>;
  selectedDate?: string | null;
  onSelect?: (date: string) => void;
}) {
  const [y, m] = yearMonth.split("-").map(Number);
  const total = daysInMonth(y, m);
  const first = formatYmd(y, m, 1);
  const offset = weekdayIndexMonFirst(first);
  const today = todaySeoul();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-text-secondary">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day == null) {
            return <div key={`e-${idx}`} className="aspect-square" />;
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
              className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition ${
                selected
                  ? "bg-cta !text-white shadow-[var(--shadow-cta)]"
                  : done
                    ? "bg-sky-light text-text-main"
                    : future
                      ? "text-text-secondary/40"
                      : "text-text-main hover:bg-ivory"
              }`}
            >
              <span className={`font-medium ${isToday && !selected ? "text-sky" : ""}`}>
                {day}
              </span>
              {done ? (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    selected ? "bg-white" : "bg-sky"
                  }`}
                />
              ) : (
                <span className="mt-0.5 h-1.5 w-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
