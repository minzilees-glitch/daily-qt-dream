/**
 * Manual 말씀 ranges for 「나의 큐티들」 history sheet.
 * Home still scrapes Duranno for today; history does NOT.
 *
 * How to fill (monthly):
 * 1. Add or edit a month block under HISTORY_PASSAGES keyed by `YYYY-MM`.
 * 2. Inside that month, add each day as `DD` (zero-padded) → `{ range }`.
 * 3. Use full Korean book names (아모스, not 암; 고린도후서, not 고후).
 * 4. Dates missing from the map show HISTORY_PASSAGE_PLACEHOLDER.
 *
 * Sources (Duranno 공지):
 * - 2026-10: sn=22428
 * - 2026-11: sn=22582
 * - 2026-12: sn=22722
 */

export type HistoryPassageDay = {
  /** Verse range, e.g. "아모스 7:10-17" */
  range: string;
};

/** Shown when range is not filled yet. */
export const HISTORY_PASSAGE_PLACEHOLDER =
  "이 날의 말씀은 곧 올라올 예정이에요.";

/**
 * Month (`YYYY-MM`) → day (`DD`) → passage.
 * Minzi: add later months the same way.
 */
export const HISTORY_PASSAGES: Record<
  string,
  Record<string, HistoryPassageDay>
> = {
  "2026-10": {
    "01": { range: "역대상 17:1-15" },
    "02": { range: "역대상 17:16-27" },
    "03": { range: "역대상 18:1-8" },
    "04": { range: "역대상 18:9-17" },
    "05": { range: "역대상 19:1-7" },
    "06": { range: "역대상 19:8-19" },
    "07": { range: "역대상 20:1-8" },
    "08": { range: "역대상 21:1-8" },
    "09": { range: "역대상 21:9-17" },
    "10": { range: "역대상 21:18-22:1" },
    "11": { range: "역대상 22:2-19" },
    "12": { range: "역대상 23:1-32" },
    "13": { range: "역대상 24:1-31" },
    "14": { range: "역대상 25:1-31" },
    "15": { range: "역대상 26:1-19" },
    "16": { range: "역대상 26:20-32" },
    "17": { range: "역대상 27:1-24" },
    "18": { range: "역대상 27:25-34" },
    "19": { range: "역대상 28:1-10" },
    "20": { range: "역대상 28:11-21" },
    "21": { range: "역대상 29:1-9" },
    "22": { range: "역대상 29:10-19" },
    "23": { range: "역대상 29:20-30" },
    "24": { range: "아가 1:1-17" },
    "25": { range: "아가 2:1-17" },
    "26": { range: "아가 3:1-11" },
    "27": { range: "아가 4:1-16" },
    "28": { range: "아가 5:1-16" },
    "29": { range: "아가 6:1-13" },
    "30": { range: "아가 7:1-13" },
    "31": { range: "아가 8:1-14" },
  },
  "2026-11": {
    "01": { range: "빌레몬서 1:1-14" },
    "02": { range: "빌레몬서 1:15-25" },
    "03": { range: "아모스 1:1-8" },
    "04": { range: "아모스 1:9-15" },
    "05": { range: "아모스 2:1-8" },
    "06": { range: "아모스 2:9-16" },
    "07": { range: "아모스 3:1-8" },
    "08": { range: "아모스 3:9-15" },
    "09": { range: "아모스 4:1-13" },
    "10": { range: "아모스 5:1-6" },
    "11": { range: "아모스 5:7-17" },
    "12": { range: "아모스 5:18-27" },
    "13": { range: "아모스 6:1-7" },
    "14": { range: "아모스 6:8-14" },
    "15": { range: "아모스 7:1-9" },
    "16": { range: "아모스 7:10-17" },
    "17": { range: "아모스 8:1-10" },
    "18": { range: "아모스 8:11-9:6" },
    "19": { range: "아모스 9:7-15" },
    "20": { range: "고린도후서 1:1-7" },
    "21": { range: "고린도후서 1:8-14" },
    "22": { range: "고린도후서 1:15-24" },
    "23": { range: "고린도후서 2:1-11" },
    "24": { range: "고린도후서 2:12-17" },
    "25": { range: "고린도후서 3:1-11" },
    "26": { range: "고린도후서 3:12-18" },
    "27": { range: "고린도후서 4:1-10" },
    "28": { range: "고린도후서 4:11-18" },
    "29": { range: "고린도후서 5:1-10" },
    "30": { range: "고린도후서 5:11-21" },
  },
  "2026-12": {
    "01": { range: "고린도후서 6:1-13" },
    "02": { range: "고린도후서 6:14-7:1" },
    "03": { range: "고린도후서 7:2-16" },
    "04": { range: "고린도후서 8:1-8" },
    "05": { range: "고린도후서 8:9-15" },
    "06": { range: "고린도후서 8:16-24" },
    "07": { range: "고린도후서 9:1-7" },
    "08": { range: "고린도후서 9:8-15" },
    "09": { range: "고린도후서 10:1-11" },
    "10": { range: "고린도후서 10:12-18" },
    "11": { range: "고린도후서 11:1-10" },
    "12": { range: "고린도후서 11:11-21" },
    "13": { range: "고린도후서 11:22-33" },
    "14": { range: "고린도후서 12:1-10" },
    "15": { range: "고린도후서 12:11-21" },
    "16": { range: "고린도후서 13:1-13" },
    "17": { range: "미가 1:1-7" },
    "18": { range: "미가 1:8-16" },
    "19": { range: "미가 2:1-13" },
    "20": { range: "미가 3:1-12" },
    "21": { range: "미가 4:1-5" },
    "22": { range: "미가 4:6-5:1" },
    "23": { range: "이사야 11:1-9" },
    "24": { range: "요한일서 4:9-15" },
    "25": { range: "요한복음 1:9-18" },
    "26": { range: "미가 5:2-15" },
    "27": { range: "미가 6:1-8" },
    "28": { range: "미가 6:9-16" },
    "29": { range: "미가 7:1-6" },
    "30": { range: "미가 7:7-13" },
    "31": { range: "미가 7:14-20" },
  },
};

export function getHistoryPassage(dateYmd: string): HistoryPassageDay {
  const [year, month, day] = dateYmd.split("-");
  if (!year || !month || !day) {
    return { range: HISTORY_PASSAGE_PLACEHOLDER };
  }

  const entry = HISTORY_PASSAGES[`${year}-${month}`]?.[day];
  const range = entry?.range?.trim() ?? "";
  return { range: range || HISTORY_PASSAGE_PLACEHOLDER };
}

/** Eyebrow: `YYYY/MM/DD 의 말씀` */
export function historyPassageLabel(dateYmd: string): string {
  return `${dateYmd.replaceAll("-", "/")} 의 말씀`;
}
