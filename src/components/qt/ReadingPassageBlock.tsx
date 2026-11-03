"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { QtReadingRange } from "@/types";
import { ReadingPassageHeader } from "@/components/qt/ReadingPassageHeader";

const PREVIEW_CHARS = 140;
/** Body is text-[16px]; verse nums are 1pt smaller. */
const VERSE_NUM_CLASS = "text-[15px] opacity-60";

function renderPassage(text: string): ReactNode {
  // Style leading verse numbers: "1  예수께서… 2  입을 열어…"
  const parts = text.split(/(\d+)(?=\s)/g);
  if (parts.length === 1) return text;

  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (!chunk) continue;
    if (/^\d+$/.test(chunk) && i + 1 < parts.length && /^\s/.test(parts[i + 1] ?? "")) {
      nodes.push(
        <span key={`v-${i}`} className={VERSE_NUM_CLASS}>
          {chunk}
        </span>,
      );
      // One extra space after the verse number (in addition to source whitespace).
      nodes.push(<span key={`vs-${i}`}>{" "}</span>);
    } else {
      nodes.push(<span key={`t-${i}`}>{chunk}</span>);
    }
  }
  return nodes;
}

/** Soft sky-wash 본문: shared header + scripture accordion (past/today). */
export function ReadingPassageBlock({
  reading,
  label = "본문",
  defaultExpanded = false,
}: {
  reading: QtReadingRange;
  label?: string;
  /** When true, verse body starts fully expanded (나의 QT). */
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const passage = reading.passage?.trim() ?? "";
  const needsToggle = passage.length > PREVIEW_CHARS;
  const shown = useMemo(() => {
    if (expanded || !needsToggle) return passage;
    return `${passage.slice(0, PREVIEW_CHARS).trimEnd()}…`;
  }, [expanded, needsToggle, passage]);

  return (
    <div className="rounded-[20px] bg-sky-light px-4 py-4 shadow-none">
      <ReadingPassageHeader reading={reading} label={label} />

      {passage ? (
        <div className="mt-3 border-t border-white/70 pt-3">
          <p className="text-[16px] leading-[1.8] tracking-tight text-text-main whitespace-pre-wrap">
            {renderPassage(shown)}
          </p>
          {needsToggle ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 flex w-full items-center justify-center bg-transparent p-0 text-cta shadow-none transition hover:brightness-95"
              aria-expanded={expanded}
              aria-label={expanded ? "본문 접기" : "본문 더보기"}
            >
              {expanded ? (
                <ChevronUp size={20} strokeWidth={2} aria-hidden />
              ) : (
                <ChevronDown size={20} strokeWidth={2} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
