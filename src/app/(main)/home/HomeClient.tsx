"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { LightIcon } from "@/components/ui/LightIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Toast } from "@/components/ui/Toast";
import { DayEntryView } from "@/components/qt/DayEntryView";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { HomeDurannoPassage } from "@/components/qt/HomeDurannoPassage";
import { HomePremiumShell } from "@/components/qt/HomePremiumShell";
import { useApp } from "@/lib/app-context";
import type { DurannoTodayMeta } from "@/lib/duranno";
import { formatDisplayDate } from "@/lib/dates";
import { useSeoulToday } from "@/hooks/useSeoulToday";
import { fieldsFromEntry } from "@/lib/qt-entry";
import {
  formatQtShareText,
  isShareAbortError,
  shareOrCopyText,
} from "@/lib/qt-share";

export function HomeClient({
  reading,
}: {
  reading: DurannoTodayMeta;
}) {
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
  const todayEntry = getEntry(currentUser.id, today);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const shareSavedEntry = async () => {
    const text = formatQtShareText({
      dateYmd: today,
      passageRange: reading.range,
      fields: fieldsFromEntry(todayEntry),
    });
    try {
      const via = await shareOrCopyText(text);
      showToast(via === "share" ? "공유했어요" : "클립보드에 복사했어요");
    } catch (err) {
      if (isShareAbortError(err)) return;
      showToast("공유에 실패했어요");
    }
  };

  return (
    <>
      <HomePremiumShell
        header={
          <AppHeader
            homeLayout
            title="오늘은"
            dateLabel={formatDisplayDate(today)}
            userName={currentUser.name}
            groupName={group?.name ?? "순"}
            dateAccessory={
              <LightIcon
                active={doneToday}
                size={20}
                justEarned={doneToday || lastEarnedDate === today}
                label=""
              />
            }
            status={
              <p className="home-status-line type-body-sm font-normal text-text-main">
                {doneToday
                  ? "오늘의 큐티를 완료했어요"
                  : "오늘의 큐티를 아직 안했어요"}
              </p>
            }
          />
        }
        sheet={
          <div className="space-y-[var(--space-stack)]">
            <HomeDurannoPassage reading={reading} label="오늘의 말씀" />
            {doneToday ? (
              <div className="space-y-[var(--space-stack-lg)]">
                <DayEntryView entry={todayEntry} />
                <PrimaryButton
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={shareSavedEntry}
                >
                  <Send size={18} strokeWidth={2.25} aria-hidden />
                  나의 큐티 나누기
                </PrimaryButton>
              </div>
            ) : (
              <QtEntryForm
                key={`home-qt-${today}`}
                initial={todayEntry}
                share={{
                  dateYmd: today,
                  passageRange: reading.range,
                  onShared: (via) =>
                    showToast(
                      via === "share"
                        ? "공유했어요"
                        : "클립보드에 복사했어요",
                    ),
                  onError: (message) => showToast(message),
                }}
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
            )}
          </div>
        }
      />
      <Toast message={toast} />
    </>
  );
}
