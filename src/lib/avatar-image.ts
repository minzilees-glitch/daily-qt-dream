/** Max edge for profile thumbnail (Storage bucket limit is 2 MiB). */
const MAX_EDGE = 384;
const JPEG_QUALITY = 0.65;
/** Soft target under Storage 2 MiB after base64 overhead. */
const MAX_BYTES = 1_500_000;

/**
 * Decode a File or data URL into an HTMLImageElement.
 * HEIC/HEIF often fails outside Safari — callers should surface a clear error.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("이미지를 열 수 없어요. JPEG/PNG로 다시 선택해 주세요."));
    img.src = src;
  });
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

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) reject(new Error("이미지 형식을 읽지 못했어요."));
      else resolve(result);
    };
    reader.onerror = () => reject(new Error("이미지 형식을 읽지 못했어요."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Resize + JPEG-compress a picked photo into a small avatar thumbnail.
 * Keeps uploads under the avatars bucket 2 MiB limit and avoids localStorage bloat.
 */
export async function compressAvatarImage(
  source: File | string,
): Promise<{ dataUrl: string; blob: Blob }> {
  if (typeof source !== "string") {
    const mime = source.type || "";
    if (mime && !mime.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드할 수 있어요.");
    }
    if (/heic|heif/i.test(mime) || /\.heic$/i.test(source.name)) {
      // Most Chromium browsers cannot decode HEIC in <img>/canvas.
      throw new Error(
        "이 형식(HEIC)은 지원하지 않아요. JPEG/PNG로 변환하거나 다른 사진을 선택해 주세요.",
      );
    }
  }

  const src =
    typeof source === "string" ? source : await blobToDataUrl(source);
  const img = await loadImage(src);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error("이미지를 열 수 없어요.");

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 변환에 실패했어요.");
  ctx.drawImage(img, 0, 0, cw, ch);

  let quality = JPEG_QUALITY;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToJpegBlob(canvas, quality);
  }
  if (blob.size > MAX_BYTES) {
    throw new Error("사진이 너무 커요. 더 작은 사진으로 다시 시도해 주세요.");
  }

  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, blob };
}
