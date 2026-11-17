import type { Group } from "@/types";
import { SUN_GROUP_NAMES } from "./sun-roster";

/**
 * Canonical 순 list from DQ-694 roster seed (`sun-roster.ts`).
 * 김병준 순 is pinned first. Leader ids are assigned in users.ts.
 */
export const GROUP_NAMES = SUN_GROUP_NAMES;

export function buildGroups(): Group[] {
  return GROUP_NAMES.map((name, i) => ({
    id: `g-${String(i + 1).padStart(2, "0")}`,
    name,
    leaderId: "", // filled in users.ts
  }));
}
