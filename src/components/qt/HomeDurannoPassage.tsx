import { ExternalLink } from "lucide-react";
import { ReadingPassageHeader } from "@/components/qt/ReadingPassageHeader";
import type { DurannoTodayMeta } from "@/lib/duranno";

/**
 * Home 본문 strip: Duranno range + title labels only, plus one CTA.
 * Full scripture stays on Duranno — never embed the passage body here.
 */
export function HomeDurannoPassage({
  reading,
  label = "오늘의 말씀",
}: {
  reading: DurannoTodayMeta;
  label?: string;
}) {
  return (
    <div className="shadow-none">
      <ReadingPassageHeader
        reading={{
          date: reading.date,
          range: reading.range || "—",
          title: reading.title || undefined,
        }}
        label={label}
      />
      <a
        href={reading.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-cta px-[var(--space-control-x)] py-4 type-body font-bold !text-[var(--color-mint)] shadow-none transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 [&_svg]:!text-[var(--color-mint)]"
      >
        오늘의 말씀 읽기
        <ExternalLink size={18} strokeWidth={2} aria-hidden />
      </a>
    </div>
  );
}
