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
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        aria-label="수정"
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
