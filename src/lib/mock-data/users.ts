import type { Group, User } from "@/types";
import { SUN_ROSTERS } from "./sun-roster";

/**
 * Build users from DQ-694 sun roster.
 * - 김병준 순: 6 admins (다락방장), 순장 김병준; 이민지 = u-001 test login.
 * - Other 순: full members; leader = name matching 순 title; not admin.
 * - 파일럿 순: placeholder 순장 only.
 */
export function buildUsers(groups: Group[]): User[] {
  const users: User[] = [];
  let seq = 1;
  const byName = new Map(SUN_ROSTERS.map((r) => [r.groupName, r]));

  for (const group of groups) {
    if (group.name === "파일럿 순") {
      const id = `u-${String(seq).padStart(3, "0")}`;
      users.push({
        id,
        name: "파일럿",
        groupId: group.id,
        isAdmin: false,
        isLeader: true,
      });
      group.leaderId = id;
      seq += 1;
      continue;
    }

    const roster = byName.get(group.name);
    if (!roster) {
      throw new Error(`Missing sun roster for group: ${group.name}`);
    }

    for (const member of roster.members) {
      const id = `u-${String(seq).padStart(3, "0")}`;
      users.push({
        id,
        name: member.name,
        groupId: group.id,
        isAdmin: member.isAdmin,
        isLeader: member.isLeader,
      });
      if (member.isLeader) {
        group.leaderId = id;
      }
      seq += 1;
    }
  }

  return users;
}
