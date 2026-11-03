import { BookOpen } from "lucide-react";
import type { QtReadingRange } from "@/types";

/** Compact reading-range block — soft sky wash is the app-wide visual milestone. */
export function ReadingRangeInline({
  reading,
  label = "오늘의 본문",
}: {
  reading: QtReadingRange;
  label?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-sky-light px-3.5 py-3 shadow-[var(--shadow-soft)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-text-main">
        <BookOpen size={16} strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-text-main">
          {reading.range}
        </p>
        {reading.title ? (
          <p className="mt-0.5 text-xs text-text-secondary">{reading.title}</p>
        ) : null}
      </div>
    </div>
  );
}
