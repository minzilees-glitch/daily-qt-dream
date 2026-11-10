"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { LightIcon } from "@/components/ui/LightIcon";
import { Toast } from "@/components/ui/Toast";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { ReadingPassageBlock } from "@/components/qt/ReadingPassageBlock";
import { HomePremiumShell } from "@/components/qt/HomePremiumShell";
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
    <>
      <HomePremiumShell
        header={
          <AppHeader
            homeLayout
            light
            title="오늘은"
            dateLabel={formatDisplayDate(today)}
            userName={currentUser.name}
            groupName={group?.name ?? "순"}
            status={
              <div className="flex items-center gap-1.5">
                <p className="home-status-line type-section text-white">
                  {doneToday
                    ? "오늘의 큐티를 완료했어요"
                    : "오늘의 큐티를 아직 안했어요"}
                </p>
                <LightIcon
                  active={doneToday}
                  tone="onDark"
                  size={20}
                  justEarned={doneToday || lastEarnedDate === today}
                  label=""
                />
              </div>
            }
          />
        }
        passage={
          <ReadingPassageBlock
            reading={reading}
            label="오늘의 말씀"
            embedded
            collapsible={false}
            inkTitle
          />
        }
        sheet={
          <QtEntryForm
            key={`home-qt-${today}`}
            initial={todayEntry}
            onSave={async (fields) => {
              try {
                const res = await saveEntry(today, fields);
                showToast(res.message);
              } catch (err) {
                const detail =
                  err instanceof Error ? err.message : "알 수 없는 오류";
                showToast(`저장 실패: ${detail}`);
              }
            }}
          />
        }
      />
      <Toast message={toast} />
    </>
  );
}
