"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import type { QtReadingRange } from "@/types";

const PREVIEW_CHARS = 140;

/** Soft sky-wash 본문: range + scripture with 「본문 더보기」 accordion. */
export function ReadingPassageBlock({
  reading,
  label = "본문",
}: {
  reading: QtReadingRange;
  label?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const passage = reading.passage?.trim() ?? "";
  const needsToggle = passage.length > PREVIEW_CHARS;
  const shown =
    expanded || !needsToggle
      ? passage
      : `${passage.slice(0, PREVIEW_CHARS).trimEnd()}…`;

  return (
    <div className="rounded-[20px] bg-sky-light px-4 py-4 shadow-none">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-text-main">
          <BookOpen size={18} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-secondary">{label}</p>
          <p className="mt-0.5 text-[16px] font-semibold tracking-tight text-text-main">
            {reading.range}
          </p>
          {reading.title ? (
            <p className="mt-0.5 text-sm text-text-secondary">{reading.title}</p>
          ) : null}
        </div>
      </div>

      {passage ? (
        <div className="mt-3 border-t border-white/70 pt-3">
          <p className="text-[14px] leading-relaxed tracking-tight text-text-main whitespace-pre-wrap">
            {shown}
          </p>
          {needsToggle ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-bold text-cta transition hover:brightness-95"
              aria-expanded={expanded}
            >
              {expanded ? "본문 접기" : "본문 더보기"}
              {expanded ? (
                <ChevronUp size={16} strokeWidth={2.2} aria-hidden />
              ) : (
                <ChevronDown size={16} strokeWidth={2.2} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
