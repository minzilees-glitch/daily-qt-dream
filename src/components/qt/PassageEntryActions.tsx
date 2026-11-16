"use client";

import { Pencil, Send } from "lucide-react";

/** Right-aligned share + edit icons on the 말씀구절 (range) row (home + history). */
export function PassageEntryActions({
  onShare,
  onEdit,
  shareDisabled = false,
}: {
  /** After QT saved — same action as former 「나의 큐티 나누기」. */
  onShare?: () => void;
  onEdit: () => void;
  shareDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {onShare ? (
        <button
          type="button"
          aria-label="나의 큐티 나누기"
          disabled={shareDisabled}
          onClick={onShare}
          className="flex h-9 w-9 items-center justify-center bg-transparent text-text-main opacity-70 shadow-none transition hover:opacity-100 disabled:opacity-30"
        >
          <Send size={18} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="수정"
        onClick={onEdit}
        className="flex h-9 w-9 items-center justify-center bg-transparent text-text-main opacity-70 shadow-none transition hover:opacity-100"
      >
        <Pencil size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
