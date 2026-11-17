"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BrandMark } from "@/components/ui/BrandMark";
import { useApp } from "@/lib/app-context";
import { isSupabaseConfigured, signInWithKakao } from "@/lib/supabase/auth";

function kakaoErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "missing_kakao_env") {
    return "카카오 로그인 설정이 아직 없어요. NEXT_PUBLIC_KAKAO_REST_API_KEY와 KAKAO_CLIENT_SECRET을 확인하고 다시 시도해 주세요.";
  }
  return code;
}

export default function LoginPage() {
  const { ready, currentUser, communityStatus, supabaseEnabled } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = kakaoErrorMessage(
      new URLSearchParams(window.location.search).get("kakao_error"),
    );
    if (fromQuery) setError(fromQuery);
  }, []);

  useEffect(() => {
    if (!ready || !currentUser) return;
    if (communityStatus === "verified") {
      router.replace("/home");
    } else {
      router.replace("/verify");
    }
  }, [ready, currentUser, communityStatus, router]);

  const onKakao = async () => {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase 환경변수가 없어요. .env.local에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.",
      );
      return;
    }
    setBusy(true);
    const res = await signInWithKakao();
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
    }
    // On success the browser redirects to Kakao — keep busy state.
  };

  return (
    <PhoneShell scroll="page">
      <div className="phone-scroll">
        <div className="relative flex min-h-full flex-col bg-white px-6 pb-[calc(2.5rem+var(--safe-bottom))] pt-[calc(3rem+var(--safe-top))]">
          <div className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center">
            <BrandMark size={80} className="mb-6" />
            <h1 className="type-display-xl text-text-main">드림 매일큐티</h1>
            <p className="type-body-lg mt-3 max-w-[17.5rem] text-text-main">
              매일의 Quiet Time을 기록하고,
              <br />
              우리 순과 함께 성장해요.
            </p>
          </div>

          <div
            className="animate-fade-up space-y-[var(--space-stack-sm)]"
            style={{ animationDelay: "80ms" }}
          >
            <button
              type="button"
              disabled={busy || !supabaseEnabled}
              onClick={() => void onKakao()}
              className="cta-label type-body inline-flex w-full items-center justify-center gap-2 rounded-full !py-[18px] !font-bold text-[#191919] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
              style={{ backgroundColor: "#FEE500" }}
            >
              <KakaoSpeakIcon />
              {busy ? "카카오로 이동 중…" : "카카오로 시작하기"}
            </button>

            {!supabaseEnabled ? (
              <p className="qt-validation-hint text-center type-caption text-text-secondary">
                Supabase가 설정되지 않아 카카오 로그인을 쓸 수 없어요.
              </p>
            ) : (
              <p className="qt-validation-hint text-center type-caption text-text-secondary">
                로그인 후 다락방 · 순 · 본명으로 공동체 확인을 합니다.
                <br />
                닉네임·프로필만 요청해요 (이메일·전화 없음).
              </p>
            )}

            {error ? (
              <p className="text-center type-caption font-semibold text-red-600">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-center gap-4 type-caption text-text-secondary">
              <button type="button" className="underline-offset-2 hover:underline">
                이용약관
              </button>
              <span aria-hidden>·</span>
              <button type="button" className="underline-offset-2 hover:underline">
                개인정보처리방침
              </button>
            </div>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function KakaoSpeakIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#191919"
        d="M9 1.5C4.86 1.5 1.5 4.16 1.5 7.45c0 2.13 1.4 4 3.5 5.07l-.9 3.28c-.08.3.26.54.5.38l3.92-2.6c.48.06.97.09 1.48.09 4.14 0 7.5-2.66 7.5-5.95S13.14 1.5 9 1.5z"
      />
    </svg>
  );
}
