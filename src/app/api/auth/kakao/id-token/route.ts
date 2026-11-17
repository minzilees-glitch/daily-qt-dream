import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/** One-shot read of the httpOnly Kakao id_token cookie, then clear it. */
export async function POST() {
  const jar = await cookies();
  const token = jar.get("kakao_id_token")?.value?.trim() ?? "";
  const res = NextResponse.json(
    token ? { ok: true as const, id_token: token } : { ok: false as const },
  );
  res.cookies.set("kakao_id_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
