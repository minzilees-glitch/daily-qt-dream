import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Kakao → us (OIDC). Exchange code for id_token, stash in httpOnly cookie,
 * then hand off to `/auth/callback?kakao_oidc=1` (no account_email).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  const fail = (message: string) => {
    const login = new URL("/login", origin);
    login.searchParams.set("kakao_error", message.slice(0, 180));
    return NextResponse.redirect(login);
  };

  if (oauthError) return fail(oauthError);
  if (!code) return fail("인가 코드가 없어요.");

  const jar = await cookies();
  const expected = jar.get("kakao_oauth_state")?.value;
  if (!expected || !state || expected !== state) {
    return fail("로그인 상태 값이 맞지 않아요. 다시 시도해 주세요.");
  }

  const clientId =
    process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY?.trim() ||
    process.env.KAKAO_REST_API_KEY?.trim();
  const secret = process.env.KAKAO_CLIENT_SECRET?.trim();
  if (!clientId || !secret) {
    return fail("missing_kakao_env");
  }

  const redirectUri = `${origin}/api/auth/kakao/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: secret,
    redirect_uri: redirectUri,
    code,
  });

  let tokenJson: {
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  try {
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body,
      cache: "no-store",
    });
    tokenJson = (await tokenRes.json()) as typeof tokenJson;
    if (!tokenRes.ok) {
      return fail(
        tokenJson.error_description ||
          tokenJson.error ||
          "카카오 토큰 교환에 실패했어요.",
      );
    }
  } catch {
    return fail("카카오 토큰 요청 중 네트워크 오류가 났어요.");
  }

  const idToken = tokenJson.id_token?.trim();
  if (!idToken) {
    return fail(
      "id_token이 없어요. Kakao Login → OpenID Connect를 ON으로 켜 주세요.",
    );
  }

  const next = new URL("/auth/callback", origin);
  next.searchParams.set("kakao_oidc", "1");

  const res = NextResponse.redirect(next);
  res.cookies.set("kakao_oauth_state", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("kakao_id_token", idToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 120,
  });
  return res;
}
