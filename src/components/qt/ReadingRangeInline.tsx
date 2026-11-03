import { BookOpen } from "lucide-react";
import type { QtReadingRange } from "@/types";

/** Compact reading range block for embedding inside another card. */
export function ReadingRangeInline({ reading }: { reading: QtReadingRange }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-sky-light/70 px-3.5 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sky">
        <BookOpen size={16} strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-secondary">오늘의 본문</p>
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
