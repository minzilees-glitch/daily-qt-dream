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
 */
export async function uploadAndSaveAvatar(
  userId: string,
  blob: Blob,
): Promise<AvatarRepoResult<string>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

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

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = sb.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  // Bust CDN/browser cache after replace
  const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await sb
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) return { ok: false, error: updateError.message };

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

  const { error } = await sb
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export { isSupabaseConfigured };
