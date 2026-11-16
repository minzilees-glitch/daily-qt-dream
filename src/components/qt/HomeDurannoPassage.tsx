import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { StatLabel } from "@/components/ui/StatLabel";
import type { DurannoTodayMeta } from "@/lib/duranno";

/**
 * 말씀 header — range + summary + Duranno icon CTA (no passage body).
 * Home: full-bleed mint via `.home-duranno-in-sheet`.
 * History: `embedded` skips mint (parent `.premium-history-passage` owns wash).
 */
export function HomeDurannoPassage({
  reading,
  label = "오늘의 말씀",
  embedded = false,
  /** Right-aligned on the label row (e.g. history ⋮ menu). */
  labelTrailing,
}: {
  reading: Pick<DurannoTodayMeta, "range" | "title" | "url">;
  label?: string;
  embedded?: boolean;
  labelTrailing?: ReactNode;
}) {
  const range = reading.range || "—";
  const title = reading.title?.trim();

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <StatLabel className="home-duranno-label min-w-0 flex-1 truncate text-text-secondary">
          {label}
        </StatLabel>
        {labelTrailing ? (
          <div className="shrink-0 self-center">{labelTrailing}</div>
        ) : null}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <p className="reading-passage-range min-w-0 flex-1 truncate">{range}</p>
        <a
          href={reading.url}
          target="_blank"
          rel="noopener noreferrer"
          className="home-duranno-cta shrink-0"
          aria-label="두란노에서 오늘의 말씀 읽기"
          title="두란노에서 오늘의 말씀 읽기"
        >
          <BookOpen size={24} strokeWidth={2} aria-hidden />
          <ArrowUpRight size={20} strokeWidth={2.25} aria-hidden />
        </a>
      </div>
      {title ? (
        <p className="home-duranno-summary mt-1 type-body-sm font-medium">
          {title}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="home-duranno-meta">{body}</div>;
  }

  return <div className="home-duranno-in-sheet shadow-none">{body}</div>;
}
