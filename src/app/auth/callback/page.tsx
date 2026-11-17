"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BrandMark } from "@/components/ui/BrandMark";
import { exchangeCodeFromUrl } from "@/lib/supabase/auth";
import {
  ensureKakaoProfile,
  isCommunityVerified,
} from "@/lib/supabase/profile-repo";
import { useApp } from "@/lib/app-context";

/**
 * OAuth return URL after Kakao → Supabase.
 *
 * Local:  http://localhost:3000/auth/callback
 * Vercel: https://<project>.vercel.app/auth/callback
 *
 * Must be listed in Supabase Auth → URL Configuration → Redirect URLs.
 * Kakao Developers Redirect URI stays the Supabase callback:
 *   https://jycmnpdcawqpwzaseorh.supabase.co/auth/v1/callback
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { hydrateFromAuthUser } = useApp();
  const [message, setMessage] = useState("카카오 로그인 확인 중…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const exchanged = await exchangeCodeFromUrl();
      if (cancelled) return;
      if (!exchanged.ok) {
        setMessage(exchanged.error);
        window.setTimeout(() => router.replace("/login"), 2200);
        return;
      }

      const user = exchanged.data.user;
      const profileRes = await ensureKakaoProfile(user);
      if (cancelled) return;
      if (!profileRes.ok) {
        setMessage(`프로필 준비 실패: ${profileRes.error}`);
        window.setTimeout(() => router.replace("/login"), 2400);
        return;
      }

      await hydrateFromAuthUser(user, profileRes.data);
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
