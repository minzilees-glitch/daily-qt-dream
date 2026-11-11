"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";

const HOME_AVATAR_MIN = 52;
const HOME_AVATAR_MAX = 96;

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
  /** Home: sits on the date line right after the weekday (e.g. light icon). */
  dateAccessory,
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
  dateAccessory?: ReactNode;
}) {
  const copyRef = useRef<HTMLDivElement>(null);
  const [avatarSize, setAvatarSize] = useState(72);

  useLayoutEffect(() => {
    if (!homeLayout) return;
    const el = copyRef.current;
    if (!el) return;

    const sync = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      const matched = Math.min(
        HOME_AVATAR_MAX,
        Math.max(HOME_AVATAR_MIN, h),
      );
      /* Home avatar: 70% of copy-matched size. */
      const next = Math.max(1, Math.round(matched * 0.7));
      setAvatarSize((prev) => (prev === next ? prev : next));
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [homeLayout, dateLabel, dateAccessory, status, title]);

  if (homeLayout) {
    return (
      <header
        className={`flex items-start justify-between gap-3 pt-[calc(var(--space-title-pt)+var(--safe-top))] ${
          light ? "text-white" : "text-text-main"
        }`}
      >
        <div ref={copyRef} className="min-w-0 flex-1">
          <p
            className={`home-header-label font-medium ${
              light ? "text-white/80" : "text-sky"
            }`}
          >
            {title}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            <p
              className={`type-page-title min-w-0 ${
                light ? "text-white" : "text-text-main"
              }`}
              suppressHydrationWarning
            >
              {dateLabel}
            </p>
            {dateAccessory}
          </div>
          {status ? <div className="mt-1">{status}</div> : null}
        </div>

        {showAvatar ? (
          <div className="mt-1.5 flex shrink-0 items-start self-stretch">
            <ProfileAvatarButton light={light} size={avatarSize} />
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
