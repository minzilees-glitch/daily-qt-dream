"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SoftCard } from "@/components/ui/SoftCard";
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
      {/* Top-section-only wash — same pattern as 우리순; does not grow with scroll content. */}
      <section className="hero-gradient-spread px-[var(--space-page-x)] pb-[var(--space-hero-pb)]">
        <AppHeader
          light
          homeLayout
          title="오늘은"
          dateLabel={formatDisplayDate(today)}
          userName={currentUser.name}
          groupName={group?.name ?? "순"}
        />
      </section>

      <section className="animate-fade-up space-y-[var(--space-stack)] px-[var(--space-page-x)] pb-[var(--space-section-pb)] pt-1">
        <SoftCard className="space-y-[var(--space-stack)] overflow-hidden">
          {/* CTA blue title band — avoid .bg-cta pill radius; keep SoftCard top chrome */}
          <div
            className="-mx-[var(--space-card)] -mt-[var(--space-card)] bg-[var(--cta)] px-[var(--space-card)] pb-[var(--space-stack-sm)] pt-[var(--space-card)] text-white"
          >
            <h2 className="flex items-center gap-1.5 type-section text-white">
              <LightIcon
                active={doneToday}
                tone={doneToday ? "active" : "white"}
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
          </div>

          <ReadingPassageBlock
            reading={reading}
            label="본문"
            embedded
            defaultExpanded
          />
        </SoftCard>

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
      </section>

      <Toast message={toast} />
    </div>
  );
}
