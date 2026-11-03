"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
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
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#243746]/65 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] rounded-[24px] bg-white p-5 shadow-none"
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
    </div>,
    document.body,
  );
}
