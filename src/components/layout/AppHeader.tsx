"use client";

import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";

export function AppHeader({
  title,
  subtitle,
  light = false,
  /** Home: 「오늘은」 + large date; avatar / name / 순 stacked top-right. */
  homeLayout = false,
  dateLabel,
  userName,
  groupName,
  showAvatar = true,
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
            className={`type-body-sm font-medium ${
              light ? "text-white/80" : "text-sky"
            }`}
          >
            {title}
          </p>
          <p
            className={`type-page-title mt-1.5 ${
              light ? "text-white" : "text-text-main"
            }`}
            suppressHydrationWarning
          >
            {dateLabel}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
          {showAvatar ? <ProfileAvatarButton light={light} /> : null}
          <div className="min-w-0 max-w-[7.5rem] text-center leading-none">
            <p
              className={`truncate type-label leading-none ${
                light ? "text-white" : "text-text-main"
              }`}
            >
              {userName}
            </p>
            <p
              className={`mt-0.5 truncate type-caption leading-none ${
                light ? "text-white/80" : "text-text-secondary"
              }`}
            >
              {groupName}
            </p>
          </div>
        </div>
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
