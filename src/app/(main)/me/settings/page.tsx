"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, LogOut, Shield } from "lucide-react";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Toast } from "@/components/ui/Toast";
import { useApp } from "@/lib/app-context";
import {
  formatQtShareText,
  type ShareTextLayout,
} from "@/lib/qt-share";

const SHARE_LAYOUT_SAMPLE_FIELDS = {
  verse: "하나님이 세상을 이처럼 사랑하사",
  meditation: "사랑은 행동으로 드러납니다.",
  decisionObedience: "",
  prayer: "",
};

const SHARE_LAYOUT_OPTIONS: {
  id: ShareTextLayout;
  label: string;
  hint: string;
}[] = [
  {
    id: "titled",
    label: "제목 포함",
    hint: "날짜·본문 뒤에 각 항목 제목과 내용을 함께 넣어요.",
  },
  {
    id: "plain",
    label: "내용만",
    hint: "날짜·본문 뒤에 작성한 내용만 이어서 넣어요.",
  },
];

function shareLayoutExample(layout: ShareTextLayout): string {
  return formatQtShareText({
    dateYmd: "2026-11-18",
    passageRange: "요한복음 3:16-17",
    fields: SHARE_LAYOUT_SAMPLE_FIELDS,
    layout,
  });
}

export default function MeSettingsPage() {
  const {
    currentUser,
    groups,
    logout,
    setDisplayName,
    shareTextLayout,
    setShareTextLayout,
  } = useApp();
  const router = useRouter();
  const userName = currentUser?.name ?? "";
  const [nickname, setNickname] = useState(userName);
  const [syncedName, setSyncedName] = useState(userName);
  const [savingName, setSavingName] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync draft when profile name changes (render-time adjust — no effect setState).
  if (userName !== syncedName) {
    setSyncedName(userName);
    setNickname(userName);
  }

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const nameDirty = nickname.trim() !== currentUser.name.trim();

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const onSaveNickname = async () => {
    if (savingName || !nameDirty) return;
    setSavingName(true);
    const res = await setDisplayName(nickname);
    setSavingName(false);
    showToast(res.message);
  };

  const onPickLayout = async (layout: ShareTextLayout) => {
    if (savingLayout || layout === shareTextLayout) return;
    setSavingLayout(true);
    const res = await setShareTextLayout(layout);
    setSavingLayout(false);
    showToast(res.message);
  };

  return (
    <div className="premium-qt-root">
      <header className="premium-tab-header premium-tab-header--me">
        <div className="flex items-center gap-2">
          <Link
            href="/me"
            aria-label="마이페이지로"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--sky-mode-ink)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} />
          </Link>
          <h1 className="premium-tab-title mb-0">계정 설정</h1>
        </div>
      </header>

      <section className="premium-qt-sheet premium-qt-sheet--fill premium-qt-sheet--me">
        <div className="premium-panel animate-fade-up">
          <div className="flex flex-col items-center gap-3 py-2">
            <ProfileAvatarButton size={88} fallback="initial" />
            <div className="w-full max-w-xs text-center">
              <label className="qt-field-title mb-2 block text-left" htmlFor="nickname">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                maxLength={40}
                autoComplete="nickname"
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-mint)_35%,white)] px-3 py-3 text-center type-body font-semibold text-text-main outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sky)_55%,transparent)]"
              />
              <p className="mt-2 type-body-sm text-text-secondary">
                {group?.name ?? "-"}
                {currentUser.isLeader ? " · 순장" : ""}
                {currentUser.isAdmin ? " · 관리자" : ""}
              </p>
              <PrimaryButton
                type="button"
                className="mt-3 w-full"
                disabled={!nameDirty || savingName || !nickname.trim()}
                onClick={() => void onSaveNickname()}
              >
                {savingName ? "저장 중…" : "별명 변경"}
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="premium-panel animate-fade-up space-y-3">
          <div>
            <p className="qt-field-title mb-1">큐티 나누기 형식</p>
            <p className="type-body-sm text-text-secondary">
              복사·카톡 공유에 쓰는 텍스트 형식이에요.
            </p>
          </div>
          <div
            className="space-y-2"
            role="radiogroup"
            aria-label="큐티 나누기 형식"
          >
            {SHARE_LAYOUT_OPTIONS.map((opt) => {
              const selected = shareTextLayout === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={savingLayout}
                  onClick={() => void onPickLayout(opt.id)}
                  className={`w-full rounded-[var(--radius-sm)] px-3 py-3 text-left shadow-none transition ${
                    selected
                      ? "bg-[color-mix(in_srgb,var(--color-sky)_22%,white)] ring-2 ring-[color-mix(in_srgb,var(--color-sky)_55%,transparent)]"
                      : "bg-[color-mix(in_srgb,var(--color-mint)_28%,white)] opacity-90 hover:opacity-100"
                  }`}
                >
                  <span className="type-body font-semibold text-text-main">
                    {opt.label}
                  </span>
                  <span className="mt-1 block type-body-sm text-text-secondary">
                    {opt.hint}
                  </span>
                  <pre className="mt-2 whitespace-pre-wrap break-keep rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-black)_6%,white)] px-2.5 py-2 type-caption text-text-main">
                    {shareLayoutExample(opt.id)}
                  </pre>
                </button>
              );
            })}
          </div>
        </div>

        <div className="premium-panel animate-fade-up">
          <p className="type-body-sm text-text-secondary">
            프로필 사진을 눌러 변경할 수 있어요.
          </p>
        </div>

        {currentUser.isAdmin ? (
          <div className="premium-panel space-y-2 animate-fade-up">
            <Link href="/admin" className="premium-list-row">
              <span className="flex items-center gap-3 type-body font-medium text-text-main">
                <Shield
                  size={18}
                  className="text-[var(--color-ink-blue)]"
                  strokeWidth={1.75}
                />
                관리자
              </span>
              <ChevronRight size={18} className="text-text-secondary" />
            </Link>
          </div>
        ) : null}

        <div className="premium-panel me-sheet-foot">
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={() => {
              void (async () => {
                await logout();
                router.replace("/login");
              })();
            }}
          >
            <LogOut size={18} strokeWidth={1.75} />
            로그아웃
          </PrimaryButton>

          <p className="qt-validation-hint mt-[var(--space-stack-sm)] text-center type-caption text-text-secondary">
            카카오 로그인 세션은 Supabase Auth에 저장됩니다. 큐티 기록은
            Supabase DB에 저장되고, 환경변수가 없으면 로컬로 대체됩니다.
          </p>
        </div>
      </section>
      <Toast message={toast} />
    </div>
  );
}
