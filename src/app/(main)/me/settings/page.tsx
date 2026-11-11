"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";
import { useApp } from "@/lib/app-context";

export default function MeSettingsPage() {
  const { currentUser, groups } = useApp();

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);

  return (
    <div className="premium-qt-root">
      <header className="premium-tab-header premium-tab-header--me">
        <div className="flex items-center gap-2">
          <Link
            href="/me"
            aria-label="마이페이지로"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink-blue)]"
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
            <div className="text-center">
              <p className="type-stat text-text-main">{currentUser.name}</p>
              <p className="mt-1 type-body-sm text-text-secondary">
                {group?.name ?? "-"}
                {currentUser.isLeader ? " · 순장" : ""}
                {currentUser.isAdmin ? " · 관리자" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-panel animate-fade-up">
          <p className="type-body-sm text-text-secondary">
            프로필 사진을 눌러 변경할 수 있어요. 이름·순 변경은 준비 중입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
