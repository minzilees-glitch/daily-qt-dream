/**
 * Profile thumbnail defaults (client-side, before Storage upload):
 * max edge 384px, JPEG quality ~0.65 (bucket limit 2 MiB).
 */
const MAX_EDGE = 384;
const JPEG_QUALITY = 0.65;
/** Soft target under Storage 2 MiB after base64 overhead. */
const MAX_BYTES = 1_500_000;
/** Guard against hung decode/compress on huge phone photos. */
const COMPRESS_TIMEOUT_MS = 20_000;

const HEIC_MSG =
  "이 형식(HEIC)은 지원하지 않아요. JPEG/PNG로 변환하거나 다른 사진을 선택해 주세요.";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Yield so the UI can paint (modal open) before heavy canvas work. */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

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

/** Detect HEIC/HEIF by MIME, File name, or ISO `ftyp` brand (empty MIME on some iOS picks). */
async function assertNotHeic(source: Blob): Promise<void> {
  const mime = source.type || "";
  const name = source instanceof File ? source.name : "";
  if (/heic|heif/i.test(mime) || /\.heic$/i.test(name)) {
    throw new Error(HEIC_MSG);
  }
  try {
    const buf = await source.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length < 12) return;
    const brand = String.fromCharCode(
      bytes[4]!,
      bytes[5]!,
      bytes[6]!,
      bytes[7]!,
      bytes[8]!,
      bytes[9]!,
      bytes[10]!,
      bytes[11]!,
    );
    if (/ftyp/i.test(brand) && /heic|heif|mif1|msf1/i.test(brand)) {
      throw new Error(HEIC_MSG);
    }
  } catch (err) {
    if (err instanceof Error && err.message === HEIC_MSG) throw err;
  }
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

export async function blobToDataUrl(blob: Blob): Promise<string> {
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
 * True when the picker already produced a small JPEG thumbnail —
 * skip a second canvas pass (main-thread freeze on mobile).
 */
export function isPrecompressedAvatarJpeg(blob: Blob): boolean {
  return (
    blob.type === "image/jpeg" &&
    blob.size > 0 &&
    blob.size <= MAX_BYTES
  );
}

/** Build avatar payload from an already-compressed JPEG without re-encoding. */
export async function jpegBlobToAvatarPayload(
  blob: Blob,
): Promise<{ dataUrl: string; blob: Blob }> {
  // Cloud upload only needs the Blob; skip data URL unless caller needs preview.
  return { dataUrl: "", blob };
}

async function drawSourceToCanvas(
  source: Blob | string,
): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap | null = null;
  let drawable: CanvasImageSource | null = null;
  let w = 0;
  let h = 0;

  if (typeof source !== "string" && typeof createImageBitmap === "function") {
    try {
      bitmap = await createImageBitmap(source);
      drawable = bitmap;
      w = bitmap.width;
      h = bitmap.height;
    } catch {
      bitmap = null;
      drawable = null;
    }
  }

  if (!drawable) {
    const src =
      typeof source === "string" ? source : await blobToDataUrl(source);
    const img = await loadImage(src);
    drawable = img;
    w = img.naturalWidth || img.width;
    h = img.naturalHeight || img.height;
  }

  if (!drawable || !w || !h) {
    bitmap?.close();
    throw new Error("이미지를 열 수 없어요.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap?.close();
    throw new Error("이미지 변환에 실패했어요.");
  }
  ctx.drawImage(drawable, 0, 0, cw, ch);
  bitmap?.close();
  return canvas;
}

async function compressAvatarImageInner(
  source: Blob | string,
): Promise<{ dataUrl: string; blob: Blob }> {
  if (typeof source !== "string") {
    const mime = source.type || "";
    if (mime && !mime.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드할 수 있어요.");
    }
    await assertNotHeic(source);
  }

  const canvas = await drawSourceToCanvas(source);

  let quality = JPEG_QUALITY;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToJpegBlob(canvas, quality);
  }
  if (blob.size > MAX_BYTES) {
    throw new Error("사진이 너무 커요. 더 작은 사진으로 다시 시도해 주세요.");
  }

  // Preview data URL from the small JPEG only (never from the original photo).
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, blob };
}

/**
 * Resize + JPEG-compress a picked photo into a small avatar thumbnail.
 * Keeps uploads under the avatars bucket 2 MiB limit and avoids localStorage bloat.
 */
export async function compressAvatarImage(
  source: Blob | string,
): Promise<{ dataUrl: string; blob: Blob }> {
  return withTimeout(
    compressAvatarImageInner(source),
    COMPRESS_TIMEOUT_MS,
    "사진 변환이 너무 오래 걸려요. JPEG/PNG로 다시 시도해 주세요.",
  );
}
