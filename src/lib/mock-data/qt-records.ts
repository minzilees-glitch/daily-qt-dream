import type { QtCompletion, QtEntry, User } from "@/types";
import {
  addMonths,
  currentYearMonth,
  rankingScopeDays,
  todaySeoul,
} from "@/lib/dates";
import { chance, mulberry32, pick } from "./seed";

const MEDITATION_SAMPLES = [
  "오늘 말씀에서 인내의 의미를 다시 묵상했습니다. 작은 일에도 감사하며 나아가고 싶습니다.",
  "바쁘다는 핑계로 자주 미루던 QT를 오늘 아침에 했습니다. 마음이 한결 고요해졌어요.",
  "이웃을 사랑하라는 말씀이 구체적으로 와 닿았습니다. 한 사람에게 먼저 연락해 보려 합니다.",
  "기도 중에 제 마음을 솔직히 아뢰었습니다. 주님께서 이미 아시고 계신다는 위로를 받았습니다.",
  "오늘의 본문은 광야의 여정이었습니다. 지금 저의 광야도 의미 있음을 믿습니다.",
  "감사 제목을 세 가지 적어 보았습니다. 일상이 은혜로 가득하다는 걸 다시 느낍니다.",
];

const VERSE_SAMPLES = [
  "여호와는 나의 목자시니 내게 부족함이 없으리로다 (시편 23:1)",
  "모든 것을 합력하여 선을 이루시는 줄을 우리가 아노니 (로마서 8:28)",
  "수고하고 무거운 짐 진 자들아 다 내게로 오라 (마태복음 11:28)",
  "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 (데살로니가전서 5:16-18)",
];

const PRAYER_SAMPLES = [
  "오늘 하루 이웃을 섬길 기회를 놓치지 않게 해주세요.",
  "가족과 순원들의 건강과 평안을 위해 기도합니다.",
  "말씀대로 살아갈 용기와 지혜를 구합니다.",
];

const OBEDIENCE_SAMPLES = [
  "오늘 만난 사람에게 먼저 인사하고 안부를 묻겠습니다.",
  "말씀에서 받은 은혜를 가족에게 나누겠습니다.",
  "불평 대신 감사로 하루를 마무리하겠습니다.",
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
  // Baseline: descending by group id order so ranks stay distinct.
  groups.forEach((gid, i) => {
    groupRate.set(gid, 0.72 - i * 0.012);
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

  // Demo ranking UI: 사랑순 1위 (gold), 믿음순 2위 (silver) for current month.
  enforceDemoPodium(users, records, today, "g-01", "g-05");

  return records;
}

/** Pad/trim current-month lights so `firstId` ranks 1 and `secondId` ranks 2 alone. */
function enforceDemoPodium(
  users: User[],
  records: QtCompletion[],
  today: string,
  firstId: string,
  secondId: string,
): void {
  const ym = currentYearMonth();
  const dates = rankingScopeDays(ym, today);
  if (dates.length === 0) return;

  const key = (userId: string, date: string) => `${userId}|${date}`;
  const present = new Set(
    records.filter((c) => c.completed).map((c) => key(c.userId, c.date)),
  );
  const membersOf = (gid: string) => users.filter((u) => u.groupId === gid);

  const countGroup = (gid: string) => {
    let n = 0;
    for (const u of membersOf(gid)) {
      for (const d of dates) {
        if (present.has(key(u.id, d))) n += 1;
      }
    }
    return n;
  };

  const addOne = (gid: string): boolean => {
    for (const u of membersOf(gid)) {
      for (const d of dates) {
        const k = key(u.id, d);
        if (present.has(k)) continue;
        present.add(k);
        records.push({ userId: u.id, date: d, completed: true });
        return true;
      }
    }
    return false;
  };

  const removeOne = (gid: string): boolean => {
    for (const u of [...membersOf(gid)].reverse()) {
      for (const d of [...dates].reverse()) {
        const k = key(u.id, d);
        if (!present.has(k)) continue;
        present.delete(k);
        const idx = records.findIndex(
          (c) => c.userId === u.id && c.date === d && c.completed,
        );
        if (idx >= 0) records.splice(idx, 1);
        return true;
      }
    }
    return false;
  };

  const othersMax = () => {
    let max = 0;
    for (const gid of new Set(users.map((u) => u.groupId))) {
      if (gid === firstId || gid === secondId) continue;
      max = Math.max(max, countGroup(gid));
    }
    return max;
  };

  // 2nd place: above every other group (except 1st), with a clear gap.
  while (countGroup(secondId) <= othersMax()) {
    if (!addOne(secondId)) break;
  }
  // 1st place: strictly above 2nd.
  while (countGroup(firstId) <= countGroup(secondId)) {
    if (!addOne(firstId)) {
      if (!removeOne(secondId)) break;
    }
  }
}

/**
 * Every completed day gets a valid QT entry (combined trimmed fields ≥ 10 chars).
 * Others' entry text is never shown in group UI — only completion counts.
 */
export function buildEntries(
  users: User[],
  completions: QtCompletion[],
): QtEntry[] {
  const byUser = new Map<string, string[]>();
  for (const c of completions) {
    if (!c.completed) continue;
    const list = byUser.get(c.userId) ?? [];
    list.push(c.date);
    byUser.set(c.userId, list);
  }

  const entries: QtEntry[] = [];
  users.forEach((user, idx) => {
    const rng = mulberry32(5000 + idx * 13);
    const dates = byUser.get(user.id) ?? [];
    for (const date of dates) {
      const mode = Math.floor(rng() * 4);
      const meditation = mode === 0 ? pick(rng, MEDITATION_SAMPLES) : "";
      const verse =
        mode === 1
          ? pick(rng, VERSE_SAMPLES)
          : mode === 0 && chance(rng, 0.4)
            ? pick(rng, VERSE_SAMPLES)
            : "";
      const decisionObedience =
        mode === 2
          ? pick(rng, OBEDIENCE_SAMPLES)
          : chance(rng, 0.25)
            ? pick(rng, OBEDIENCE_SAMPLES)
            : "";
      const prayer =
        mode === 3
          ? pick(rng, PRAYER_SAMPLES)
          : chance(rng, 0.3)
            ? pick(rng, PRAYER_SAMPLES)
            : "";
      // Guarantee combined trimmed length ≥ 10
      const total =
        meditation.trim().length +
        verse.trim().length +
        decisionObedience.trim().length +
        prayer.trim().length;
      const med = total < 10 ? pick(rng, MEDITATION_SAMPLES) : meditation;
      entries.push({
        userId: user.id,
        date,
        meditation: med,
        verse,
        decisionObedience,
        prayer,
        updatedAt: `${date}T08:30:00+09:00`,
      });
    }
  });

  return entries;
}

/** @deprecated alias */
export const buildReflections = buildEntries;

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
