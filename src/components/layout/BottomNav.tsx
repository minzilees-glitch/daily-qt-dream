"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Trophy, UserRound, type LucideIcon } from "lucide-react";
import { LightIcon } from "@/components/ui/LightIcon";

type SideTab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Left of center home: 나의 QT, 우리 순 */
const LEFT_TABS: SideTab[] = [
  { href: "/history", label: "나의 QT", icon: BookOpen },
  { href: "/group", label: "우리 순", icon: Heart },
];

/** Right of center home: 랭킹, 마이페이지 */
const RIGHT_TABS: SideTab[] = [
  { href: "/ranking", label: "랭킹", icon: Trophy },
  { href: "/me", label: "마이페이지", icon: UserRound },
];

const HOME = { href: "/home", label: "오늘의 QT" } as const;

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/home" && pathname.startsWith(href));
}

function SideLink({
  href,
  label,
  icon: Icon,
  active,
}: SideTab & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10"
      aria-current={active ? "page" : undefined}
    >
      <Icon
        size={22}
        strokeWidth={active ? 2.4 : 1.75}
        className={active ? "text-white" : "text-white/75"}
        aria-hidden
      />
      {active ? (
        <span
          aria-hidden
          className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-white"
        />
      ) : null}
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const homeActive = isActive(pathname, HOME.href);

  return (
    <nav
      aria-label="하단 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(10px+var(--safe-bottom))]"
    >
      <div className="pointer-events-auto relative w-full max-w-[var(--phone-max)]">
        {/* Raised-center dock: glass bar + CTA home circle in the hump */}
        <div className="nav-dock relative mx-auto h-[4.5rem] w-full">
          <div className="nav-glass nav-dock-shape absolute inset-0" aria-hidden />

          <div className="relative z-[1] flex h-full items-end px-2 pb-2.5">
            <div className="flex flex-1 items-center justify-evenly">
              {LEFT_TABS.map((tab) => (
                <SideLink
                  key={tab.href}
                  {...tab}
                  active={isActive(pathname, tab.href)}
                />
              ))}
            </div>

            {/* Spacer for raised home circle */}
            <div className="w-[4.5rem] shrink-0" aria-hidden />

            <div className="flex flex-1 items-center justify-evenly">
              {RIGHT_TABS.map((tab) => (
                <SideLink
                  key={tab.href}
                  {...tab}
                  active={isActive(pathname, tab.href)}
                />
              ))}
            </div>
          </div>

          <Link
            href={HOME.href}
            aria-label={HOME.label}
            title={HOME.label}
            aria-current={homeActive ? "page" : undefined}
            className={`nav-dock-home absolute left-1/2 top-0 z-[2] flex h-[3.5rem] w-[3.5rem] -translate-x-1/2 -translate-y-[18%] items-center justify-center rounded-full bg-cta text-white shadow-[0_8px_20px_rgba(0,60,130,0.35)] transition ${
              homeActive ? "ring-2 ring-white/70" : "hover:brightness-110"
            }`}
          >
            <LightIcon
              tone="white"
              size={26}
              rays={false}
              label=""
              className="pointer-events-none"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}
