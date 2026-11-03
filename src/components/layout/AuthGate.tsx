"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { BrandMark } from "@/components/ui/BrandMark";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, currentUser } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser && pathname !== "/login") {
      router.replace("/login");
    }
  }, [ready, currentUser, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandMark size={56} rounded={18} className="animate-soft-pulse" />
      </div>
    );
  }

  if (!currentUser && pathname !== "/login") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandMark size={56} rounded={18} className="animate-soft-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
