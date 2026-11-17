import type { User as AuthUser, Session } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Kakao consent scopes we want (nickname + profile only).
 * Never include account_email / email — phone/email scopes are unavailable
 * without Biz/검수 for this community app.
 *
 * Note: Supabase GoTrue’s built-in Kakao provider still *hardcodes*
 * `account_email` server-side and appends client scopes (KOE205 if unset).
 * Prefer `/api/auth/kakao/start` (OIDC → signInWithIdToken) which controls
 * the authorize `scope` ourselves. Keep “Allow users without an email” ON.
 */
export const KAKAO_PROFILE_SCOPES = "profile_nickname,profile_image" as const;
/** Space-separated for Kakao authorize URL (OIDC path). */
export const KAKAO_OIDC_SCOPE = "openid profile_nickname profile_image" as const;

/** App origin for OAuth redirectTo (localhost or Vercel). */
export function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

/**
 * Start Kakao login.
 * 1) Preferred: app-owned OIDC (`/api/auth/kakao/start`) — no account_email.
 * 2) Fallback: Supabase `signInWithOAuth` (may KOE205 until GoTrue omits email
 *    or Minzi enables 카카오계정(이메일) as optional on a Biz app).
 */
export async function signInWithKakao(): Promise<AuthResult<void>> {
  // Public REST key present → use OIDC path (secret is server-only on the API).
  const restKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY?.trim();
  if (restKey && typeof window !== "undefined") {
    window.location.assign("/api/auth/kakao/start");
    return { ok: true, data: undefined };
  }

  const sb = getSupabaseBrowser();
  if (!sb) {
    return {
      ok: false,
      error:
        "Supabase가 설정되지 않았어요. NEXT_PUBLIC_SUPABASE_URL / ANON_KEY를 확인하세요.",
    };
  }

  const redirectTo = `${getAppOrigin()}/auth/callback`;
  const { error } = await sb.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo,
      // Nickname + profile only — never account_email / email / phone.
      // Supabase may still append account_email server-side (see KAKAO_PROFILE_SCOPES note).
      scopes: KAKAO_PROFILE_SCOPES,
      skipBrowserRedirect: false,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

/** Finish Kakao OIDC path: exchange id_token for a Supabase session. */
export async function signInWithKakaoIdToken(
  idToken: string,
): Promise<AuthResult<Session>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };
  const token = idToken.trim();
  if (!token) return { ok: false, error: "카카오 ID 토큰이 없어요." };

  const { data, error } = await sb.auth.signInWithIdToken({
    provider: "kakao",
    token,
  });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: false, error: "세션을 만들지 못했어요." };
  return { ok: true, data: data.session };
}

export async function signOutAuth(): Promise<AuthResult<void>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: true, data: undefined };
  const { error } = await sb.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function getAuthSession(): Promise<Session | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data, error } = await sb.auth.getSession();
  if (error) return null;
  return data.session ?? null;
}

/** Finish PKCE on `/auth/callback` when `?code=` is present (Supabase OAuth). */
export async function exchangeCodeFromUrl(
  url: string = typeof window !== "undefined" ? window.location.href : "",
): Promise<AuthResult<Session>> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const parsed = new URL(url, getAppOrigin());
  const code = parsed.searchParams.get("code");
  if (!code) {
    // Hash tokens (implicit) or already-detected session.
    const session = await getAuthSession();
    if (session) return { ok: true, data: session };
    const err =
      parsed.searchParams.get("error_description") ||
      parsed.searchParams.get("error") ||
      "로그인 코드가 없어요. 다시 시도해 주세요.";
    return { ok: false, error: err };
  }

  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    // detectSessionInUrl may have already consumed the code on client init.
    const existing = await getAuthSession();
    if (existing) return { ok: true, data: existing };
    return { ok: false, error: error.message };
  }
  if (!data.session) return { ok: false, error: "세션을 만들지 못했어요." };
  return { ok: true, data: data.session };
}

export type KakaoProfileMeta = {
  nickname: string | null;
  avatarUrl: string | null;
};

/** Pull nickname / avatar from Kakao identity metadata when present. */
export function extractKakaoMeta(user: AuthUser): KakaoProfileMeta {
  const meta = user.user_metadata ?? {};
  const identity = user.identities?.find((i) => i.provider === "kakao");
  const idData = (identity?.identity_data ?? {}) as Record<string, unknown>;

  const pickString = (...candidates: unknown[]): string | null => {
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
    return null;
  };

  const nickname = pickString(
    meta.preferred_username,
    meta.full_name,
    meta.name,
    meta.nickname,
    idData.preferred_username,
    idData.full_name,
    idData.name,
    idData.nickname,
  );

  const avatarUrl = pickString(
    meta.avatar_url,
    meta.picture,
    idData.avatar_url,
    idData.picture,
  );

  return { nickname, avatarUrl };
}

export { isSupabaseConfigured };
