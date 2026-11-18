"use client";

import { useEffect } from "react";
import { Send } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getAppOrigin } from "@/lib/supabase/auth";
import {
  isKakaoShareConfigured,
  preloadKakaoShareSdk,
  shareTextViaKakao,
} from "@/lib/kakao-sdk";
import {
  isShareAbortError,
  shareOrCopyText,
} from "@/lib/qt-share";

type Props = {
  getShareText: () => string;
  onShared: (via: "share" | "clipboard" | "kakao") => void;
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

  const onSystemShare = async () => {
    const text = getShareText();
    try {
      const via = await shareOrCopyText(text);
      onShared(via);
    } catch (err) {
      if (isShareAbortError(err)) return;
      onError("공유에 실패했어요");
    }
  };

  return (
    <div className="flex flex-row items-stretch gap-2">
      <PrimaryButton
        type="button"
        variant="secondary"
        className="min-w-0 flex-1 px-3"
        onClick={() => void onKakao()}
        aria-label="카톡으로 나누기"
      >
        <KakaoTalkGlyph />
        카톡으로 나누기
      </PrimaryButton>
      <PrimaryButton
        type="button"
        variant="secondary"
        className="min-w-0 flex-1 px-3"
        onClick={() => void onSystemShare()}
        aria-label="텍스트로 나누기"
      >
        <Send size={18} strokeWidth={2.25} aria-hidden />
        텍스트로 나누기
      </PrimaryButton>
    </div>
  );
}