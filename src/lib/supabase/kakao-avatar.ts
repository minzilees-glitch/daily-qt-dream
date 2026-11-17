import type { User as AuthUser } from "@supabase/supabase-js";
import { extractKakaoMeta } from "@/lib/supabase/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isStoredAvatarUrl } from "@/lib/supabase/avatar-repo";

export type KakaoAvatarSyncResult =
  | { ok: true; status: "uploaded"; avatarUrl: string }
  | { ok: true; status: "skipped"; reason: string }
  | { ok: false; error: string };

/** Kakao CDN / asset hosts we are willing to fetch server-side. */
export function isAllowedKakaoImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return (
      host === "k.kakaocdn.net" ||
      host.endsWith(".kakaocdn.net") ||
      host === "t1.kakaocdn.net" ||
      host.endsWith(".kakao.com")
    );
  } catch {
    return false;
  }
}

/** Decode JWT payload without verifying (token was just issued by Kakao). */
export function decodeJwtPayload(
  jwt: string,
): Record<string, unknown> | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function pictureFromIdToken(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);
  if (!payload) return null;
  const picture = payload.picture;
  return typeof picture === "string" && picture.trim() ? picture.trim() : null;
}

/**
 * Prefer OIDC userinfo `picture`; fall back to Kakao v2/user/me profile_image.
 */
export async function fetchKakaoProfileImageUrl(
  accessToken: string,
): Promise<string | null> {
  const token = accessToken.trim();
  if (!token) return null;

  try {
    const oidc = await fetch("https://kapi.kakao.com/v1/oidc/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (oidc.ok) {
      const data = (await oidc.json()) as { picture?: unknown };
      if (typeof data.picture === "string" && data.picture.trim()) {
        return data.picture.trim();
      }
    }
  } catch {
    // fall through
  }

  try {
    const me = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      cache: "no-store",
    });
    if (!me.ok) return null;
    const data = (await me.json()) as {
      kakao_account?: {
        profile?: {
          profile_image_url?: unknown;
          thumbnail_image_url?: unknown;
        };
      };
      properties?: {
        profile_image?: unknown;
        thumbnail_image?: unknown;
      };
    };
    const candidates = [
      data.kakao_account?.profile?.profile_image_url,
      data.properties?.profile_image,
      data.kakao_account?.profile?.thumbnail_image_url,
      data.properties?.thumbnail_image,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * After Kakao sign-in: download Kakao profile image → avatars bucket → profiles.
 * Skips when `profiles.avatar_url` already points at Storage (custom upload).
 * Best-effort — login must not fail if sync fails.
 */
export async function syncKakaoAvatarAfterLogin(
  authUser: AuthUser,
  preferredImageUrl?: string | null,
): Promise<KakaoAvatarSyncResult> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const {
    data: { session },
  } = await sb.auth.getSession();
  const accessToken = session?.access_token?.trim();
  if (!accessToken) {
    return { ok: false, error: "세션 토큰이 없어요." };
  }

  const meta = extractKakaoMeta(authUser);
  const imageUrl =
    (preferredImageUrl?.trim() || null) ?? meta.avatarUrl ?? null;

  const res = await fetch("/api/auth/kakao/sync-avatar", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });

  let json: {
    ok?: boolean;
    status?: string;
    reason?: string;
    avatarUrl?: string;
    error?: string;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, error: "아바타 동기화 응답을 읽지 못했어요." };
  }

  if (json.ok && json.status === "uploaded" && json.avatarUrl) {
    return { ok: true, status: "uploaded", avatarUrl: json.avatarUrl };
  }
  if (json.ok && json.status === "skipped") {
    return {
      ok: true,
      status: "skipped",
      reason: json.reason || "skipped",
    };
  }
  return {
    ok: false,
    error: json.error || `아바타 동기화 실패 (${res.status})`,
  };
}

export { isStoredAvatarUrl };
