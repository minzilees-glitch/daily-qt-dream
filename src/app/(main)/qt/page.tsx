"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { ReadingRangeCard } from "@/components/qt/ReadingRangeCard";
import { useApp } from "@/lib/app-context";
import { getReadingForDate } from "@/lib/mock-data";
import { formatDisplayDate, todaySeoul } from "@/lib/dates";

export default function TodayQtPage() {
  const { currentUser, getEntry, saveEntry } = useApp();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const today = todaySeoul();

  if (!currentUser) return null;

  const entry = getEntry(currentUser.id, today);
  const reading = getReadingForDate(today);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="px-5 pt-[calc(20px+var(--safe-top))]">
      <div className="mb-5 flex items-center gap-2.5">
        <Link
          href="/home"
          aria-label="홈으로"
          className="inline-flex items-center justify-center bg-transparent p-0 shadow-none"
        >
          <ArrowLeft size={22} strokeWidth={1.75} className="text-text-main" />
        </Link>
        <p className="text-[16px] font-bold text-text-main opacity-50" suppressHydrationWarning>
          {formatDisplayDate(today)}
        </p>
      </div>

      <div className="animate-fade-up space-y-5">
        <ReadingRangeCard reading={reading} defaultExpanded />

        <QtEntryForm
          key={`qt-${today}-${entry?.updatedAt ?? "new"}`}
          initial={entry}
          onSave={async (fields) => {
            const res = await saveEntry(today, fields);
            showToast(res.message);
            if (res.ok) {
              window.setTimeout(() => {
                router.push("/home#calendar");
              }, 650);
            }
          }}
        />
      </div>

      <Toast message={toast} />
    </div>
  );
}
