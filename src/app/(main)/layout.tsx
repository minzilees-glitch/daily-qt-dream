"use client";

import { AuthGate } from "@/components/layout/AuthGate";
import { BottomNav } from "@/components/layout/BottomNav";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/admin";

  return (
    <PhoneShell data-nav={hideNav ? "hidden" : "docked"}>
      <AuthGate>
        <div className="phone-scroll">
          <div
            className={
              hideNav
                ? "pb-[var(--space-section-pb)]"
                : "pb-[calc(var(--nav-reserve)+var(--safe-bottom))]"
            }
          >
            {children}
          </div>
        </div>
        {!hideNav ? <BottomNav /> : null}
      </AuthGate>
    </PhoneShell>
  );
}
