"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { BrandMark } from "@/components/ui/BrandMark";
import { useApp } from "@/lib/app-context";

export default function LoginPage() {
  const { ready, currentUser, loginAsTestUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && currentUser) router.replace("/home");
  }, [ready, currentUser, router]);

  return (
    <PhoneShell>
      <div className="hero-gradient relative flex min-h-[100dvh] flex-col px-6 pb-10 pt-[calc(48px+var(--safe-top))]">
        <div className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center">
          <BrandMark size={80} rounded={28} className="mb-6" />
          <h1 className="text-[33px] font-bold tracking-tight text-text-main">
            드림 매일큐티
          </h1>
          <p className="mt-3 max-w-[280px] text-[16px] leading-relaxed text-text-main">
            매일의 Quiet Time을 기록하고,
            <br />
            우리 순과 함께 성장해요.
          </p>
        </div>

        <div className="animate-fade-up space-y-4" style={{ animationDelay: "80ms" }}>
          <div className="rounded-[16px] bg-ivory/85 p-5 shadow-none backdrop-blur">
            <p className="mb-3 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-sky">
              Prototype · Test Login
            </p>
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => {
                loginAsTestUser();
                router.push("/home");
              }}
            >
              테스트로 시작하기
            </PrimaryButton>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-text-secondary">
              실제 카카오 로그인이 아닙니다.
              <br />
              Phase 1 프로토타입용 테스트 계정으로 입장합니다.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-[13px] text-text-secondary">
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
    </PhoneShell>
  );
}
