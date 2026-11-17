/**
 * Canonical community roster for Kakao verify (다락방 → 순 → 본명).
 * Source: docs/community-roster-final.md (Minzi, 2026-11-17) — definitive.
 *
 * Display 순 as 「{이름} 순」. 김송하 순 (not 김승하).
 * 임예진 순 includes 임예진 (순장) even though header count was 6 listed.
 * 김병준 순 (admin set) stays in mock `sun-roster` for app prefs.
 * Verify for 다락방장 names: **기타 → 다락방장 순** (이민지·김병준·구민아·최현경·강민정·김철호).
 * **기타 → 미배정 순** has no members (exception path).
 */

import { SUN_ROSTERS, type RosterMember, type SunRoster } from "@/lib/mock-data/sun-roster";

export type DarakbangId = string;

export type VerifySun = {
  /** 「{이름} 순」 */
  groupName: string;
  /** 본명 list including 순장 */
  memberNames: string[];
};

export type Darakbang = {
  id: DarakbangId;
  name: string;
  suns: VerifySun[];
};

function sun(groupName: string, memberNames: string[]): VerifySun {
  return { groupName, memberNames };
}

/** Canonical 6 다락방 → 순 → 본명 (final Minzi roster). */
export const DARAKBANGS: Darakbang[] = [
  {
    id: "d-kangminjeong",
    name: "강민정 다락방",
    suns: [
      sun("임예진 순", [
        "강규리",
        "정재룡",
        "문희지",
        "이요엘",
        "박찬미",
        "이화은",
        "임예진",
      ]),
      sun("김미림 순", [
        "이삼수",
        "주찬혁",
        "남아영",
        "김미림",
        "남사라",
        "강지은",
        "김성식",
      ]),
      sun("우경식 순", [
        "백진경",
        "김경구",
        "김미진",
        "우경식",
        "노서영",
        "윤세영",
        "황나영",
        "이재림",
      ]),
      sun("신의정 순", [
        "이민희",
        "허강욱",
        "신의정",
        "김시현",
        "정석민",
        "김정아",
        "곽아라",
        "홍광희",
        "조정원",
      ]),
      sun("정봉훈 순", [
        "박영주",
        "최승희",
        "전병우",
        "정봉훈",
        "김근민",
        "최정주",
        "박세라",
        "신미나",
        "박수연",
        "공의애",
      ]),
    ],
  },
  {
    id: "d-gumina",
    name: "구민아 다락방",
    suns: [
      sun("김이현 순", [
        "노만나",
        "이충호",
        "황태웅",
        "김이현",
        "임현정",
        "김예진",
        "정하영",
        "박준식",
      ]),
      sun("김태희 순", [
        "김태리",
        "정재원",
        "이성빈",
        "이은재",
        "이한나",
        "김태희",
        "조현화",
        "송재혁",
        "김예은",
      ]),
      sun("박마광 순", [
        "김성호",
        "박마광",
        "유태경",
        "김준우",
        "최수정",
        "한주영",
        "김영미",
        "김경아",
        "유현",
      ]),
      sun("양은지 순", [
        "박휘광",
        "정준호",
        "김영민",
        "송하담",
        "양은지",
        "이예리",
        "남윤조",
        "김유진",
        "조소희",
        "백성현",
      ]),
      sun("정지현 순", [
        "이중호",
        "조경은",
        "이지유",
        "양성우",
        "정지현",
        "이지혜",
        "김율하",
        "정명화",
        "이정석",
      ]),
    ],
  },
  {
    id: "d-kimbyeongjun",
    name: "김병준 다락방",
    suns: [
      sun("이유진 순", [
        "김하은",
        "김윤성",
        "이유진",
        "이은혜",
        "이세영",
        "장주안",
      ]),
      sun("신은영 순", [
        "장예찬",
        "국중호",
        "김리안",
        "신은영",
        "류시진",
        "김가현",
        "김채현",
      ]),
      sun("김서경 순", [
        "성노현",
        "김종연",
        "정재현",
        "양동현",
        "이주성",
        "김서경",
        "김내희",
        "이채원",
        "김기쁨",
        "이로윤",
      ]),
      sun("문은미 순", [
        "김희재",
        "송창현",
        "이미승",
        "문은미",
        "이찬주",
        "박예진",
        "이준호",
      ]),
      sun("정현태 순", [
        "연은주",
        "한재희",
        "이장희",
        "정현태",
        "장동은",
        "정민재",
        "고보경",
        "이솔빈",
        "권순호",
      ]),
      sun("장석인 순", [
        "장건",
        "장석인",
        "김수진",
        "주수일",
        "송윤혁",
        "이보아",
        "양주선",
        "조수현",
        "배주영",
        "김은지",
      ]),
    ],
  },
  {
    id: "d-kimcheolho",
    name: "김철호 다락방",
    suns: [
      sun("박하은 순", [
        "여호수",
        "박재홍",
        "박범준",
        "박하은",
        "이효민",
        "박수민",
        "이은혜",
        "김수정",
      ]),
      sun("박호수 순", [
        "김다은",
        "강승원",
        "황예미",
        "김지영",
        "박호수",
        "조안나",
        "김하은",
      ]),
      sun("최다혜 순", [
        "강주혜",
        "이혜영",
        "최다혜",
        "정예빈",
        "이지현",
        "김지혜",
        "남윤주",
      ]),
      sun("한준희 순", [
        "이상혁",
        "이헌제",
        "한진석",
        "김윤희",
        "강승구",
        "정원영",
        "한준희",
        "이세영",
        "유희진",
      ]),
      sun("임인택 순", [
        "이혜준",
        "김형오",
        "최정훈",
        "연도의",
        "임인택",
        "최유진",
        "김기현",
        "장용섭",
        "신하림",
      ]),
      sun("홍승우 순", [
        "홍승우",
        "윤수한",
        "김선우",
        "김세미",
        "이성휘",
        "안신영",
        "한민정",
        "임서연",
        "이유림",
      ]),
    ],
  },
  {
    id: "d-leeminji",
    name: "이민지 다락방",
    suns: [
      sun("오요섭 순", [
        "염호성",
        "오승현",
        "오현화",
        "오요섭",
        "박주희",
        "김성령",
        "조예령",
      ]),
      sun("이지행 순", [
        "장나은",
        "이진영",
        "이지행",
        "문예진",
        "문예은",
        "김윤지",
      ]),
      sun("이한지 순", [
        "박서희",
        "오현경",
        "이진현",
        "이선아",
        "이한지",
        "이진광",
        "이효정",
        "임근우",
        "장제익",
      ]),
      sun("최진화 순", [
        "이민우",
        "홍지민",
        "강한슬",
        "권아라",
        "최진화",
        "정영경",
        "김경진",
        "홍승현",
        "김정우",
        "송자인",
      ]),
      sun("박영수 순", [
        "고찬영",
        "박영수",
        "송승창",
        "김선아",
        "권은경",
        "박상욱",
        "이성희",
        "강관현",
        "김진주",
      ]),
    ],
  },
  {
    id: "d-choihyeongyeong",
    name: "최현경 다락방",
    suns: [
      sun("이성민 순", [
        "장재령",
        "남세연",
        "김채영",
        "이성민",
        "남하영",
        "서기문",
        "신희권",
      ]),
      sun("구현정 순", [
        "이난희",
        "장세민",
        "조혜선",
        "고민석",
        "구현정",
        "김지현",
        "강현승",
        "이지은",
      ]),
      sun("김송하 순", [
        "손예찬",
        "최송복",
        "김다영",
        "김송하",
        "김영빈",
        "김수민",
        "정인서",
        "허지원",
        "강성민",
      ]),
      sun("한요한 순", [
        "고진엘",
        "김혜미",
        "오선민",
        "한요한",
        "지혜나",
        "이진희",
        "장윤정",
        "정은주",
      ]),
      sun("박현수 순", [
        "이광영",
        "박현수",
        "정환희",
        "이나겸",
        "김지연",
        "나혜민",
        "최유라",
        "이형진",
        "최민규",
      ]),
    ],
  },
  {
    id: "d-etc",
    name: "기타",
    suns: [
      // Prefs: 김병준 순 admin/다락방장 set (verify home for 다락방장 names).
      sun("다락방장 순", [
        "이민지",
        "김병준",
        "구민아",
        "최현경",
        "강민정",
        "김철호",
      ]),
      // Empty roster — 본명 match fails → exception path.
      sun("미배정 순", []),
    ],
  },
];

/** Seed group id for 김병준 순 (admin / 다락방장 home). */
const KIM_BYEONGJUN_GROUP_ID = "g-01";

function leaderNameFromSun(groupName: string): string {
  return groupName.replace(/\s*순\s*$/, "").trim();
}

function toRosterMember(sun: VerifySun, name: string): RosterMember {
  const leader = leaderNameFromSun(sun.groupName);
  const isDarakbangjangSun = sun.groupName === "다락방장 순";
  return {
    name,
    // 「다락방장 순」 has no person named 다락방장 — 순장 is 김병준 (prefs).
    isLeader: isDarakbangjangSun ? name === "김병준" : name === leader,
    isAdmin: isDarakbangjangSun,
  };
}

function toSunRoster(sun: VerifySun): SunRoster {
  return {
    groupName: sun.groupName,
    members: sun.memberNames.map((n) => toRosterMember(sun, n)),
  };
}

const verifySunByName = new Map(
  DARAKBANGS.flatMap((d) => d.suns).map((s) => [s.groupName, s]),
);

export function getSunsForDarakbang(darakbangId: DarakbangId): SunRoster[] {
  const room = DARAKBANGS.find((d) => d.id === darakbangId);
  if (!room) return [];
  return room.suns.map(toSunRoster);
}

export function getRosterForSun(sunName: string): SunRoster | undefined {
  const sun = verifySunByName.get(sunName);
  return sun ? toSunRoster(sun) : undefined;
}

export function findRosterMember(
  sunName: string,
  legalName: string,
): RosterMember | undefined {
  const sun = verifySunByName.get(sunName);
  if (!sun) return undefined;
  const needle = legalName.trim();
  if (!sun.memberNames.includes(needle)) return undefined;
  return toRosterMember(sun, needle);
}

/**
 * Map roster 순 display name → mock / seed group id (`g-01`…).
 * Uses SUN_ROSTERS order so profiles.group_id stays aligned with seed.
 */
export function sunNameToGroupId(sunName: string): string | null {
  if (sunName === "다락방장 순") return KIM_BYEONGJUN_GROUP_ID;
  // 미배정: no seed group — verify match won't succeed (empty members).
  if (sunName === "미배정 순") return null;
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

/** Summary helpers for audits / reports. */
export function rosterSummary(): {
  darakbangCount: number;
  sunCount: number;
  memberCount: number;
  sunsMissingFromMock: string[];
} {
  const suns = DARAKBANGS.flatMap((d) => d.suns);
  const mockNames = new Set(SUN_ROSTERS.map((r) => r.groupName));
  return {
    darakbangCount: DARAKBANGS.length,
    sunCount: suns.length,
    memberCount: suns.reduce((n, s) => n + s.memberNames.length, 0),
    sunsMissingFromMock: suns
      .map((s) => s.groupName)
      .filter((name) => !mockNames.has(name)),
  };
}
