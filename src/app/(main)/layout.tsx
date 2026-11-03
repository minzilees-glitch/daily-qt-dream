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
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${
              hideNav ? "pb-8" : "pb-3"
            }`}
          >
            {children}
          </div>
          {!hideNav ? <BottomNav /> : null}
        </div>
      </AuthGate>
    </PhoneShell>
  );
}
