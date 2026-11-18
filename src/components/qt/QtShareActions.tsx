"use client";

import { useEffect } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getAppOrigin } from "@/lib/supabase/auth";
import {
  isKakaoShareConfigured,
  preloadKakaoShareSdk,
  shareTextViaKakao,
} from "@/lib/kakao-sdk";

type Props = {
  getShareText: () => string;
  onShared: (via: "kakao") => void;
  onError: (message: string) => void;
};

function KakaoTalkGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <path
        fill="currentColor"
        d="M12 3c5.523 0 10 3.582 10 8.004 0 4.268-3.856 7.834-9.036 8.196-.276.024-.69.07-.964.116-.327.07-.382-.139-.233-.327l.395-.511c.288-.372 1.03-1.335 1.39-1.776.048-.062.09-.163.09-.256 0-.325-.264-.589-.589-.589H8.588C5.464 15.257 3 13.01 3 10.004 3 6.582 7.477 3 12 3z"
      />
    </svg>
  );
}

/** KakaoTalk share CTA only — clipboard copy lives beside 수정 in the 말씀 header. */
export function QtShareActions({ getShareText, onShared, onError }: Props) {
  useEffect(() => {
    if (isKakaoShareConfigured()) preloadKakaoShareSdk();
  }, []);

  const onKakao = async () => {
    const text = getShareText();
    const result = await shareTextViaKakao(text, getAppOrigin());
    if (result.ok) {
      onShared("kakao");
      return;
    }
    onError(result.message);
  };

  return (
    <div className="flex flex-row items-stretch">
      <PrimaryButton
        type="button"
        variant="secondary"
        className="min-w-0 w-full px-3"
        onClick={() => void onKakao()}
        aria-label="카톡으로 바로 나누기"
      >
        <KakaoTalkGlyph />
        카톡으로 바로 나누기
      </PrimaryButton>
    </div>
  );
}
