/**
 * Canonical 다락방 → 순 → 본명 for post-Kakao community verification.
 * 다락방 labels confirmed by Minzi (2026-11-17) — definitive, not provisional.
 * Member lists come from `sun-roster.ts` (DQ-694).
 * 순 → 다락방 sun buckets: 김병준 순 under 김병준 다락방; other 순 split across
 * the six rooms until a full Excel map arrives.
 */

import { SUN_ROSTERS, type RosterMember, type SunRoster } from "@/lib/mock-data/sun-roster";

export type DarakbangId = string;

export type Darakbang = {
  id: DarakbangId;
  /** Display label, e.g. 「김병준 다락방」 */
  name: string;
  /** Exact `SunRoster.groupName` values in this room. */
  sunNames: string[];
};

/** Canonical 6 다락방 (Minzi 2026-11-17). Order matches her list. */
export const DARAKBANGS: Darakbang[] = [
  {
    id: "d-kangminjeong",
    name: "강민정 다락방",
    sunNames: [
      "김서경 순",
      "최다혜 순",
      "오요섭 순",
      "문은미 순",
      "장석인 순",
      "임인택 순",
    ],
  },
  {
    id: "d-gumina",
    name: "구민아 다락방",
    sunNames: [
      "이지행 순",
      "신은영 순",
      "정현태 순",
      "한준희 순",
      "이한지 순",
      "이유진 순",
    ],
  },
  {
    id: "d-kimbyeongjun",
    name: "김병준 다락방",
    sunNames: [
      "김병준 순",
      "박하은 순",
      "홍승우 순",
      "최진화 순",
      "박호수 순",
      "박영수 순",
    ],
  },
  {
    id: "d-kimcheolho",
    name: "김철호 다락방",
    sunNames: [
      "김이현 순",
      "김태희 순",
      "박마광 순",
      "양은지 순",
      "정지현 순",
      "구현정 순",
    ],
  },
  {
    id: "d-leeminji",
    name: "이민지 다락방",
    sunNames: [
      "김송하 순",
      "박현수 순",
      "이성민 순",
      "한요한 순",
      "김미림 순",
    ],
  },
  {
    id: "d-choihyeongyeong",
    name: "최현경 다락방",
    sunNames: ["신의정 순", "우경식 순", "임예진 순", "정봉훈 순"],
  },
];

const rosterByName = new Map(SUN_ROSTERS.map((r) => [r.groupName, r]));

export function getSunsForDarakbang(darakbangId: DarakbangId): SunRoster[] {
  const room = DARAKBANGS.find((d) => d.id === darakbangId);
  if (!room) return [];
  return room.sunNames
    .map((name) => rosterByName.get(name))
    .filter((r): r is SunRoster => Boolean(r));
}

export function getRosterForSun(sunName: string): SunRoster | undefined {
  return rosterByName.get(sunName);
}

export function findRosterMember(
  sunName: string,
  legalName: string,
): RosterMember | undefined {
  const roster = rosterByName.get(sunName);
  if (!roster) return undefined;
  const needle = legalName.trim();
  return roster.members.find((m) => m.name === needle);
}

/** Map roster 순 display name → mock / seed group id (`g-01`…). */
export function sunNameToGroupId(sunName: string): string | null {
  const idx = SUN_ROSTERS.findIndex((r) => r.groupName === sunName);
  if (idx < 0) return null;
  return `g-${String(idx + 1).padStart(2, "0")}`;
}

export function roleFromRosterMember(
  member: RosterMember,
): "admin" | "leader" | "member" {
  if (member.isAdmin) return "admin";
  if (member.isLeader) return "leader";
  return "member";
}
