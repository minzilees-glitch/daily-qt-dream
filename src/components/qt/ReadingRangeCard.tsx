import { BookOpen } from "lucide-react";
import type { QtReadingRange } from "@/types";
import { SoftCard } from "@/components/ui/SoftCard";

export function ReadingRangeCard({
  reading,
  compact = false,
}: {
  reading: QtReadingRange;
  compact?: boolean;
}) {
  return (
    <SoftCard padding={compact ? "p-4" : "p-5"}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-light text-sky">
          <BookOpen size={18} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-secondary">오늘의 본문</p>
          <p className="mt-0.5 text-[16px] font-semibold tracking-tight text-text-main">
            {reading.range}
          </p>
          {reading.title ? (
            <p className="mt-1 text-sm text-text-secondary">{reading.title}</p>
          ) : null}
        </div>
      </div>
    </SoftCard>
  );
}
