import { NextResponse } from "next/server";
import { KAKAO_OIDC_SCOPE } from "@/lib/supabase/auth";

/**
 * App-owned Kakao authorize (OIDC).
 * scope = openid + profile only — never account_email (avoids KOE205).
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_KAKAO_REST_API_KEY (or KAKAO_REST_API_KEY)
 *   KAKAO_CLIENT_SECRET
 * Kakao Developers:
 *   - OpenID Connect ON
 *   - Redirect URI: {origin}/api/auth/kakao/callback
 *   - Consent: profile_nickname, profile_image (not email)
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const clientId =
    process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY?.trim() ||
    process.env.KAKAO_REST_API_KEY?.trim();
  const secret = process.env.KAKAO_CLIENT_SECRET?.trim();

  if (!clientId || !secret) {
    const login = new URL("/login", origin);
    login.searchParams.set("kakao_error", "missing_kakao_env");
    return NextResponse.redirect(login);
  }

  const redirectUri = `${origin}/api/auth/kakao/callback`;
  const state = crypto.randomUUID();

  const authorize = new URL("https://kauth.kakao.com/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", KAKAO_OIDC_SCOPE);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set("kakao_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  return res;
}
