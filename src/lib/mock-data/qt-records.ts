import type { QtCompletion, QtEntry, User } from "@/types";
import {
  addMonths,
  currentYearMonth,
  rankingScopeDays,
  todaySeoul,
} from "@/lib/dates";
import { chance, mulberry32, pick, sampleN } from "./seed";

const MEDITATION_SAMPLES = [
  "오늘 말씀에서 인내의 의미를 다시 묵상했습니다. 작은 일에도 감사하며 나아가고 싶습니다.",
  "바쁘다는 핑계로 자주 미루던 큐티를 오늘 아침에 했습니다. 마음이 한결 고요해졌어요.",
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

const TEST_USER_NAME = "이민지";
const PILOT_LEADER_NAME = "파일럿";

/**
 * Pilot seed:
 * - 이민지: Sep 22 / Oct 14 random days + fixed 2026-11-15
 * - 파일럿 순 (placeholder 순장): Sep 23 / Oct 11 / Nov 7 aggregate
 * Other 순 stay at 0. 김병준 순 roster unchanged.
 */
export function buildQtCompletions(users: User[]): QtCompletion[] {
  const today = todaySeoul();
  const records: QtCompletion[] = [];

  const minzi = users.find((u) => u.name === TEST_USER_NAME);
  if (minzi) {
    pushUserMonthSample(records, minzi.id, "2026-09", 22, today, 2101);
    pushUserMonthSample(records, minzi.id, "2026-10", 14, today, 2102);
    // Explicit demo day with a full Korean entry (see buildEntries).
    if (!records.some((c) => c.userId === minzi.id && c.date === "2026-11-15")) {
      records.push({
        userId: minzi.id,
        date: "2026-11-15",
        completed: true,
      });
    }
  }

  const pilotLeader = users.find((u) => u.name === PILOT_LEADER_NAME);
  if (pilotLeader) {
    pushUserMonthSample(records, pilotLeader.id, "2026-09", 23, today, 2201);
    pushUserMonthSample(records, pilotLeader.id, "2026-10", 11, today, 2202);
    pushUserMonthSample(records, pilotLeader.id, "2026-11", 7, today, 2203);
  }

  return records;
}

function pushUserMonthSample(
  records: QtCompletion[],
  userId: string,
  yearMonth: string,
  count: number,
  today: string,
  seed: number,
): void {
  const pool = rankingScopeDays(yearMonth, today);
  if (pool.length === 0 || count <= 0) return;
  const rng = mulberry32(seed);
  const picked = sampleN(rng, pool, Math.min(count, pool.length));
  for (const date of picked) {
    records.push({ userId, date, completed: true });
  }
}

/**
 * Current-month podium around a pinned 2nd-place total (does not inflate 우리순).
 * firstId → gold, secondId → silver at `secondLights`; other 순 stay below silver.
 */
function enforceDemoPodiumNear(
  users: User[],
  records: QtCompletion[],
  today: string,
  firstId: string,
  secondId: string,
  secondLights: number,
): void {
  const ym = currentYearMonth();
  const dates = rankingScopeDays(ym, today);
  if (dates.length === 0) return;

  const allGroups = [...new Set(users.map((u) => u.groupId))];
  const silver = Math.max(0, Math.floor(secondLights));
  const gold = silver + 4;

  setGroupMonthLights(users, records, ym, secondId, silver, today);
  setGroupMonthLights(users, records, ym, firstId, gold, today);

  allGroups.forEach((gid, i) => {
    if (gid === firstId || gid === secondId) return;
    // Keep bronze-and-below under silver (stable spread).
    const peer = Math.max(4, silver - 2 - (i % 5));
    setGroupMonthLights(users, records, ym, gid, peer, today);
  });
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
      // Fixed plausible Korean entry for the demo QT day.
      if (user.name === TEST_USER_NAME && date === "2026-11-15") {
        entries.push({
          userId: user.id,
          date,
          meditation:
            "오늘 본문에서 주님께서 먼저 찾아오신다는 말씀이 마음에 남았습니다. 바쁜 하루에도 그분께 먼저 자리를 내어 드리고 싶습니다.",
          verse: "여호와는 나의 목자시니 내게 부족함이 없으리로다 (시편 23:1)",
          decisionObedience:
            "오늘 만난 사람에게 먼저 인사하고 짧은 안부라도 나누겠습니다.",
          prayer: "가족과 순원들의 건강과 평안을 위해 기도합니다.",
          updatedAt: `${date}T08:30:00+09:00`,
        });
        continue;
      }

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
