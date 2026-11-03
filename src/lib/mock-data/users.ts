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

/**
 * ~300 members across 30 groups (~10 each).
 * First user of each group is leader. u-001 is the default test login (admin + 사랑순).
 */
export function buildUsers(groups: Group[]): User[] {
  const rng = mulberry32(20261102);
  const users: User[] = [];
  let seq = 1;

  for (const group of groups) {
    const size = 9 + Math.floor(rng() * 3); // 9–11
    for (let i = 0; i < size; i++) {
      const id = `u-${String(seq).padStart(3, "0")}`;
      const isLeader = i === 0;
      const name =
        seq === 1
          ? "테스트유저"
          : `${pick(rng, FAMILY)}${pick(rng, GIVEN)}`;
      users.push({
        id,
        name,
        groupId: group.id,
        isAdmin: seq === 1,
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
