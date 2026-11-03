"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "삭제",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#243746]/45 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] rounded-[24px] bg-white p-5 shadow-[var(--shadow-soft)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-title"
          className="text-lg font-semibold tracking-tight text-text-main"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <PrimaryButton
            type="button"
            variant="soft"
            className="flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </PrimaryButton>
          <PrimaryButton
            type="button"
            className="flex-1 !bg-[#E35D5D] !shadow-none"
            onClick={onConfirm}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
