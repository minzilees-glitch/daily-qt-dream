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
  /** Home: 「오늘의 말씀」+ range + 요약 title on one line. */
  oneLine = false,
}: {
  reading: QtReadingRange;
  label?: string | null;
  trailing?: ReactNode;
  afterTitle?: ReactNode;
  inkTitle?: boolean;
  oneLine?: boolean;
}) {
  /* Secondary summary title next to the range (not the range itself). */
  const titleClass = inkTitle
    ? "type-body-sm font-medium text-[var(--color-ink-blue)] opacity-80"
    : "type-body-sm font-medium text-text-secondary";

  const meta = (
    <>
      {/* 22px via .reading-passage-range — text-[22px] loses to .type-section. */}
      <span className="reading-passage-range shrink-0">{reading.range}</span>
      {reading.title ? (
        <span className={`min-w-0 truncate ${titleClass}`}>{reading.title}</span>
      ) : null}
    </>
  );

  if (oneLine) {
    return (
      <>
        <div className="flex items-baseline gap-2">
          <p className="flex min-w-0 flex-1 flex-nowrap items-baseline gap-x-2 overflow-hidden">
            {label ? (
              <StatLabel as="span" className="shrink-0 text-text-secondary">
                {label}
              </StatLabel>
            ) : null}
            {meta}
          </p>
          {trailing ? (
            <div className="ml-auto shrink-0 self-center">{trailing}</div>
          ) : null}
        </div>
        {afterTitle}
      </>
    );
  }

  return (
    <>
      {label ? (
        <StatLabel className="text-text-secondary">{label}</StatLabel>
      ) : null}
      <div className="mt-1 flex items-start gap-2">
        <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {meta}
        </p>
        {trailing ? (
          <div className="ml-auto shrink-0 self-center">{trailing}</div>
        ) : null}
      </div>
      {afterTitle}
    </>
  );
}
