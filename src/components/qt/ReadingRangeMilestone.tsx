import type { QtReadingRange } from "@/types";
import { ReadingPassageHeader } from "@/components/qt/ReadingPassageHeader";

/** Compact sky-wash milestone: same 본문 header as today card; no verse body (future). */
export function ReadingRangeMilestone({
  reading,
  label = "본문",
}: {
  reading: QtReadingRange;
  label?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-sky-light px-4 py-4 shadow-none">
      <ReadingPassageHeader reading={reading} label={label} />
    </div>
  );
}
