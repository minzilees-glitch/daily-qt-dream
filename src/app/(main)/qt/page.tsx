"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SoftCard } from "@/components/ui/SoftCard";
import { Toast } from "@/components/ui/Toast";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { ReadingRangeCard } from "@/components/qt/ReadingRangeCard";
import { useApp } from "@/lib/app-context";
import { getReadingForDate } from "@/lib/mock-data";
import { formatDisplayDate, todaySeoul } from "@/lib/dates";

export default function TodayQtPage() {
  const { currentUser, isCompleted, getEntry, saveEntry, clearEntry } = useApp();
  const [toast, setToast] = useState<string | null>(null);
  const today = todaySeoul();

  if (!currentUser) return null;

  const completed = isCompleted(currentUser.id, today);
  const entry = getEntry(currentUser.id, today);
  const reading = getReadingForDate(today);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="px-5 pt-[calc(16px+var(--safe-top))]">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/home"
          aria-label="홈으로"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory shadow-[var(--shadow-soft)]"
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">오늘의 QT</h1>
          <p className="text-sm text-text-secondary">{formatDisplayDate(today)}</p>
        </div>
      </div>

      <div className="animate-fade-up space-y-5">
        <ReadingRangeCard reading={reading} />

        <SoftCard>
          <p className="mb-1 text-sm text-text-secondary">상태</p>
          <p className="text-[16px] font-semibold text-text-main">
            {completed ? "오늘 QT 완료" : "아직 미완료 · 기록 저장 시 완료"}
          </p>
        </SoftCard>

        <QtEntryForm
          key={`qt-${today}-${entry?.updatedAt ?? "new"}`}
          initial={entry}
          showClear={completed || !!entry}
          onSave={(fields) => showToast(saveEntry(today, fields).message)}
          onClear={() => showToast(clearEntry(today).message)}
        />
      </div>

      <Toast message={toast} />
    </div>
  );
}
