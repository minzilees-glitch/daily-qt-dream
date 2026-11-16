import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { StatLabel } from "@/components/ui/StatLabel";
import type { DurannoTodayMeta } from "@/lib/duranno";

/**
 * 말씀 header — eyebrow + verse range (+ optional sky 「말씀보기」 text link).
 * No 본문 써머리 / title line (home + history).
 * Home: full-bleed mint via `.home-duranno-in-sheet` + Duranno link.
 * History: `embedded` skips mint (parent owns wash); pass `showLink` for today only.
 */
export function HomeDurannoPassage({
  reading,
  label = "오늘의 말씀",
  embedded = false,
  /** Home + today history — Duranno bible URL. Default true. */
  showLink = true,
  /** Right-aligned on the 말씀구절 (range) row (e.g. edit icon). */
  rangeTrailing,
}: {
  reading: Pick<DurannoTodayMeta, "range"> &
    Partial<Pick<DurannoTodayMeta, "url">>;
  label?: string;
  embedded?: boolean;
  showLink?: boolean;
  rangeTrailing?: ReactNode;
}) {
  const range = reading.range || "—";
  const linkUrl = showLink ? reading.url?.trim() : "";

  const body = (
    <>
      <StatLabel className="home-duranno-label min-w-0 truncate text-text-secondary">
        {label}
      </StatLabel>
      {/* Trailing share/edit stay absolute so they don't inflate range-row
          height (h-8 buttons vs range text). Far-right = actions. */}
      <div className="relative mt-1">
        <div
          className={`flex min-w-0 items-center${
            rangeTrailing ? (linkUrl ? " pr-24" : " pr-16") : ""
          }`}
        >
          <p className="reading-passage-range m-0 w-auto max-w-full shrink truncate leading-none">
            {range}
          </p>
          {linkUrl ? (
            <>
              {/* Dedicated spacer — not flex gap (gap was easy to miss / override). */}
              <span className="home-duranno-cta-gap shrink-0" aria-hidden />
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="home-duranno-cta inline-flex shrink-0 whitespace-nowrap self-center"
                style={{
                  color: "var(--color-sky-deep)",
                  WebkitTextFillColor: "var(--color-sky-deep)",
                  opacity: 1,
                }}
                aria-label="말씀보기"
                title="말씀보기"
              >
                말씀보기
                <ArrowUpRight
                  size={18}
                  strokeWidth={2.25}
                  color="var(--color-sky-deep)"
                  aria-hidden
                />
              </a>
            </>
          ) : null}
        </div>
        {rangeTrailing ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 shrink-0">
            {rangeTrailing}
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return <div className="home-duranno-meta">{body}</div>;
  }

  return <div className="home-duranno-in-sheet shadow-none">{body}</div>;
}
