"use client";

import { Pencil, Send, Trash2 } from "lucide-react";

/** Right-aligned share + edit + delete icons on the 말씀구절 (range) row (home + history). */
export function PassageEntryActions({
  onShare,
  onEdit,
  onDelete,
  deleteDisabled = false,
  shareDisabled = false,
}: {
  /** After QT saved — same action as former 「나의 큐티 나누기」. */
  onShare?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
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
      <button
        type="button"
        aria-label="삭제"
        disabled={deleteDisabled}
        onClick={onDelete}
        className="flex h-9 w-9 items-center justify-center bg-transparent text-danger opacity-70 shadow-none transition hover:opacity-100 disabled:opacity-30"
      >
        <Trash2 size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
