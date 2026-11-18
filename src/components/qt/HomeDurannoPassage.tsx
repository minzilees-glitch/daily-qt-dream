"use client";

import type { ReactNode } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { StatLabel } from "@/components/ui/StatLabel";
import type { DurannoTodayMeta } from "@/lib/duranno";
import { openInSystemBrowser } from "@/lib/open-external";

/**
 * 말씀 header — eyebrow + verse range (+ optional deep-sky 「말씀보기」 CTA).
 * No 본문 써머리 / title line (home + history).
 * Home: full-bleed mint via `.home-duranno-in-sheet` + Duranno CTA.
 * History: `embedded` skips mint (parent owns wash); pass `showLink` for today only.
 *
 * 「말씀보기」 is a button (not <a href>) so the current app page never
 * navigates — Duranno only opens in the system browser.
 */
export function HomeDurannoPassage({
  reading,
  label = "오늘의 말씀",
  embedded = false,
  /** Home + today history — Duranno bible URL. Default true. */
  showLink = true,
  /** Right-aligned on the 말씀구절 (range) row (e.g. edit icon). */
  rangeTrailing,
  /** Editing existing QT — leading back control exits edit without saving. */
  onBack,
}: {
  reading: Pick<DurannoTodayMeta, "range"> &
    Partial<Pick<DurannoTodayMeta, "url">>;
  label?: string;
  embedded?: boolean;
  showLink?: boolean;
  rangeTrailing?: ReactNode;
  onBack?: () => void;
}) {
  const range = reading.range || "—";
  const linkUrl = showLink ? reading.url?.trim() : "";

  const body = (
    <>
      <div className="flex min-w-0 items-center gap-1">
        {onBack ? (
          <button
            type="button"
            aria-label="수정 취소"
            title="수정 취소"
            onClick={onBack}
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] opacity-70 shadow-none transition hover:opacity-100"
          >
            <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
        <StatLabel className="home-duranno-label min-w-0 truncate text-text-secondary">
          {label}
        </StatLabel>
      </div>
      {/* Trailing share/edit stay absolute so they don't inflate range-row
          height (h-8 buttons vs range text). Far-right = actions.
          Keep 「말씀보기」 on the same line as 말씀범위: no wrap; tighten
          CTA gap + icon reserve; slightly smaller range type for Amos-length. */}
      <div className="relative mt-1">
        <div
          className={`home-duranno-range-row flex min-w-0 flex-nowrap items-center${
            /* Copy + 수정 (~72px hit targets); 말씀보기 sits in-flow. */
            rangeTrailing ? " pr-[4.75rem]" : ""
          }`}
        >
          <p className="reading-passage-range m-0 min-w-0 shrink-0 self-center whitespace-nowrap leading-none">
            {range}
          </p>
          {linkUrl ? (
            <>
              {/* Dedicated spacer — not flex gap (gap was easy to miss / override). */}
              <span className="home-duranno-cta-gap shrink-0" aria-hidden />
              <button
                type="button"
                className="home-duranno-cta inline-flex shrink-0 cursor-pointer whitespace-nowrap self-center"
                style={{
                  color: "var(--color-sky-deep)",
                  WebkitTextFillColor: "var(--color-sky-deep)",
                  opacity: 1,
                }}
                aria-label="말씀보기 (외부 브라우저)"
                title="외부 브라우저에서 말씀보기"
                onClick={() => openInSystemBrowser(linkUrl)}
              >
                <BookOpen
                  size={16}
                  strokeWidth={2.25}
                  color="var(--color-sky-deep)"
                  aria-hidden
                />
                {/* Fixed-width spacer — margins/gap were collapsing visually. */}
                <span className="home-duranno-cta-icon-gap" aria-hidden>
                  {"\u00A0"}
                </span>
                <span className="home-duranno-cta-label">말씀보기</span>
              </button>
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
