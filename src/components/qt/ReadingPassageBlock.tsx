"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { QtReadingRange } from "@/types";
import { ReadingPassageHeader } from "@/components/qt/ReadingPassageHeader";

/** Body is type-body; verse nums are 1pt smaller. */
const VERSE_NUM_CLASS = "type-body-sm opacity-60";

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

/** Soft sky-wash 본문: shared header + optional scripture accordion. */
export function ReadingPassageBlock({
  reading,
  label = "오늘의 말씀",
  defaultExpanded = false,
  embedded = false,
  /** When false, always show full passage with no chevron toggle (Home / 나의 QT들). */
  collapsible = true,
  /** Dark-blue range/title ink (`--color-ink-blue`). */
  inkTitle = false,
  /** Label + range + summary title on one line (home). */
  oneLineHeader = false,
}: {
  reading: QtReadingRange;
  label?: string;
  /** When true, verse body starts fully expanded (collapsible only). */
  defaultExpanded?: boolean;
  /**
   * When true (inside SoftCard): same surface as the card —
   * no sky wash / nested panel.
   */
  embedded?: boolean;
  collapsible?: boolean;
  inkTitle?: boolean;
  oneLineHeader?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || !collapsible);
  const passage = reading.passage?.trim() ?? "";
  const hasPassage = passage.length > 0;
  const showBody = hasPassage && (!collapsible || expanded);

  const toggle =
    collapsible && hasPassage ? (
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center justify-center bg-transparent p-0 text-cta shadow-none transition hover:brightness-95"
        aria-expanded={expanded}
        aria-label={expanded ? "본문 접기" : "본문 더보기"}
      >
        {expanded ? (
          <ChevronUp size={20} strokeWidth={2} aria-hidden />
        ) : (
          <ChevronDown size={20} strokeWidth={2} aria-hidden />
        )}
      </button>
    ) : null;

  /* Home SoftCard (embedded): no divider under title row. History keeps it. */
  const divider =
    hasPassage && !embedded ? (
      <div
        className="-mx-4 mt-3 h-px bg-divider shadow-none"
        role="separator"
        aria-hidden
      />
    ) : null;

  return (
    <div
      className={
        embedded
          ? "shadow-none"
          : "soft-card px-4 py-4"
      }
    >
      <ReadingPassageHeader
        reading={reading}
        label={label}
        trailing={toggle}
        afterTitle={divider}
        inkTitle={inkTitle}
        oneLine={oneLineHeader}
      />

      {showBody ? (
        <div className="mt-3">
          <p className="type-body leading-[1.8] text-text-main whitespace-pre-wrap">
            {renderPassage(passage)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
