"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

/**
 * iOS / Kakao WebView: opening a full-screen overlay in the same
 * gesture as the triggering tap can retarget the synthetic click to the
 * backdrop and instantly dismiss the dialog (feels like “삭제 does nothing”).
 */
const BACKDROP_DISMISS_GUARD_MS = 450;

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "삭제",
  cancelLabel = "취소",
  /** `danger` (default) for destructive actions; `primary` for affirmative confirms. */
  confirmTone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const suppressBackdropUntilRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    suppressBackdropUntilRef.current =
      performance.now() + BACKDROP_DISMISS_GUARD_MS;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    // Body lock alone is not enough when `.phone-shell--page-scroll` is the
    // real scroller (verify/login) — lock that too, then restore.
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const shells = Array.from(
      document.querySelectorAll<HTMLElement>(".phone-shell--page-scroll"),
    );
    const prevShell = shells.map((el) => el.style.overflow);
    for (const el of shells) el.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      shells.forEach((el, i) => {
        el.style.overflow = prevShell[i] ?? "";
      });
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const onBackdropDismiss = () => {
    if (performance.now() < suppressBackdropUntilRef.current) return;
    onCancel();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onBackdropDismiss}
    >
      <div
        className="w-full max-w-[22.5rem] rounded-[var(--radius-md)] bg-white p-[var(--space-card)] shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-title"
          className="type-stat text-text-main"
        >
          {title}
        </h2>
        {description ? (
          <p className="qt-validation-hint type-caption mt-2 break-keep break-words text-text-secondary">
            {description}
          </p>
        ) : null}
        <div className="mt-[var(--space-stack)] flex gap-2">
          <PrimaryButton
            type="button"
            variant="soft"
            className="flex-1 !py-[18px]"
            onClick={onCancel}
          >
            {cancelLabel}
          </PrimaryButton>
          <PrimaryButton
            type="button"
            className={
              confirmTone === "danger"
                ? "flex-1 !bg-danger !py-[18px] !text-white !shadow-none [&_svg]:!text-white"
                : "flex-1 !py-[18px]"
            }
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
