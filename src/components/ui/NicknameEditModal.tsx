"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Toast } from "@/components/ui/Toast";
import { useApp } from "@/lib/app-context";

/** Same save path as 계정설정 nickname field (`setDisplayName`). */
export function NicknameEditModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { currentUser, setDisplayName } = useApp();
  const userName = currentUser?.name ?? "";
  const [nickname, setNickname] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(false);

  // Reset draft when the modal opens (render-time adjust — no effect setState).
  if (open && !wasOpen) {
    setWasOpen(true);
    setNickname(userName);
    setToast(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, saving]);

  if (!open || typeof document === "undefined" || !currentUser) return null;

  const nameDirty = nickname.trim() !== currentUser.name.trim();

  const onSave = async () => {
    if (saving || !nameDirty || !nickname.trim()) return;
    setSaving(true);
    const res = await setDisplayName(nickname);
    setSaving(false);
    setToast(res.message);
    if (res.ok) {
      window.setTimeout(() => onClose(), 700);
    } else {
      window.setTimeout(() => setToast(null), 2400);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nickname-edit-title"
        onClick={() => {
          if (!saving) onClose();
        }}
      >
        <div
          className="w-full max-w-[360px] rounded-[var(--radius-md)] bg-white p-[var(--space-card)] shadow-none"
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="nickname-edit-title"
            className="qt-field-title mb-3"
          >
            닉네임
          </h2>
          <input
            id="home-nickname"
            type="text"
            value={nickname}
            maxLength={40}
            autoComplete="nickname"
            autoFocus
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onSave();
              }
            }}
            className="w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-mint)_35%,white)] px-3 py-3 text-center type-body font-semibold text-text-main outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sky)_55%,transparent)]"
          />
          <div className="mt-[var(--space-stack)] flex gap-2">
            <PrimaryButton
              type="button"
              variant="soft"
              className="flex-1"
              disabled={saving}
              onClick={onClose}
            >
              취소
            </PrimaryButton>
            <PrimaryButton
              type="button"
              className="flex-1"
              disabled={!nameDirty || saving || !nickname.trim()}
              onClick={() => void onSave()}
            >
              {saving ? "저장 중…" : "닉네임 저장"}
            </PrimaryButton>
          </div>
        </div>
      </div>
      <Toast message={toast} />
    </>,
    document.body,
  );
}
