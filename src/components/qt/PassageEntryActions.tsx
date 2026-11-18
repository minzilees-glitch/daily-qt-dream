"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil } from "lucide-react";

/** Right-aligned copy + edit icons on the 말씀구절 (range) row (home + history). */
export function PassageEntryActions({
  onEdit,
  onCopy,
  editActive = false,
}: {
  onEdit: () => void;
  /** Clipboard-copy QT share text (same format as former 텍스트로 나누기). */
  onCopy?: () => void;
  /** While editing — muted check (tap again to exit). Idle — muted pencil. */
  editActive?: boolean;
}) {
  const [copiedFlash, setCopiedFlash] = useState(false);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    },
    [],
  );

  const handleCopy = () => {
    onCopy?.();
    setCopiedFlash(true);
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setCopiedFlash(false);
      flashTimerRef.current = null;
    }, 1000);
  };

  return (
    <div className="flex items-center gap-0">
      {onCopy ? (
        <button
          type="button"
          aria-label="텍스트 복사"
          title="텍스트 복사"
          onClick={handleCopy}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] shadow-none transition ${
            copiedFlash
              ? "opacity-100"
              : "opacity-30 hover:opacity-50"
          }`}
        >
          {copiedFlash ? (
            <Check size={16} strokeWidth={2} aria-hidden />
          ) : (
            <Copy size={16} strokeWidth={1.75} aria-hidden />
          )}
        </button>
      ) : null}
      <button
        type="button"
        aria-label={editActive ? "수정 끝내기" : "큐티 수정"}
        title={editActive ? "수정 끝내기" : "큐티 수정"}
        aria-pressed={editActive}
        onClick={onEdit}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] opacity-30 shadow-none transition hover:opacity-50"
      >
        {editActive ? (
          <Check size={16} strokeWidth={1.75} aria-hidden />
        ) : (
          <Pencil size={16} strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </div>
  );
}
