import type {
  Group,
  MonthlyAward,
  QtCompletion,
  QtReflection,
  User,
} from "@/types";
import { buildGroups } from "./groups";
import { buildUsers } from "./users";
import {
  buildQtCompletions,
  buildReflections,
  ensureTestUserToday,
  monthsCovered,
} from "./qt-records";
import { buildAwards } from "./awards";

export const TEST_USER_ID = "u-001";

export interface MockDataset {
  groups: Group[];
  users: User[];
  completions: QtCompletion[];
  reflections: QtReflection[];
  awards: MonthlyAward[];
  months: string[];
}

let cached: MockDataset | null = null;

export function getMockData(): MockDataset {
  if (cached) return cached;

  const groups = buildGroups();
  const users = buildUsers(groups);
  let completions = buildQtCompletions(users);
  completions = ensureTestUserToday(completions, TEST_USER_ID);
  const reflections = buildReflections(users, completions);
  const awards = buildAwards(groups, users, completions);

  cached = {
    groups,
    users,
    completions,
    reflections,
    awards,
    months: monthsCovered(),
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
