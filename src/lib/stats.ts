import type {
  Group,
  GroupRankRow,
  QtCompletion,
  User,
} from "@/types";
import { rankingScopeDays } from "@/lib/dates";

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

/** One completed QT day = 1 light. */
export function userMonthStats(
  userId: string,
  yearMonth: string,
  completionSet: Set<string>,
): { days: number; lights: number; possible: number } {
  const dates = rankingScopeDays(yearMonth);
  const possible = dates.length;
  const days = dates.filter((d) =>
    completionSet.has(completionSetKey(userId, d)),
  ).length;
  return {
    days,
    lights: days,
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

export function groupMonthStats(
  groupId: string,
  users: User[],
  yearMonth: string,
  completionSet: Set<string>,
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
      if (completionSet.has(completionSetKey(m.id, d))) lights += 1;
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
  const rows = groups.map((g) => {
    const stats = groupMonthStats(g.id, users, yearMonth, set);
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

export function formatLights(lights: number): string {
  return `${lights}빛`;
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
): { date: string; count: number; total: number }[] {
  const members = users.filter((u) => u.groupId === groupId);
  const dates = rankingScopeDays(yearMonth);
  return dates.map((date) => ({
    date,
    total: members.length,
    count: members.filter((m) =>
      completionSet.has(completionSetKey(m.id, date)),
    ).length,
  }));
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
    const sun0 = new Date(`${d.date}T12:00:00+09:00`).getUTCDay();
    const monFirst = sun0 === 0 ? 6 : sun0 - 1;
    buckets[monFirst]!.count += d.count;
    buckets[monFirst]!.possible += d.total;
  }

  return buckets;
}
