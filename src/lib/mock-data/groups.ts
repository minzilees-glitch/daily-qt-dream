import type { Group } from "@/types";

/** 30 순 (groups). Leader ids are assigned after users are generated. */
export const GROUP_NAMES = [
  "사랑순",
  "기쁨순",
  "평안순",
  "소망순",
  "믿음순",
  "은혜순",
  "진리순",
  "생명순",
  "빛된순",
  "새아침순",
  "감람순",
  "시온순",
  "베다니순",
  "갈릴리순",
  "엠마오순",
  "마가순",
  "안디옥순",
  "빌립보순",
  "고린도순",
  "에베소순",
  "골로새순",
  "데살로니가순",
  "디모데순",
  "디도순",
  "빌레몬순",
  "히브리순",
  "야고보순",
  "베드로순",
  "요한순",
  "유다순",
] as const;

export function buildGroups(): Group[] {
  return GROUP_NAMES.map((name, i) => ({
    id: `g-${String(i + 1).padStart(2, "0")}`,
    name,
    leaderId: "", // filled in users.ts
  }));
}
