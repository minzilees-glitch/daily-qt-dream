import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export type AvatarRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const AVATARS_BUCKET = "avatars";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extForMime(mime: string): string {
  return MIME_EXT[mime] ?? "jpg";
}

/** Storage object path: `{userId}/avatar.{ext}` */
export function avatarObjectPath(userId: string, mime: string): string {
  return `${userId}/avatar.${extForMime(mime)}`;
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1]!;
  const b64 = match[2]!;
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/** Map Storage / PostgREST failures to actionable Korean copy. */
export function explainAvatarCloudError(raw: string): string {
  const msg = raw.trim();
  const lower = msg.toLowerCase();
  if (
    lower.includes("row-level security") ||
    lower.includes("violates row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("not authorized") ||
    lower.includes("jwt") ||
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return "클라우드 저장이 권한 때문에 막혔어요. (로그인 JWT 없음 / Storage·profiles RLS). 잠시 후 다시 시도하거나 관리자에게 알려 주세요.";
  }
  if (lower.includes("payload too large") || lower.includes("maximum allowed")) {
    return "사진이 너무 커요. 더 작은 사진으로 다시 시도해 주세요.";
  }
  if (lower.includes("bucket") && lower.includes("not found")) {
    return "아바타 Storage 버킷이 없어요. Supabase avatars 마이그레이션을 확인해 주세요.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "네트워크 오류로 업로드하지 못했어요. 연결을 확인하고 다시 시도해 주세요.";
  }
  return msg || "클라우드 저장에 실패했어요.";
}

/** All profile avatar URLs (id → public URL). Empty map if none / error. */
export async function fetchProfileAvatarMap(): Promise<
  AvatarRepoResult<Record<string, string>>
> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await sb
    .from("profiles")
    .select("id, avatar_url")
    .not("avatar_url", "is", null);

  if (error) return { ok: false, error: error.message };

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.avatar_url) map[row.id] = row.avatar_url;
  }
  return { ok: true, data: map };
}

/**
 * Upload image bytes to Storage, write `profiles.avatar_url`, return public URL.
 * Path: `avatars/{userId}/avatar.{ext}` (upsert).
 * Callers must hard-fail on `{ ok: false }` and must not persist data URLs.
 */
export async function uploadAndSaveAvatar(
  userId: string,
  blob: Blob,
): Promise<AvatarRepoResult<string>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  if (!userId.trim()) {
    return { ok: false, error: "로그인이 필요해요." };
  }

  const mime = blob.type || "image/jpeg";
  if (!mime.startsWith("image/")) {
    return { ok: false, error: "이미지 파일만 업로드할 수 있어요." };
  }

  const path = avatarObjectPath(userId, mime);
  const { error: uploadError } = await sb.storage
    .from(AVATARS_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: mime,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: explainAvatarCloudError(uploadError.message) };
  }

  // Drop sibling avatar.* (e.g. old .png after new .jpg) so the folder has one file.
  try {
    const { data: listed } = await sb.storage.from(AVATARS_BUCKET).list(userId);
    const stale = (listed ?? [])
      .map((f) => f.name)
      .filter((name) => name.startsWith("avatar.") && name !== path.split("/").pop())
      .map((name) => `${userId}/${name}`);
    if (stale.length) {
      await sb.storage.from(AVATARS_BUCKET).remove(stale);
    }
  } catch {
    // Non-fatal: public URL write below is the source of truth.
  }

  const { data: pub } = sb.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  // Bust CDN/browser cache after replace
  const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;

  // Prefer representation so a missing profile row (silent 0-row update) hard-fails.
  const { data: updated, error: updateError } = await sb
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, avatar_url")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: explainAvatarCloudError(updateError.message) };
  }
  if (!updated?.id) {
    return {
      ok: false,
      error: `프로필(${userId})을 찾지 못했어요. Supabase profiles 시드를 확인해 주세요.`,
    };
  }

  return { ok: true, data: publicUrl };
}

/** Clear Storage object(s) under `{userId}/` and null out profiles.avatar_url. */
export async function clearAvatar(
  userId: string,
): Promise<AvatarRepoResult<null>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data: listed } = await sb.storage.from(AVATARS_BUCKET).list(userId);
  const names = (listed ?? []).map((f) => `${userId}/${f.name}`);
  if (names.length) {
    await sb.storage.from(AVATARS_BUCKET).remove(names);
  }

  const { data: updated, error } = await sb
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: explainAvatarCloudError(error.message) };
  if (!updated?.id) {
    return {
      ok: false,
      error: `프로필(${userId})을 찾지 못했어요. Supabase profiles 시드를 확인해 주세요.`,
    };
  }
  return { ok: true, data: null };
}

export { isSupabaseConfigured };
