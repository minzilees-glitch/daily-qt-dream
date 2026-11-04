import type { QtReadingRange } from "@/types";
import { StatLabel } from "@/components/ui/StatLabel";

/** Shared 본문 header: label + range/title on one line (today QT card rules). */
export function ReadingPassageHeader({
  reading,
  label = "본문",
}: {
  reading: QtReadingRange;
  label?: string;
}) {
  return (
    <>
      <StatLabel className="text-text-secondary">{label}</StatLabel>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 type-section tracking-tight text-text-main">
        <span>{reading.range}</span>
        {reading.title ? (
          <span className="type-body-sm font-medium text-text-secondary">
            {reading.title}
          </span>
        ) : null}
      </p>
    </>
  );
}
