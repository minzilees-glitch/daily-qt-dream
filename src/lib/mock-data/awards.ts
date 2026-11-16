import type { Group, MonthlyAward, QtCompletion, User } from "@/types";

/** Pilot seed: no fabricated monthly awards. */
export function buildAwards(
  _groups: Group[],
  _users: User[],
  _completions: QtCompletion[],
): MonthlyAward[] {
  return [];
}
