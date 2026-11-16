import type { Group } from "@/types";
import { SUN_GROUP_NAMES } from "./sun-roster";

/**
 * Canonical 순 list from DQ-694 roster seed (`sun-roster.ts`).
 * 김병준 순 is pinned first. Leader ids are assigned in users.ts.
 */
export const GROUP_NAMES = SUN_GROUP_NAMES;

/** Demo-only 순 for ranking/group pilot numbers — not in sun roster. */
export const PILOT_GROUP_NAME = "파일럿 순";

export function buildGroups(): Group[] {
  const names = [...GROUP_NAMES, PILOT_GROUP_NAME];
  return names.map((name, i) => ({
    id: `g-${String(i + 1).padStart(2, "0")}`,
    name,
    leaderId: "", // filled in users.ts
  }));
}
