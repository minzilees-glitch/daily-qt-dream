import type { Group } from "@/types";

/**
 * Canonical 33 순 (docs/sun-list.md).
 * Leader ids are assigned in users.ts.
 */
export const GROUP_NAMES = [
  "김병준 순",
  "김서경 순",
  "최다혜 순",
  "오요섭 순",
  "문은미 순",
  "장석인 순",
  "임인택 순",
  "이지행 순",
  "신은영 순",
  "정현태 순",
  "한준희 순",
  "이한지 순",
  "이유진 순",
  "박하은 순",
  "홍승우 순",
  "최진화 순",
  "박호수 순",
  "박영수 순",
  "김이현 순",
  "김태희 순",
  "박마광 순",
  "양은지 순",
  "정지현 순",
  "구현정 순",
  "김승하 순",
  "박현수 순",
  "이성민 순",
  "한요한 순",
  "김미림 순",
  "신의정 순",
  "우경식 순",
  "임예진 순",
  "정봉훈 순",
] as const;

export function buildGroups(): Group[] {
  return GROUP_NAMES.map((name, i) => ({
    id: `g-${String(i + 1).padStart(2, "0")}`,
    name,
    leaderId: "", // filled in users.ts
  }));
}
