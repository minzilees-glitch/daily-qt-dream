/**
 * Manual 말씀 (range + summary) for 「나의 큐티들」 history sheet.
 * Home still scrapes Duranno for today; history does NOT.
 *
 * How to fill (monthly):
 * 1. Add or edit a month block under HISTORY_PASSAGES keyed by `YYYY-MM`.
 * 2. Inside that month, add each day as `DD` (zero-padded) → `{ range, title }`.
 * 3. Dates missing from the map show HISTORY_PASSAGE_PLACEHOLDER.
 *
 * Example:
 * ```
 * "2026-11": {
 *   "01": { range: "마태복음 5:1-12", title: "심령이 가난한 자는 복이 있나니" },
 *   "16": { range: "요한복음 1:1-5", title: "빛이 어둠에 비치되" },
 * },
 * ```
 */

export type HistoryPassageDay = {
  /** Verse range, e.g. "마태복음 5:1-12" */
  range: string;
  /** Short summary under the range */
  title: string;
};

/** Shown when range and/or title is not filled yet. */
export const HISTORY_PASSAGE_PLACEHOLDER =
  "이 날의 말씀은 곧 올라올 예정이에요.";

/**
 * Month (`YYYY-MM`) → day (`DD`) → passage.
 * Minzi: fill one month at a time below.
 */
export const HISTORY_PASSAGES: Record<
  string,
  Record<string, HistoryPassageDay>
> = {
  // "2026-11": {
  //   "01": { range: "…", title: "…" },
  // },
};

export function getHistoryPassage(dateYmd: string): HistoryPassageDay {
  const [year, month, day] = dateYmd.split("-");
  if (!year || !month || !day) {
    return {
      range: HISTORY_PASSAGE_PLACEHOLDER,
      title: HISTORY_PASSAGE_PLACEHOLDER,
    };
  }

  const entry = HISTORY_PASSAGES[`${year}-${month}`]?.[day];
  const range = entry?.range?.trim() ?? "";
  const title = entry?.title?.trim() ?? "";

  return {
    range: range || HISTORY_PASSAGE_PLACEHOLDER,
    title: title || HISTORY_PASSAGE_PLACEHOLDER,
  };
}

/** Eyebrow: `YYYY/MM/DD 의 말씀` */
export function historyPassageLabel(dateYmd: string): string {
  return `${dateYmd.replaceAll("-", "/")} 의 말씀`;
}
