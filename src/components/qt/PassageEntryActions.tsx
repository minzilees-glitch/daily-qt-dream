"use client";

import { Pencil, Send } from "lucide-react";

/** Right-aligned share + edit icons on the 말씀구절 (range) row (home + history). */
export function PassageEntryActions({
  onShare,
  onEdit,
  shareDisabled = false,
  editActive = false,
}: {
  /** After QT saved — same action as former 「나의 큐티 나누기」. */
  onShare?: () => void;
  onEdit: () => void;
  shareDisabled?: boolean;
  /** While editing — pencil shows pressed/active. */
  editActive?: boolean;
}) {
  const idleIcon =
    "flex h-9 w-9 items-center justify-center bg-transparent text-[var(--color-black)] opacity-50 shadow-none transition hover:opacity-80 disabled:opacity-30";

  return (
    <div className="flex items-center gap-0.5">
      {onShare ? (
        <button
          type="button"
          aria-label="나의 큐티 나누기"
          disabled={shareDisabled}
          onClick={onShare}
          className={idleIcon}
        >
          <Send size={18} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="수정"
        aria-pressed={editActive}
        onClick={onEdit}
        className={
          editActive
            ? "flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] opacity-100 shadow-none transition"
            : `${idleIcon} rounded-full`
        }
      >
        <Pencil size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
