/**
 * Square crop helpers for profile avatars.
 * Viewport is a square; user pans/zooms, then we export a JPEG thumbnail.
 */

import { blobToDataUrl } from "@/lib/avatar-image";

/** Exported avatar edge — enough for ~50–96 CSS px at 2–3× retina. */
const OUT_EDGE = 200;
const JPEG_QUALITY = 0.72;
const MAX_BYTES = 1_500_000;

export type AvatarCropTransform = {
  /** Extra zoom on top of cover-fit (1 = just cover). */
  zoom: number;
  /** Pan in viewport pixels (positive = image moves right/down). */
  offsetX: number;
  offsetY: number;
};

export function defaultCropTransform(): AvatarCropTransform {
  return { zoom: 1, offsetX: 0, offsetY: 0 };
}

/** Cover-fit scale so the image fills a square viewport of `viewSize`. */
export function coverScale(
  imageWidth: number,
  imageHeight: number,
  viewSize: number,
): number {
  if (!imageWidth || !imageHeight || !viewSize) return 1;
  return Math.max(viewSize / imageWidth, viewSize / imageHeight);
}

/**
 * Clamp pan so the scaled image still covers the square viewport.
 */
export function clampCropOffset(
  imageWidth: number,
  imageHeight: number,
  viewSize: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): { offsetX: number; offsetY: number } {
  const base = coverScale(imageWidth, imageHeight, viewSize) * Math.max(1, zoom);
  const drawnW = imageWidth * base;
  const drawnH = imageHeight * base;
  const maxX = Math.max(0, (drawnW - viewSize) / 2);
  const maxY = Math.max(0, (drawnH - viewSize) / 2);
  return {
    offsetX: Math.min(maxX, Math.max(-maxX, offsetX)),
    offsetY: Math.min(maxY, Math.max(-maxY, offsetY)),
  };
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("이미지 변환에 실패했어요."));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Render the visible square crop to a 200×200 JPEG ready for Storage upload.
 */
export async function exportSquareAvatarCrop(
  source: Blob | string,
  viewSize: number,
  transform: AvatarCropTransform,
): Promise<{ dataUrl: string; blob: Blob }> {
  const src =
    typeof source === "string" ? source : await blobToDataUrl(source);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () =>
      reject(new Error("이미지를 열 수 없어요. JPEG/PNG로 다시 선택해 주세요."));
    el.src = src;
  });

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) throw new Error("이미지를 열 수 없어요.");

  const zoom = Math.max(1, transform.zoom);
  const base = coverScale(iw, ih, viewSize) * zoom;
  const clamped = clampCropOffset(
    iw,
    ih,
    viewSize,
    zoom,
    transform.offsetX,
    transform.offsetY,
  );

  // Viewport center → image pixel at center of crop.
  const drawnW = iw * base;
  const drawnH = ih * base;
  const left = (viewSize - drawnW) / 2 + clamped.offsetX;
  const top = (viewSize - drawnH) / 2 + clamped.offsetY;

  // Source rect in image pixels corresponding to the viewport square.
  const sx = (-left) / base;
  const sy = (-top) / base;
  const sw = viewSize / base;
  const sh = viewSize / base;

  const canvas = document.createElement("canvas");
  canvas.width = OUT_EDGE;
  canvas.height = OUT_EDGE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 변환에 실패했어요.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUT_EDGE, OUT_EDGE);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_EDGE, OUT_EDGE);

  let quality = JPEG_QUALITY;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToJpegBlob(canvas, quality);
  }
  if (blob.size > MAX_BYTES) {
    throw new Error("사진이 너무 커요. 더 작게 확대해서 다시 시도해 주세요.");
  }

  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, blob };
}
