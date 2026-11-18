"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, LogOut, Shield } from "lucide-react";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Toast } from "@/components/ui/Toast";
import { useApp } from "@/lib/app-context";
import {
  formatQtShareText,
  type ShareTextLayout,
} from "@/lib/qt-share";

/** Sample bodies long enough to truncate mid-content with 「…」. */
const SHARE_LAYOUT_SAMPLE_FIELDS = {
  verse: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다",
  meditation:
    "사랑은 말로만이 아니라 행동으로 드러납니다. 오늘 한 사람에게 먼저 손을 내밀고 싶습니다.",
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
  const full = formatQtShareText({
    dateYmd: "2026-11-18",
    passageRange: "요한복음 3:16-17",
    fields: SHARE_LAYOUT_SAMPLE_FIELDS,
    layout,
  });
  // Mid-content ellipsis — show preview is truncated, not the full share text.
  const max = 72;
  if (full.length <= max) return `${full}…`;
  return `${full.slice(0, max).trimEnd()}…`;
}

function ShareLayoutCheckbox({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-2 border-[var(--sky)] bg-transparent shadow-none ${
        selected ? "text-[var(--sky)]" : "text-transparent"
      }`}
    >
      {selected ? <Check size={14} strokeWidth={2.5} /> : null}
    </span>
  );
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
  const roleBits = [
    group?.name?.trim() || null,
    currentUser.isLeader ? "순장" : null,
    currentUser.isAdmin ? "관리자" : null,
  ].filter(Boolean);
  const roleLine = roleBits.length > 0 ? roleBits.join(" · ") : "—";

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
            <p className="m-0 max-w-xs text-center type-body-sm text-text-secondary">
              프로필 사진을 눌러 변경할 수 있어요.
            </p>
            <p className="m-0 max-w-xs text-center type-body-sm font-medium text-text-main">
              {roleLine}
            </p>
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
                className="w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-mint)_35%,white)] px-3 py-3 text-center type-body font-semibold text-text-main outline-none focus:ring-2 focus:ring-[var(--color-sky-deep)]"
              />
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
            <p className="type-body-sm font-normal text-text-secondary">
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
                  className={`w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--sky)_10%,white)] px-3 py-3 text-left shadow-none transition ${
                    selected
                      ? "ring-2 ring-[var(--sky)]"
                      : "ring-1 ring-transparent"
                  }`}
                >
                  <span className="flex items-start gap-2.5">
                    <ShareLayoutCheckbox selected={selected} />
                    <span className="min-w-0 flex-1">
                      <span className="block type-body !font-bold text-text-main">
                        {opt.label}
                      </span>
                      <span className="mt-1 block type-body-sm font-normal text-text-secondary">
                        {opt.hint}
                      </span>
                    </span>
                  </span>
                  <pre className="mt-2.5 whitespace-pre-wrap break-keep rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-mint)_55%,white)] px-4 py-2.5 type-caption font-normal text-text-main">
                    {shareLayoutExample(opt.id)}
                  </pre>
                </button>
              );
            })}
          </div>
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

          <div className="mt-[var(--space-stack-sm)] space-y-1 text-center type-caption text-text-secondary">
            <p className="m-0">Copyright to 14기 드림 더 베스트</p>
            <p className="m-0 break-keep">
              With every breath that I am able, I will sing of the goodness of
              God
            </p>
          </div>
        </div>
      </section>
      <Toast message={toast} />
    </div>
  );
}
