import { ReadingPassageBlock } from "@/components/qt/ReadingPassageBlock";
import type { QtReadingRange } from "@/types";

/** /qt write page reading card — shared passage block with verse styling. */
export function ReadingRangeCard({
  reading,
  defaultExpanded = false,
}: {
  reading: QtReadingRange;
  compact?: boolean;
  defaultExpanded?: boolean;
}) {
  return (
    <ReadingPassageBlock
      reading={reading}
      label="오늘의 본문"
      defaultExpanded={defaultExpanded}
    />
  );
}
