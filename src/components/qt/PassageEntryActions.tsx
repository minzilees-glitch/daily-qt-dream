"use client";

import { Pencil } from "lucide-react";

/** Right-aligned edit icon on the 말씀구절 (range) row (home + history). */
export function PassageEntryActions({
  onEdit,
  editActive = false,
}: {
  onEdit: () => void;
  /** While editing — pencil shows pressed/active. */
  editActive?: boolean;
}) {
  const idleIcon =
    "flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] opacity-50 shadow-none transition hover:opacity-80";

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        aria-label="수정"
        aria-pressed={editActive}
        onClick={onEdit}
        className={
          editActive
            ? "flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[var(--color-black)] opacity-100 shadow-none transition"
            : idleIcon
        }
      >
        <Pencil size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
