"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import { useApp } from "@/lib/app-context";

export function ProfileAvatarButton({
  light = false,
  size = 44,
  fallback = "icon",
}: {
  light?: boolean;
  size?: number;
  /** Empty state: lucide icon (header) or name initial (mypage). */
  fallback?: "icon" | "initial";
}) {
  const { currentUser, setAvatarUrl } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      setSaving(false);
    }
  }, [open]);

  if (!currentUser) return null;

  const avatar = currentUser.avatarUrl ?? null;
  const shell =
    light
      ? "bg-white/20 text-white hover:bg-white/30"
      : "bg-sky-light text-sky hover:bg-sky-light";

  const onPick = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setPreview(result);
      setError(null);
      setOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onSave = async () => {
    if (!preview || saving) return;
    setSaving(true);
    setError(null);
    const res = await setAvatarUrl(preview);
    setSaving(false);
    if (!res.ok) {
      setError(res.message || "저장에 실패했어요.");
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="프로필 사진 변경"
        onClick={() => inputRef.current?.click()}
        className="relative flex shrink-0 items-center justify-center overflow-visible type-stat transition"
        style={{ width: size, height: size }}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-full ${shell}`}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : fallback === "initial" ? (
            currentUser.name.slice(0, 1)
          ) : (
            <UserRound size={Math.round(size * 0.45)} strokeWidth={1.75} />
          )}
        </span>
        <span
          className={`absolute -bottom-0.5 -right-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full ${
            light ? "bg-white/90 text-sky" : "bg-sky text-white"
          }`}
        >
          <Camera size={10} strokeWidth={2.2} aria-hidden />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {open && preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-[var(--space-page-x)]"
          role="dialog"
          aria-modal="true"
          aria-label="프로필 사진 미리보기"
          onClick={() => {
            if (!saving) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[var(--radius-md)] bg-white p-[var(--space-card)] shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="type-body font-semibold text-text-main">
              프로필 사진 변경
            </p>
            <div className="mt-[var(--space-stack-sm)] flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="미리보기"
                className="h-36 w-36 rounded-full object-cover"
              />
            </div>
            {error ? (
              <p className="qt-validation-hint mt-3 text-center type-caption text-danger">
                {error}
              </p>
            ) : null}
            <div className="mt-[var(--space-stack)] grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={saving}
                className="rounded-full bg-sky-light px-4 py-3 type-body-sm font-semibold text-text-main disabled:opacity-50"
                onClick={() => setOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={saving}
                className="btn-cta bg-cta rounded-full px-4 py-3 type-body-sm font-semibold !text-[var(--color-mint)] disabled:opacity-50"
                onClick={() => void onSave()}
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
