import { NextResponse } from "next/server";
import {
  isStoredAvatarUrl,
  uploadAndSaveAvatarWithClient,
} from "@/lib/supabase/avatar-repo";
import { getSupabaseWithAccessToken } from "@/lib/supabase/client";
import { isAllowedKakaoImageUrl } from "@/lib/supabase/kakao-avatar";

const MAX_BYTES = 2_000_000;

type Body = { imageUrl?: string | null };

/**
 * Download Kakao `profile_image` / OIDC `picture` and save to
 * Storage `avatars` + `profiles.avatar_url`.
 *
 * Auth: Bearer = Supabase user access_token (RLS as auth.uid()).
 * Skip when avatar_url already points at our avatars bucket (custom upload).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  const accessToken = match?.[1]?.trim() ?? "";
  if (!accessToken) {
    return NextResponse.json(
      { ok: false as const, error: "로그인이 필요해요." },
      { status: 401 },
    );
  }

  const sb = getSupabaseWithAccessToken(accessToken);
  if (!sb) {
    return NextResponse.json(
      { ok: false as const, error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await sb.auth.getUser(accessToken);
  if (userError || !user) {
    return NextResponse.json(
      { ok: false as const, error: "세션이 유효하지 않아요." },
      { status: 401 },
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const bodyImageUrl =
    typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";

  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select("id, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { ok: false as const, error: profileError.message },
      { status: 500 },
    );
  }
  if (!profile?.id) {
    return NextResponse.json(
      { ok: false as const, error: "프로필이 아직 없어요." },
      { status: 404 },
    );
  }

  // Custom (or prior Storage) upload — never overwrite.
  if (isStoredAvatarUrl(profile.avatar_url)) {
    return NextResponse.json({
      ok: true as const,
      status: "skipped" as const,
      reason: "custom_upload",
      avatarUrl: profile.avatar_url,
    });
  }

  // Prefer cookie/OIDC URL; else migrate an existing Kakao CDN row into Storage.
  const existing = profile.avatar_url?.trim() ?? "";
  const imageUrl =
    bodyImageUrl ||
    (existing && isAllowedKakaoImageUrl(existing) ? existing : "");

  if (!imageUrl) {
    return NextResponse.json({
      ok: true as const,
      status: "skipped" as const,
      reason: "no_kakao_image",
    });
  }

  if (!isAllowedKakaoImageUrl(imageUrl)) {
    return NextResponse.json(
      {
        ok: false as const,
        error: "허용되지 않은 프로필 이미지 URL이에요.",
      },
      { status: 400 },
    );
  }

  let bytes: ArrayBuffer;
  let contentType = "image/jpeg";
  try {
    const imgRes = await fetch(imageUrl, {
      cache: "no-store",
      headers: { Accept: "image/*,*/*;q=0.8" },
      redirect: "follow",
    });
    if (!imgRes.ok) {
      return NextResponse.json(
        {
          ok: false as const,
          error: `카카오 이미지를 받지 못했어요 (${imgRes.status}).`,
        },
        { status: 502 },
      );
    }
    const len = Number(imgRes.headers.get("content-length") || "0");
    if (len > MAX_BYTES) {
      return NextResponse.json(
        { ok: false as const, error: "프로필 이미지가 너무 커요." },
        { status: 413 },
      );
    }
    const headerType = imgRes.headers.get("content-type")?.split(";")[0]?.trim();
    if (headerType?.startsWith("image/")) contentType = headerType;
    bytes = await imgRes.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { ok: false as const, error: "프로필 이미지가 너무 커요." },
        { status: 413 },
      );
    }
    if (bytes.byteLength < 32) {
      return NextResponse.json(
        { ok: false as const, error: "프로필 이미지가 비어 있어요." },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false as const, error: "카카오 이미지 다운로드에 실패했어요." },
      { status: 502 },
    );
  }

  const blob = new Blob([bytes], { type: contentType });
  const uploaded = await uploadAndSaveAvatarWithClient(sb, user.id, blob);
  if (!uploaded.ok) {
    return NextResponse.json(
      { ok: false as const, error: uploaded.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true as const,
    status: "uploaded" as const,
    avatarUrl: uploaded.data,
  });
}
