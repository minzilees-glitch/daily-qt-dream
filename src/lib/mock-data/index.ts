import type {
  Group,
  MonthlyAward,
  QtCompletion,
  QtEntry,
  QtReadingRange,
  User,
} from "@/types";
import { buildGroups } from "./groups";
import { buildUsers } from "./users";
import {
  buildQtCompletions,
  buildEntries,
  ensureTestUserToday,
  monthsCovered,
} from "./qt-records";
import { buildAwards } from "./awards";
import { buildReadingRanges, readingForDate } from "./reading-ranges";

export const TEST_USER_ID = "u-001";

export interface MockDataset {
  groups: Group[];
  users: User[];
  completions: QtCompletion[];
  /** Valid QT entries — completion requires a valid entry. */
  reflections: QtEntry[];
  awards: MonthlyAward[];
  months: string[];
  readingRanges: QtReadingRange[];
}

let cached: MockDataset | null = null;

export function getMockData(): MockDataset {
  if (cached) return cached;

  const groups = buildGroups();
  const users = buildUsers(groups);
  let completions = buildQtCompletions(users);
  completions = ensureTestUserToday(completions, TEST_USER_ID);
  const reflections = buildEntries(users, completions);
  const awards = buildAwards(groups, users, completions);
  const readingRanges = buildReadingRanges(3);

  cached = {
    groups,
    users,
    completions,
    reflections,
    awards,
    months: monthsCovered(),
    readingRanges,
  };
  return cached;
}

export function getUserById(id: string): User | undefined {
  return getMockData().users.find((u) => u.id === id);
}

export function getGroupById(id: string): Group | undefined {
  return getMockData().groups.find((g) => g.id === id);
}

export function getTestUser(): User {
  const user = getUserById(TEST_USER_ID);
  if (!user) throw new Error("Test user missing from mock data");
  return user;
}

export function getReadingForDate(date: string): QtReadingRange {
  const cachedRange = getMockData().readingRanges.find((r) => r.date === date);
  return cachedRange ?? readingForDate(date);
}

export { readingForDate };
