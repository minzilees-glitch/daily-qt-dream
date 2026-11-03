"use client";

import { AuthGate } from "@/components/layout/AuthGate";
import { BottomNav } from "@/components/layout/BottomNav";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/admin";

  return (
    <PhoneShell>
      <AuthGate>
        <div className={hideNav ? "pb-8" : "pb-[calc(96px+var(--safe-bottom))]"}>
          {children}
        </div>
        {!hideNav ? <BottomNav /> : null}
      </AuthGate>
    </PhoneShell>
  );
}
