/** Minimal Kakao JS SDK (v2) surface used for Share. */
type KakaoShare = {
  sendDefault(settings: {
    objectType: "text";
    text: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
    buttonTitle?: string;
  }): void;
};

type KakaoSdk = {
  isInitialized(): boolean;
  init(appKey: string): void;
  Share: KakaoShare;
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

const KAKAO_SDK_URL =
  "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

let sdkLoadPromise: Promise<KakaoSdk> | null = null;

/**
 * Browser Kakao Share uses the **JavaScript** key (카카오 로그인 → JavaScript 키),
 * not the REST API key used for OIDC (`NEXT_PUBLIC_KAKAO_REST_API_KEY`).
 */
export function getKakaoJavascriptKey(): string | null {
  const key =
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() ||
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();
  return key || null;
}

export function isKakaoShareConfigured(): boolean {
  return getKakaoJavascriptKey() !== null;
}

function loadScript(): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("kakao sdk: no document"));
  }
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-kakao-sdk="1"]`,
  );
  if (existing?.dataset.loaded === "1" && window.Kakao) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.dataset.kakaoSdk = "1";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "1";
      if (!window.Kakao) {
        reject(new Error("kakao sdk: Kakao global missing"));
        return;
      }
      resolve();
    };
    script.onerror = () => reject(new Error("kakao sdk: script load failed"));
    if (!existing) document.head.appendChild(script);
  });
}

async function ensureKakaoSdk(): Promise<KakaoSdk> {
  if (!sdkLoadPromise) {
    sdkLoadPromise = loadScript().then(() => {
      const Kakao = window.Kakao;
      if (!Kakao) throw new Error("kakao sdk: unavailable");
      return Kakao;
    });
  }
  return sdkLoadPromise;
}

async function ensureKakaoInitialized(): Promise<KakaoSdk> {
  const appKey = getKakaoJavascriptKey();
  if (!appKey) throw new Error("kakao_sdk_missing_key");

  const Kakao = await ensureKakaoSdk();
  if (!Kakao.isInitialized()) {
    Kakao.init(appKey);
  }
  if (!Kakao.isInitialized()) {
    throw new Error("kakao_sdk_init_failed");
  }
  return Kakao;
}

export type KakaoShareResult =
  | { ok: true }
  | { ok: false; code: "missing_key" | "load_failed" | "share_failed"; message: string };

/**
 * Opens KakaoTalk share picker with plain QT text (not the system share sheet).
 */
export async function shareTextViaKakao(
  text: string,
  linkOrigin: string,
): Promise<KakaoShareResult> {
  if (!getKakaoJavascriptKey()) {
    return {
      ok: false,
      code: "missing_key",
      message:
        "카카오톡 공유 설정이 아직 없어요. 잠시 후 다시 시도하거나 아래 공유하기를 이용해 주세요.",
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      code: "share_failed",
      message: "공유할 내용이 없어요.",
    };
  }

  const origin = linkOrigin.replace(/\/+$/, "") || "https://daily-qt-dream.vercel.app";

  try {
    const Kakao = await ensureKakaoInitialized();
    await new Promise<void>((resolve, reject) => {
      try {
        Kakao.Share.sendDefault({
          objectType: "text",
          text: trimmed,
          link: {
            mobileWebUrl: origin,
            webUrl: origin,
          },
          buttonTitle: "매일 QT Dream",
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";
    const loadFailed =
      detail.includes("script load") ||
      detail.includes("unavailable") ||
      detail === "kakao_sdk_init_failed";
    if (loadFailed) {
      sdkLoadPromise = null;
      return {
        ok: false,
        code: "load_failed",
        message:
          "카카오톡 공유를 불러오지 못했어요. 네트워크를 확인하거나 공유하기를 이용해 주세요.",
      };
    }
    return {
      ok: false,
      code: "share_failed",
      message:
        detail && !detail.includes("kakao_sdk")
          ? "카카오톡으로 보낼 수 없어요. 공유하기를 이용해 주세요."
          : "카카오톡 공유에 실패했어요. 공유하기를 이용해 주세요.",
    };
  }
}

/** Preload SDK after first paint so the Kakao CTA feels snappier on tap. */
export function preloadKakaoShareSdk(): void {
  if (!getKakaoJavascriptKey() || typeof window === "undefined") return;
  void ensureKakaoInitialized().catch(() => {
    /* user-facing errors happen on tap */
  });
}