import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { StatLabel } from "@/components/ui/StatLabel";
import type { DurannoTodayMeta } from "@/lib/duranno";

/**
 * 말씀 header — eyebrow + verse range (+ optional Duranno icon CTA).
 * No 본문 써머리 / title line (home + history).
 * Home: full-bleed mint via `.home-duranno-in-sheet` + Duranno link.
 * History: `embedded` skips mint (parent owns wash); pass `showLink={false}`.
 */
export function HomeDurannoPassage({
  reading,
  label = "오늘의 말씀",
  embedded = false,
  /** Home only — history omits the external bible link. Default true. */
  showLink = true,
  /** Right-aligned on the label row (e.g. history ⋮ menu). */
  labelTrailing,
}: {
  reading: Pick<DurannoTodayMeta, "range"> &
    Partial<Pick<DurannoTodayMeta, "url" | "title">>;
  label?: string;
  embedded?: boolean;
  showLink?: boolean;
  labelTrailing?: ReactNode;
}) {
  const range = reading.range || "—";
  const linkUrl = showLink ? reading.url?.trim() : "";

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
      <div className="mt-1 flex min-w-0 items-center gap-4">
        <p className="reading-passage-range min-w-0 shrink truncate">{range}</p>
        {linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="home-duranno-cta inline-flex shrink-0 items-center gap-0.5"
            aria-label="두란노에서 오늘의 말씀 읽기"
            title="두란노에서 오늘의 말씀 읽기"
          >
            <BookOpen size={22} strokeWidth={1.5} aria-hidden />
            <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden />
          </a>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return <div className="home-duranno-meta">{body}</div>;
  }

  return <div className="home-duranno-in-sheet shadow-none">{body}</div>;
}
