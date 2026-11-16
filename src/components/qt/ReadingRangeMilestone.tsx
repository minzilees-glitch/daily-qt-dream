import type { QtReadingRange } from "@/types";
import { ReadingPassageHeader } from "@/components/qt/ReadingPassageHeader";

/** Compact sky-wash milestone: same 본문 header as today card; no verse body (future). */
export function ReadingRangeMilestone({
  reading,
  label = "오늘의 말씀",
  embedded = false,
}: {
  reading: QtReadingRange;
  label?: string;
  /** When true, skip SoftCard chrome (pastel / parent panel). */
  embedded?: boolean;
}) {
  return (
    <div className={embedded ? "shadow-none" : "soft-card px-4 py-4"}>
      <ReadingPassageHeader reading={reading} label={label} />
    </div>
  );
}
