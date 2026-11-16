import { ArrowUpRight, BookOpen } from "lucide-react";
import { StatLabel } from "@/components/ui/StatLabel";
import type { DurannoTodayMeta } from "@/lib/duranno";

/**
 * Sheet-top 말씀 header — full-bleed mint (no card radius/inset).
 * Same horizontal pad as QT fields; only mint bg differs.
 */
export function HomeDurannoPassage({
  reading,
  label = "오늘의 말씀",
}: {
  reading: DurannoTodayMeta;
  label?: string;
}) {
  const range = reading.range || "—";
  const title = reading.title?.trim();

  return (
    <div className="home-duranno-in-sheet shadow-none">
      <StatLabel className="text-text-secondary">{label}</StatLabel>
      <div className="mt-1 flex items-center gap-2">
        <p className="reading-passage-range min-w-0 flex-1 truncate">{range}</p>
        <a
          href={reading.url}
          target="_blank"
          rel="noopener noreferrer"
          className="home-duranno-cta inline-flex shrink-0 items-center gap-0.5 text-[var(--color-ink-blue)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
          aria-label="두란노에서 오늘의 말씀 읽기"
          title="두란노에서 오늘의 말씀 읽기"
        >
          <BookOpen size={20} strokeWidth={2} aria-hidden />
          <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden />
        </a>
      </div>
      {title ? (
        <p className="home-duranno-summary mt-1 type-body-sm font-medium text-text-secondary">
          {title}
        </p>
      ) : null}
    </div>
  );
}
