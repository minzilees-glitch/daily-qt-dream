import type { ReactNode } from "react";
import type { QtReadingRange } from "@/types";
import { StatLabel } from "@/components/ui/StatLabel";

/** Shared 본문 header: label + range/title (optional trailing on title row). */
export function ReadingPassageHeader({
  reading,
  label = "오늘의 말씀",
  trailing,
  /** When set, render this after the title row (e.g. full-bleed divider below). */
  afterTitle,
  /** Range + title use `--color-ink-blue`. */
  inkTitle = false,
}: {
  reading: QtReadingRange;
  label?: string | null;
  trailing?: ReactNode;
  afterTitle?: ReactNode;
  inkTitle?: boolean;
}) {
  const rangeClass = inkTitle
    ? "text-[var(--color-ink-blue)]"
    : "text-text-main";
  const titleClass = inkTitle
    ? "type-body-sm font-medium text-[var(--color-ink-blue)] opacity-80"
    : "type-body-sm font-medium text-text-secondary";

  return (
    <>
      {label ? (
        <StatLabel className="text-text-secondary">{label}</StatLabel>
      ) : null}
      <div
        className="mt-1 flex items-start gap-2"
      >
        <p
          className={`flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 type-section text-[20px] ${rangeClass}`}
        >
          <span className="reading-passage-range">{reading.range}</span>
          {reading.title ? (
            <span className={titleClass}>{reading.title}</span>
          ) : null}
        </p>
        {trailing ? (
          <div className="ml-auto shrink-0 self-center">{trailing}</div>
        ) : null}
      </div>
      {afterTitle}
    </>
  );
}
