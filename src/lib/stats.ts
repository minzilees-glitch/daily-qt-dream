import type {
  Group,
  GroupRankRow,
  QtCompletion,
  User,
} from "@/types";
import {
  currentYearMonth,
  listDatesInMonth,
  rankingScopeDays,
  TERM_14_START,
  todaySeoul,
  termScopeDays,
  weekDatesSunFirst,
  weekdaySunFirst,
} from "@/lib/dates";

export function completionSetKey(userId: string, date: string): string {
  return `${userId}|${date}`;
}

export function buildCompletionSet(completions: QtCompletion[]): Set<string> {
  const set = new Set<string>();
  for (const c of completions) {
    if (c.completed) set.add(completionSetKey(c.userId, c.date));
  }
  return set;
}

/** Completions that earn lights (excludes past-date backfills). */
export function buildLightSet(completions: QtCompletion[]): Set<string> {
  const set = new Set<string>();
  for (const c of completions) {
    if (c.completed && c.earnsLight !== false) {
      set.add(completionSetKey(c.userId, c.date));
    }
  }
  return set;
}

/**
 * Past-date completions that saved content but earned no light.
 * Shown as outline sparks on calendar / MeSky / SkyWalkers — not counted.
 */
export function buildOutlineSet(completions: QtCompletion[]): Set<string> {
  const set = new Set<string>();
  for (const c of completions) {
    if (c.completed && c.earnsLight === false) {
      set.add(completionSetKey(c.userId, c.date));
    }
  }
  return set;
}

/** On-time completed QT day = 1 light. Past backfills complete but earn 0. */
export function userMonthStats(
  userId: string,
  yearMonth: string,
  completionSet: Set<string>,
  lightSet: Set<string> = completionSet,
): { days: number; lights: number; possible: number } {
  const dates = rankingScopeDays(yearMonth);
  const possible = dates.length;
  const days = dates.filter((d) =>
    completionSet.has(completionSetKey(userId, d)),
  ).length;
  const lights = dates.filter((d) =>
    lightSet.has(completionSetKey(userId, d)),
  ).length;
  return {
    days,
    lights,
    possible,
  };
}

export function userYearDays(
  userId: string,
  year: number,
  completionSet: Set<string>,
  todayLimit: string,
): number {
  let count = 0;
  for (const key of completionSet) {
    const [uid, date] = key.split("|");
    if (uid !== userId) continue;
    if (!date.startsWith(`${year}-`)) continue;
    if (date > todayLimit) continue;
    count += 1;
  }
  return count;
}

/** Year cumulative lights — same keys as light set (on-time only). */
export function userYearLights(
  userId: string,
  year: number,
  lightSet: Set<string>,
  todayLimit: string,
): number {
  return userYearDays(userId, year, lightSet, todayLimit);
}

/** Term cumulative lights from `start` through today (on-time only). */
export function userTermLights(
  userId: string,
  lightSet: Set<string>,
  start: string = TERM_14_START,
  todayLimit: string = todaySeoul(),
): number {
  if (todayLimit < start) return 0;
  let count = 0;
  for (const key of lightSet) {
    const [uid, date] = key.split("|");
    if (uid !== userId || !date) continue;
    if (date < start || date > todayLimit) continue;
    count += 1;
  }
  return count;
}

export function groupMonthStats(
  groupId: string,
  users: User[],
  yearMonth: string,
  completionSet: Set<string>,
  lightSet: Set<string> = completionSet,
): {
  lights: number;
  possibleCount: number;
  memberCount: number;
} {
  const members = users.filter((u) => u.groupId === groupId);
  const dates = rankingScopeDays(yearMonth);
  const memberCount = members.length;
  const possibleCount = memberCount * dates.length;
  let lights = 0;
  for (const m of members) {
    for (const d of dates) {
      if (lightSet.has(completionSetKey(m.id, d))) lights += 1;
    }
  }
  return {
    memberCount,
    lights,
    possibleCount,
  };
}

/** Rank by light count desc. Ties share the same rank (1,2,2,4). */
export function computeGroupRanking(
  groups: Group[],
  users: User[],
  completions: QtCompletion[],
  yearMonth: string,
  myGroupId?: string,
): GroupRankRow[] {
  const set = buildCompletionSet(completions);
  const lightSet = buildLightSet(completions);
  const rows = groups.map((g) => {
    const stats = groupMonthStats(g.id, users, yearMonth, set, lightSet);
    return {
      rank: 0,
      groupId: g.id,
      groupName: g.name,
      memberCount: stats.memberCount,
      lights: stats.lights,
      possibleCount: stats.possibleCount,
      isMine: myGroupId ? g.id === myGroupId : false,
    };
  });

  rows.sort((a, b) => {
    if (b.lights !== a.lights) return b.lights - a.lights;
    return a.groupName.localeCompare(b.groupName, "ko");
  });

  let lastLights = Number.NaN;
  let lastRank = 0;
  rows.forEach((row, i) => {
    if (row.lights !== lastLights) {
      lastRank = i + 1;
      lastLights = row.lights;
    }
    row.rank = lastRank;
  });

  return rows;
}

/** Numeric light count only — pair with LightIcon in UI. */
export function formatLights(lights: number): string {
  return String(lights);
}

export function memberDayCounts(
  groupId: string,
  users: User[],
  yearMonth: string,
  completionSet: Set<string>,
): { user: User; days: number }[] {
  const dates = rankingScopeDays(yearMonth);
  return users
    .filter((u) => u.groupId === groupId)
    .map((user) => ({
      user,
      days: dates.filter((d) =>
        completionSet.has(completionSetKey(user.id, d)),
      ).length,
    }))
    .sort(
      (a, b) =>
        b.days - a.days || a.user.name.localeCompare(b.user.name, "ko"),
    );
}

export function groupDayParticipation(
  groupId: string,
  users: User[],
  yearMonth: string,
  completionSet: Set<string>,
  todayLimit: string = todaySeoul(),
): { date: string; count: number; total: number; active: boolean }[] {
  const members = users.filter((u) => u.groupId === groupId);
  const [y, m] = yearMonth.split("-").map(Number);
  const current = currentYearMonth();
  // Full month for chart (current month keeps remaining days as inactive).
  const dates = yearMonth > current ? [] : listDatesInMonth(y, m);

  return dates.map((date) => {
    const active = date <= todayLimit;
    return {
      date,
      active,
      total: active ? members.length : 0,
      count: active
        ? members.filter((m) =>
            completionSet.has(completionSetKey(m.id, date)),
          ).length
        : 0,
    };
  });
}

/** This week Sun–Sat group counts (bars). Future weekdays: possible=0. */
export function groupThisWeekWeekdayParticipation(
  groupId: string,
  users: User[],
  completionSet: Set<string>,
  today: string = todaySeoul(),
): { weekday: number; label: string; count: number; possible: number }[] {
  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  const week = weekDatesSunFirst(today);
  const members = users.filter((u) => u.groupId === groupId);
  const total = members.length;

  return week.map((date, weekday) => {
    const future = date > today;
    return {
      weekday,
      label: labels[weekday]!,
      count: future
        ? 0
        : members.filter((m) =>
            completionSet.has(completionSetKey(m.id, date)),
          ).length,
      possible: future ? 0 : total,
    };
  });
}

/** Mon–Sun aggregate participation for a group in a month. */
export function groupWeekdayParticipation(
  groupId: string,
  users: User[],
  yearMonth: string,
  completionSet: Set<string>,
): { weekday: number; label: string; count: number; possible: number }[] {
  const labels = ["월", "화", "수", "목", "금", "토", "일"];
  const dayPart = groupDayParticipation(groupId, users, yearMonth, completionSet);
  const buckets = labels.map((label, weekday) => ({
    weekday,
    label,
    count: 0,
    possible: 0,
  }));

  for (const d of dayPart) {
    if (!d.active) continue;
    const sun0 = new Date(`${d.date}T12:00:00+09:00`).getUTCDay();
    const monFirst = sun0 === 0 ? 6 : sun0 - 1;
    buckets[monFirst]!.count += d.count;
    buckets[monFirst]!.possible += d.total;
  }

  return buckets;
}

/** Personal QT completions by weekday (Sun→Sat) for 기 cumulative scope. */
export function userWeekdayParticipation(
  userId: string,
  completionSet: Set<string>,
  start: string = TERM_14_START,
  todayLimit: string = todaySeoul(),
): { weekday: number; label: string; count: number; possible: number }[] {
  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  const buckets = labels.map((label, weekday) => ({
    weekday,
    label,
    count: 0,
    possible: 0,
  }));

  // Term cumulative through today (same scope as 「14기 누적」 lights).
  for (const date of termScopeDays(start, todayLimit)) {
    const sunFirst = weekdaySunFirst(date);
    buckets[sunFirst]!.possible += 1;
    if (completionSet.has(completionSetKey(userId, date))) {
      buckets[sunFirst]!.count += 1;
    }
  }

  return buckets;
}

