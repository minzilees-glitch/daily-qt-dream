"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { BrandMark } from "@/components/ui/BrandMark";

const PUBLIC_PATHS = new Set(["/login", "/auth/callback", "/verify"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, currentUser, communityStatus } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      if (!PUBLIC_PATHS.has(pathname)) router.replace("/login");
      return;
    }
    if (communityStatus !== "verified") {
      if (pathname !== "/verify") router.replace("/verify");
      return;
    }
    if (pathname === "/login" || pathname === "/verify") {
      router.replace("/home");
    }
  }, [ready, currentUser, communityStatus, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandMark size={56} rounded={18} className="animate-soft-pulse" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandMark size={56} rounded={18} className="animate-soft-pulse" />
      </div>
    );
  }

  if (communityStatus !== "verified") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandMark size={56} rounded={18} className="animate-soft-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
