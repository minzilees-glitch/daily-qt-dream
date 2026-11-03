/** Asia/Seoul date helpers. Calendar dates are always YYYY-MM-DD in Seoul. */

const SEOUL = "Asia/Seoul";

function partsInSeoul(date: Date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function todaySeoul(): string {
  const { year, month, day } = partsInSeoul();
  return formatYmd(year, month, day);
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseYmd(ymd: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = ymd.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monday=0 … Sunday=6 for calendar grids starting on Monday. */
export function weekdayIndexMonFirst(ymd: string): number {
  const probe = new Date(`${ymd}T12:00:00+09:00`);
  const seoulDow = probe.getUTCDay(); // 0=Sun … 6=Sat
  return seoulDow === 0 ? 6 : seoulDow - 1;
}

export function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function yearMonthOf(ymd: string): string {
  return ymd.slice(0, 7);
}

export function currentYearMonth(): string {
  return yearMonthOf(todaySeoul());
}

export function listDatesInMonth(year: number, month: number): string[] {
  const n = daysInMonth(year, month);
  return Array.from({ length: n }, (_, i) => formatYmd(year, month, i + 1));
}

/** Days used for ranking: full past months; current month through today. */
export function rankingScopeDays(
  yearMonth: string,
  today = todaySeoul(),
): string[] {
  const [y, m] = yearMonth.split("-").map(Number);
  const all = listDatesInMonth(y, m);
  const current = currentYearMonth();
  if (yearMonth < current) return all;
  if (yearMonth > current) return [];
  return all.filter((d) => d <= today);
}

export function formatDisplayDate(ymd: string): string {
  const { year, month, day } = parseYmd(ymd);
  const probe = new Date(`${ymd}T12:00:00+09:00`);
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL,
    weekday: "short",
  }).format(probe);
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

export function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${y}년 ${m}월`;
}

/** Month-only label, e.g. "11월". */
export function formatMonthOnly(yearMonth: string): string {
  const [, m] = yearMonth.split("-").map(Number);
  return `${m}월`;
}

/** Sunday=0 … Saturday=6 for Seoul civil date. */
export function weekdaySunFirst(ymd: string): number {
  return new Date(`${ymd}T12:00:00+09:00`).getUTCDay();
}

export function isFutureDate(ymd: string, today = todaySeoul()): boolean {
  return ymd > today;
}
