"use client";

import type { ReactNode } from "react";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";

export function AppHeader({
  title,
  subtitle,
  light = false,
  /** Home: 「오늘은」 + large date; avatar only top-right (no name/순 labels). */
  homeLayout = false,
  dateLabel,
  userName: _userName,
  groupName: _groupName,
  showAvatar = true,
  /** Home: status row rendered tight under the date (left column). */
  status,
}: {
  title?: string;
  subtitle?: string;
  light?: boolean;
  homeLayout?: boolean;
  dateLabel?: string;
  userName?: string;
  groupName?: string;
  /** When false, hide top-right profile avatar (e.g. history/group/ranking). */
  showAvatar?: boolean;
  status?: ReactNode;
}) {
  if (homeLayout) {
    return (
      <header
        className={`flex items-start justify-between gap-3 pt-[calc(var(--space-title-pt)+var(--safe-top))] ${
          light ? "text-white" : "text-text-main"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p
            className={`home-header-label font-medium ${
              light ? "text-white/80" : "text-sky"
            }`}
          >
            {title}
          </p>
          <p
            className={`type-page-title mt-1 ${
              light ? "text-white" : "text-text-main"
            }`}
            suppressHydrationWarning
          >
            {dateLabel}
          </p>
          {status ? <div className="mt-1">{status}</div> : null}
        </div>

        {showAvatar ? (
          <div className="flex shrink-0 items-start pt-0.5">
            <ProfileAvatarButton light={light} />
          </div>
        ) : null}
      </header>
    );
  }

  if (!showAvatar) {
    return (
      <div
        className="pt-[calc(var(--space-title-pt)+var(--safe-top))]"
        aria-hidden
      />
    );
  }

  return (
    <header
      className={`flex items-center justify-end pt-[calc(var(--space-title-pt)+var(--safe-top))] ${
        light ? "text-white" : "text-text-main"
      }`}
    >
      <ProfileAvatarButton light={light} />
    </header>
  );
}
