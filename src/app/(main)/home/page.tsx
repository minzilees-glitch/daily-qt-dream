"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { LightIcon } from "@/components/ui/LightIcon";
import { Toast } from "@/components/ui/Toast";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { ReadingPassageBlock } from "@/components/qt/ReadingPassageBlock";
import { useApp } from "@/lib/app-context";
import { getReadingForDate } from "@/lib/mock-data";
import { formatDisplayDate } from "@/lib/dates";
import { useSeoulToday } from "@/hooks/useSeoulToday";

export default function HomePage() {
  const {
    currentUser,
    groups,
    isCompleted,
    getEntry,
    saveEntry,
    lastEarnedDate,
  } = useApp();
  const today = useSeoulToday();
  const [toast, setToast] = useState<string | null>(null);

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const doneToday = isCompleted(currentUser.id, today);
  const reading = getReadingForDate(today);
  const todayEntry = getEntry(currentUser.id, today);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div>
      <section className="bg-sky px-5 pb-6 pt-1">
        <AppHeader
          light
          homeLayout
          title="오늘은"
          dateLabel={formatDisplayDate(today)}
          userName={currentUser.name}
          groupName={group?.name ?? "순"}
        />
      </section>

      <section className="animate-fade-up space-y-5 bg-white px-5 pb-8 pt-6">
        <h2 className="flex items-center gap-1.5 text-[17px] font-semibold tracking-[0.04em] text-text-main">
          <LightIcon
            active={doneToday}
            tone={doneToday ? "active" : "inactive"}
            size={20}
            justEarned={doneToday || lastEarnedDate === today}
            label=""
          />
          <span>
            {doneToday
              ? "오늘의 말씀을 묵상했어요."
              : "오늘의 말씀이 기다리고 있어요."}
          </span>
        </h2>

        <ReadingPassageBlock
          reading={reading}
          label="본문"
          embedded
          defaultExpanded
        />

        <div
          className="h-2 bg-[#D8DEE6] shadow-none"
          role="separator"
          aria-hidden
        />

        <QtEntryForm
          key={`home-qt-${today}-${todayEntry?.updatedAt ?? "new"}`}
          initial={todayEntry}
          onSave={async (fields) => {
            const res = await saveEntry(today, fields);
            showToast(res.message);
          }}
        />
      </section>

      <Toast message={toast} />
    </div>
  );
}
