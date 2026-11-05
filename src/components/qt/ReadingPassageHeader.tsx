import type { ReactNode } from "react";
import type { QtReadingRange } from "@/types";
import { StatLabel } from "@/components/ui/StatLabel";

/** Shared 본문 header: label + range/title (optional trailing on title row). */
export function ReadingPassageHeader({
  reading,
  label = "본문",
  trailing,
  /** When set, render this after the title row (e.g. full-bleed divider below). */
  afterTitle,
}: {
  reading: QtReadingRange;
  label?: string | null;
  trailing?: ReactNode;
  afterTitle?: ReactNode;
}) {
  return (
    <>
      {label ? (
        <StatLabel className="text-text-secondary">{label}</StatLabel>
      ) : null}
      <div
        className={`flex items-start gap-2 ${label ? "mt-3" : "mt-1"}`}
      >
        <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 type-section text-text-main">
          <span>{reading.range}</span>
          {reading.title ? (
            <span className="type-body-sm font-medium text-text-secondary">
              {reading.title}
            </span>
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
