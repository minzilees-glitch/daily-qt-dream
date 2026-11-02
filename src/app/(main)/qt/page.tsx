"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SoftCard } from "@/components/ui/SoftCard";
import { Toast } from "@/components/ui/Toast";
import { QtCompleteToggle } from "@/components/qt/QtCompleteToggle";
import { ReflectionEditor } from "@/components/qt/ReflectionEditor";
import { useApp } from "@/lib/app-context";
import { formatDisplayDate, todaySeoul } from "@/lib/dates";

export default function TodayQtPage() {
  const {
    currentUser,
    isCompleted,
    getReflection,
    toggleCompletion,
    saveReflection,
  } = useApp();
  const [toast, setToast] = useState<string | null>(null);
  const today = todaySeoul();

  if (!currentUser) return null;

  const completed = isCompleted(currentUser.id, today);
  const reflection = getReflection(currentUser.id, today);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="px-5 pt-[calc(16px+var(--safe-top))]">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/home"
          aria-label="홈으로"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]"
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">오늘의 QT</h1>
          <p className="text-sm text-text-secondary">{formatDisplayDate(today)}</p>
        </div>
      </div>

      <div className="animate-fade-up space-y-5">
        <QtCompleteToggle
          completed={completed}
          onToggle={() => {
            const res = toggleCompletion(today);
            showToast(res.message);
          }}
        />

        <SoftCard>
          <p className="mb-1 text-sm text-text-secondary">상태</p>
          <p className="text-[16px] font-semibold text-text-main">
            {completed ? "오늘 QT 완료" : "오늘 아직 미완료"}
          </p>
        </SoftCard>

        <ReflectionEditor
          key={`qt-${today}-${reflection?.updatedAt ?? "new"}`}
          initial={reflection?.content ?? ""}
          onSave={(content) => {
            const res = saveReflection(today, content);
            showToast(res.message);
          }}
        />
      </div>

      <Toast message={toast} />
    </div>
  );
}
