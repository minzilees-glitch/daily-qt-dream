import type { QtCompletion, QtReflection, User } from "@/types";
import {
  addMonths,
  currentYearMonth,
  rankingScopeDays,
  todaySeoul,
} from "@/lib/dates";
import { chance, mulberry32, pick } from "./seed";

const REFLECTION_SAMPLES = [
  "오늘 말씀에서 인내의 의미를 다시 묵상했습니다. 작은 일에도 감사하며 나아가고 싶습니다.",
  "바쁘다는 핑계로 자주 미루던 QT를 오늘 아침에 했습니다. 마음이 한결 고요해졌어요.",
  "이웃을 사랑하라는 말씀이 구체적으로 와 닿았습니다. 한 사람에게 먼저 연락해 보려 합니다.",
  "기도 중에 제 마음을 솔직히 아뢰었습니다. 주님께서 이미 아시고 계신다는 위로를 받았습니다.",
  "오늘의 본문은 광야의 여정이었습니다. 지금 저의 광야도 의미 있음을 믿습니다.",
  "감사 제목을 세 가지 적어 보았습니다. 일상이 은혜로 가득하다는 걸 다시 느낍니다.",
  "말씀 한 구절을 외워 두었습니다. 하루 중 여러 번 떠올리며 힘을 얻었습니다.",
  "순원들과 나눌 짧은 묵상을 적어두었습니다. 함께 걷는 믿음의 길이 고맙습니다.",
];

/**
 * Generate QT completions for the last 3 calendar months (Seoul).
 * Participation rates vary by group so ranking is meaningful and verifiable.
 */
export function buildQtCompletions(users: User[]): QtCompletion[] {
  const today = todaySeoul();
  const ym = currentYearMonth();
  const months = [addMonths(ym, -2), addMonths(ym, -1), ym];
  const records: QtCompletion[] = [];

  const groupRate = new Map<string, number>();
  const groups = [...new Set(users.map((u) => u.groupId))];
  groups.forEach((gid, i) => {
    groupRate.set(gid, 0.88 - i * 0.015);
  });

  users.forEach((user, idx) => {
    const rng = mulberry32(1000 + idx * 97);
    const base = groupRate.get(user.groupId) ?? 0.5;
    const personal = Math.min(0.95, Math.max(0.15, base + (rng() - 0.5) * 0.24));

    for (const month of months) {
      const days = rankingScopeDays(month, today);
      for (const date of days) {
        const dow = new Date(`${date}T12:00:00+09:00`).getUTCDay();
        const p = dow === 0 || dow === 6 ? personal * 0.85 : personal;
        if (chance(rng, p)) {
          records.push({ userId: user.id, date, completed: true });
        }
      }
    }
  });

  return records;
}

/** Sample reflections for a subset of completed days. */
export function buildReflections(
  users: User[],
  completions: QtCompletion[],
): QtReflection[] {
  const byUser = new Map<string, string[]>();
  for (const c of completions) {
    if (!c.completed) continue;
    const list = byUser.get(c.userId) ?? [];
    list.push(c.date);
    byUser.set(c.userId, list);
  }

  const reflections: QtReflection[] = [];
  users.forEach((user, idx) => {
    const rng = mulberry32(5000 + idx * 13);
    const dates = byUser.get(user.id) ?? [];
    for (const date of dates) {
      if (!chance(rng, 0.35)) continue;
      reflections.push({
        userId: user.id,
        date,
        content: pick(rng, REFLECTION_SAMPLES),
        updatedAt: `${date}T08:30:00+09:00`,
      });
    }
  });

  return reflections;
}

export function ensureTestUserToday(
  completions: QtCompletion[],
  testUserId: string,
): QtCompletion[] {
  return completions.filter(
    (c) => !(c.userId === testUserId && c.date === todaySeoul()),
  );
}

export function monthsCovered(): string[] {
  const ym = currentYearMonth();
  return [addMonths(ym, -2), addMonths(ym, -1), ym];
}
