"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BrandMark } from "@/components/ui/BrandMark";

export default function RootPage() {
  const { ready, currentUser, communityStatus } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    router.replace(communityStatus === "verified" ? "/home" : "/verify");
  }, [ready, currentUser, communityStatus, router]);

  return (
    <PhoneShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <BrandMark size={64} rounded={22} className="animate-soft-pulse" />
      </div>
    </PhoneShell>
  );
}
