import type { Group, User } from "@/types";
import { mulberry32, pick } from "./seed";

const FAMILY = [
  "김",
  "이",
  "박",
  "최",
  "정",
  "강",
  "조",
  "윤",
  "장",
  "임",
  "한",
  "오",
  "서",
  "신",
  "권",
  "황",
  "안",
  "송",
  "전",
  "홍",
];

const GIVEN = [
  "민준",
  "서연",
  "예준",
  "하은",
  "도윤",
  "지우",
  "시우",
  "서준",
  "지민",
  "수아",
  "윤서",
  "하준",
  "지호",
  "채원",
  "준서",
  "유나",
  "건우",
  "소율",
  "현우",
  "예은",
  "민서",
  "주원",
  "다은",
  "선우",
  "지안",
  "은우",
  "서아",
  "연우",
  "하린",
  "시윤",
];

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
 * ~300 members across 30 groups (~10 each), except 김병준 순 (fixed 6).
 * First user of other groups is leader.
 * u-001 is the default test login: 이민지 · 김병준 순 · admin (not 순장).
 * Rule: everyone in 김병준 순 is 다락방장 = admin; 순장 is 김병준.
 */
export function buildUsers(groups: Group[]): User[] {
  const rng = mulberry32(20261102);
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

    const size = 9 + Math.floor(rng() * 3); // 9–11
    for (let i = 0; i < size; i++) {
      const id = `u-${String(seq).padStart(3, "0")}`;
      const isLeader = i === 0;
      users.push({
        id,
        name: `${pick(rng, FAMILY)}${pick(rng, GIVEN)}`,
        groupId: group.id,
        isAdmin: false,
        isLeader,
      });
      if (isLeader) {
        group.leaderId = id;
      }
      seq += 1;
    }
  }

  return users;
}
