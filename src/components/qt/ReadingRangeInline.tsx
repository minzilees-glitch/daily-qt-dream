import { ReadingRangeMilestone } from "@/components/qt/ReadingRangeMilestone";
import type { QtReadingRange } from "@/types";

/** Compact reading-range block — label + range + title only. */
export function ReadingRangeInline({
  reading,
  label = "오늘의 본문",
}: {
  reading: QtReadingRange;
  label?: string;
}) {
  return <ReadingRangeMilestone reading={reading} label={label} />;
}
