"use client";

import { Copy, Pencil } from "lucide-react";

/** Right-aligned copy + edit icons on the 말씀구절 (range) row (home + history). */
export function PassageEntryActions({
  onEdit,
  onCopy,
  editActive = false,
}: {
  onEdit: () => void;
  /** Clipboard-copy QT share text (same format as former 텍스트로 나누기). */
  onCopy?: () => void;
  /** While editing — pencil shows pressed/active. */
  editActive?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {onCopy ? (
        <button
          type="button"
          aria-label="텍스트 복사"
          title="텍스트 복사"
          onClick={onCopy}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] opacity-30 shadow-none transition hover:opacity-50"
        >
          <Copy size={20} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="큐티 수정"
        title="큐티 수정"
        aria-pressed={editActive}
        onClick={onEdit}
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] shadow-none transition ${
          editActive ? "opacity-100" : "opacity-30 hover:opacity-50"
        }`}
      >
        <Pencil size={20} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
