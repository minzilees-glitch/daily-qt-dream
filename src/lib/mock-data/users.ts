import type { Group, User } from "@/types";

/** Canonical 김병준 순 roster — all 다락방장 = admin. 순장 = 김병준. */
const KIM_BYEONGJUN_SUN_MEMBERS: { name: string; isLeader: boolean }[] = [
  { name: "이민지", isLeader: false }, // TEST_USER_ID u-001
  { name: "김병준", isLeader: true },
  { name: "구민아", isLeader: false },
  { name: "최현경", isLeader: false },
  { name: "강민정", isLeader: false },
  { name: "김철호", isLeader: false },
];

/** 「김서경 순」 → 「김서경」 placeholder 순장 until real roster lands. */
function leaderNameFromSun(groupName: string): string {
  return groupName.replace(/\s*순\s*$/u, "").trim() || groupName;
}

/** Canonical 김병준 순 roster — all 다락방장 = admin. 순장 = 김병준. */
const KIM_BYEONGJUN_SUN_MEMBERS: { name: string; isLeader: boolean }[] = [
  { name: "이민지", isLeader: false }, // TEST_USER_ID u-001
  { name: "김병준", isLeader: true },
  { name: "구민아", isLeader: false },
  { name: "최현경", isLeader: false },
  { name: "강민정", isLeader: false },
  { name: "김철호", isLeader: false },
];

/**
 * 김병준 순: fixed 6 admins (순장 김병준).
 * Other 순: single placeholder 순장 only — no fabricated QT/participation.
 * u-001 is the default test login: 이민지 · 김병준 순 · admin (not 순장).
 */
export function buildUsers(groups: Group[]): User[] {
  const users: User[] = [];
  let seq = 1;

  for (const group of groups) {
    if (group.name === "김병준 순") {
      for (const member of KIM_BYEONGJUN_SUN_MEMBERS) {
        const id = `u-${String(seq).padStart(3, "0")}`;
        users.push({
          id,
          name: member.name,
          groupId: group.id,
          isAdmin: true,
          isLeader: member.isLeader,
        });
        if (member.isLeader) {
          group.leaderId = id;
        }
        seq += 1;
      }
      continue;
    }

    const id = `u-${String(seq).padStart(3, "0")}`;
    users.push({
      id,
      name: leaderNameFromSun(group.name),
      groupId: group.id,
      isAdmin: false,
      isLeader: true,
    });
    group.leaderId = id;
    seq += 1;
  }

  return users;
}
