"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BrandMark } from "@/components/ui/BrandMark";
import {
  exchangeCodeFromUrl,
  signInWithKakaoIdToken,
} from "@/lib/supabase/auth";
import {
  ensureKakaoProfile,
  isCommunityVerified,
} from "@/lib/supabase/profile-repo";
import { useApp } from "@/lib/app-context";

/**
 * OAuth return after Kakao.
 *
 * Paths:
 * A) App OIDC: `/api/auth/kakao/callback` → here with `?kakao_oidc=1`
 *    (id_token in httpOnly cookie; no account_email)
 * B) Supabase provider: `?code=` PKCE → exchangeCodeForSession
 *
 * Local app callback:  http://localhost:3000/auth/callback
 * Kakao REST Redirect (OIDC): http://localhost:3000/api/auth/kakao/callback
 * Supabase/Kakao provider still uses:
 *   https://jycmnpdcawqpwzaseorh.supabase.co/auth/v1/callback
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { hydrateFromAuthUser } = useApp();
  const [message, setMessage] = useState("카카오 로그인 확인 중…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const isOidc = params.get("kakao_oidc") === "1";

      let sessionUser;
      if (isOidc) {
        const tokenRes = await fetch("/api/auth/kakao/id-token", {
          method: "POST",
          credentials: "same-origin",
        });
        const tokenJson = (await tokenRes.json()) as {
          ok: boolean;
          id_token?: string;
        };
        if (cancelled) return;
        if (!tokenJson.ok || !tokenJson.id_token) {
          setMessage("카카오 ID 토큰을 읽지 못했어요. 다시 로그인해 주세요.");
          window.setTimeout(() => router.replace("/login"), 2200);
          return;
        }
        const signed = await signInWithKakaoIdToken(tokenJson.id_token);
        if (cancelled) return;
        if (!signed.ok) {
          setMessage(signed.error);
          window.setTimeout(() => router.replace("/login"), 2400);
          return;
        }
        sessionUser = signed.data.user;
      } else {
        const exchanged = await exchangeCodeFromUrl();
        if (cancelled) return;
        if (!exchanged.ok) {
          setMessage(exchanged.error);
          window.setTimeout(() => router.replace("/login"), 2200);
          return;
        }
        sessionUser = exchanged.data.user;
      }

      const profileRes = await ensureKakaoProfile(sessionUser);
      if (cancelled) return;
      if (!profileRes.ok) {
        setMessage(`프로필 준비 실패: ${profileRes.error}`);
        window.setTimeout(() => router.replace("/login"), 2400);
        return;
      }

      await hydrateFromAuthUser(sessionUser, profileRes.data);
      if (cancelled) return;

      if (isCommunityVerified(profileRes.data)) {
        setMessage("환영합니다. 오늘의 큐티로 이동해요.");
        router.replace("/home");
      } else {
        setMessage("공동체 확인이 필요해요.");
        router.replace("/verify");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromAuthUser, router]);

  return (
    <PhoneShell>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
        <BrandMark size={64} className="mb-5 animate-soft-pulse" />
        <p className="type-body font-semibold text-text-main">{message}</p>
      </div>
    </PhoneShell>
  );
}
