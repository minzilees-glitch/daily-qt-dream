"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Camera, UserRound } from "lucide-react";
import { useApp } from "@/lib/app-context";
import {
  clampCropOffset,
  coverScale,
  defaultCropTransform,
  exportSquareAvatarCrop,
  type AvatarCropTransform,
} from "@/lib/avatar-crop";
import { yieldToUi } from "@/lib/avatar-image";

const CROP_VIEW = 280;

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
  const objectUrlRef = useRef<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceBlob, setSourceBlob] = useState<Blob | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [transform, setTransform] = useState<AvatarCropTransform>(
    defaultCropTransform,
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => () => revokeObjectUrl(), []);

  const resetCrop = useCallback(() => {
    setTransform(defaultCropTransform());
    setImgSize(null);
  }, []);

  if (!currentUser) return null;

  const avatar = currentUser.avatarUrl ?? null;
  const initialShell =
    "bg-sky-light text-[var(--color-ink-blue)] hover:bg-sky-light";
  const shell =
    fallback === "initial"
      ? initialShell
      : light
        ? "bg-white/20 text-white hover:bg-white/30"
        : "bg-sky-light text-sky hover:bg-sky-light";

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
    setSourceUrl(null);
    setSourceBlob(null);
    setError(null);
    setSaving(false);
    resetCrop();
    revokeObjectUrl();
  };

  const onPick = (file: File | null) => {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요.");
      setOpen(true);
      setSourceUrl(null);
      setSourceBlob(null);
      return;
    }

    revokeObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setSourceUrl(objectUrl);
    setSourceBlob(file);
    setError(null);
    resetCrop();
    setOpen(true);
  };

  const onImageLoad = (w: number, h: number) => {
    setImgSize({ w, h });
    setTransform(defaultCropTransform());
  };

  const applyPan = (nextX: number, nextY: number, zoom: number) => {
    if (!imgSize) {
      setTransform((t) => ({ ...t, offsetX: nextX, offsetY: nextY, zoom }));
      return;
    }
    const clamped = clampCropOffset(
      imgSize.w,
      imgSize.h,
      CROP_VIEW,
      zoom,
      nextX,
      nextY,
    );
    setTransform({ zoom, ...clamped });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!sourceUrl || saving) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.offsetX,
      originY: transform.offsetY,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    applyPan(drag.originX + dx, drag.originY + dy, transform.zoom);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const onSave = async () => {
    if (saving || !sourceBlob || !sourceUrl) return;
    setSaving(true);
    setError(null);
    try {
      await yieldToUi();
      const cropped = await exportSquareAvatarCrop(
        sourceBlob,
        CROP_VIEW,
        transform,
      );
      const res = await setAvatarUrl(cropped.blob);
      if (!res.ok) {
        setError(res.message || "저장에 실패했어요.");
        return;
      }
      setOpen(false);
      setSourceUrl(null);
      setSourceBlob(null);
      setError(null);
      resetCrop();
      revokeObjectUrl();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "저장에 실패했어요. JPEG/PNG로 다시 시도해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  };

  const baseCover = imgSize
    ? coverScale(imgSize.w, imgSize.h, CROP_VIEW) * transform.zoom
    : 1;
  const drawnW = imgSize ? imgSize.w * baseCover : CROP_VIEW;
  const drawnH = imgSize ? imgSize.h * baseCover : CROP_VIEW;

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
          className={`absolute -bottom-0.5 -right-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full ${
            light ? "bg-white/90 text-sky" : "bg-sky text-white"
          }`}
        >
          <Camera size={14} strokeWidth={2.2} aria-hidden />
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

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-[var(--space-page-x)]"
          role="dialog"
          aria-modal="true"
          aria-label="프로필 사진 자르기"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-[var(--radius-md)] bg-white p-[var(--space-card)] shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="type-body font-semibold text-text-main">
              프로필 사진 변경
            </p>
            <p className="mt-1 type-caption text-text-secondary">
              드래그로 위치, 슬라이더로 확대 후 정사각형으로 저장해요.
            </p>

            {sourceUrl ? (
              <div className="mt-[var(--space-stack-sm)] flex flex-col items-center gap-3">
                <div
                  className="relative touch-none overflow-hidden rounded-full bg-sky-light"
                  style={{ width: CROP_VIEW, height: CROP_VIEW }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourceUrl}
                    alt="자르기 미리보기"
                    draggable={false}
                    className="absolute max-w-none select-none"
                    style={{
                      width: drawnW,
                      height: drawnH,
                      left: (CROP_VIEW - drawnW) / 2 + transform.offsetX,
                      top: (CROP_VIEW - drawnH) / 2 + transform.offsetY,
                    }}
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      onImageLoad(el.naturalWidth, el.naturalHeight);
                    }}
                    onError={() => {
                      setError(
                        "이미지를 열 수 없어요. JPEG/PNG로 다시 선택해 주세요.",
                      );
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/80"
                    aria-hidden
                  />
                </div>

                <label className="flex w-full max-w-[280px] flex-col gap-1">
                  <span className="type-caption text-text-secondary">확대</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={transform.zoom}
                    disabled={saving}
                    onChange={(e) => {
                      const zoom = Number(e.target.value);
                      applyPan(transform.offsetX, transform.offsetY, zoom);
                    }}
                    className="w-full accent-[var(--color-sky)]"
                    aria-label="사진 확대"
                  />
                </label>
              </div>
            ) : null}

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
                onClick={closeModal}
              >
                {sourceUrl ? "취소" : "닫기"}
              </button>
              <button
                type="button"
                disabled={saving || !sourceUrl}
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
