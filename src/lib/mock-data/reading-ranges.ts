import type { QtReadingRange } from "@/types";
import {
  addMonths,
  currentYearMonth,
  listDatesInMonth,
  parseYmd,
} from "@/lib/dates";

/** Rotating Korean QT reading plan snippets (mock — swap for CMS/DB later). */
const PLAN: { range: string; title: string }[] = [
  { range: "창세기 1:1–2:3", title: "창조의 시작" },
  { range: "창세기 12:1–9", title: "아브람을 부르심" },
  { range: "출애굽기 3:1–15", title: "불타는 떨기나무" },
  { range: "시편 23:1–6", title: "여호와는 나의 목자" },
  { range: "시편 121:1–8", title: "산에서 도움을" },
  { range: "잠언 3:1–12", title: "여호와를 경외하라" },
  { range: "이사야 40:27–31", title: "독수리 날개 쳐 올라감" },
  { range: "예레미야 29:11–14", title: "희망의 계획" },
  { range: "마태복음 5:1–12", title: "팔복" },
  { range: "마태복음 6:25–34", title: "염려하지 말라" },
  { range: "누가복음 15:11–32", title: "돌아온 아들" },
  { range: "요한복음 1:1–18", title: "말씀이 육신이 되어" },
  { range: "요한복음 15:1–11", title: "포도나무와 가지" },
  { range: "로마서 8:28–39", title: "사랑의 확신" },
  { range: "고린도전서 13:1–13", title: "사랑의 노래" },
  { range: "갈라디아서 5:22–26", title: "성령의 열매" },
  { range: "에베소서 2:1–10", title: "은혜로 구원" },
  { range: "빌립보서 4:4–9", title: "기쁨과 평강" },
  { range: "골로새서 3:12–17", title: "새 사람의 옷" },
  { range: "히브리서 12:1–3", title: "믿음의 경주" },
  { range: "야고보서 1:2–12", title: "시련 중의 기쁨" },
  { range: "베드로전서 5:6–11", title: "겸손과 경계" },
  { range: "요한일서 4:7–21", title: "하나님은 사랑이심" },
  { range: "요한계시록 21:1–7", title: "새 하늘과 새 땅" },
];

function dayIndex(ymd: string): number {
  const { year, month, day } = parseYmd(ymd);
  // Stable index across months
  return (year * 372 + month * 31 + day) % PLAN.length;
}

export function readingForDate(date: string): QtReadingRange {
  const item = PLAN[dayIndex(date)]!;
  return { date, range: item.range, title: item.title };
}

/** Build ranges for the last `monthCount` months including current. */
export function buildReadingRanges(monthCount = 3): QtReadingRange[] {
  const ym = currentYearMonth();
  const months = Array.from({ length: monthCount }, (_, i) =>
    addMonths(ym, -(monthCount - 1 - i)),
  );
  const out: QtReadingRange[] = [];
  for (const month of months) {
    const [y, m] = month.split("-").map(Number);
    for (const date of listDatesInMonth(y, m)) {
      out.push(readingForDate(date));
    }
  }
  return out;
}
