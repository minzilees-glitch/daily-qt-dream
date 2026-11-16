"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { LightIcon } from "@/components/ui/LightIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Toast } from "@/components/ui/Toast";
import { DayEntryView } from "@/components/qt/DayEntryView";
import { QtEntryForm } from "@/components/qt/QtEntryForm";
import { HomeDurannoPassage } from "@/components/qt/HomeDurannoPassage";
import { PassageEntryActions } from "@/components/qt/PassageEntryActions";
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
    isCompleted,
    getEntry,
    saveEntry,
    clearEntry,
    lastEarnedDate,
  } = useApp();
  const today = useSeoulToday();
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!currentUser) return null;

  const doneToday = isCompleted(currentUser.id, today);
  const todayEntry = getEntry(currentUser.id, today);
  const hasEntry = Boolean(todayEntry);
  const showActions = doneToday || editing || hasEntry;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const shareOpts = {
    dateYmd: today,
    passageRange: reading.range,
    onShared: (via: "share" | "clipboard") =>
      showToast(via === "share" ? "공유했어요" : "클립보드에 복사했어요"),
    onError: (message: string) => showToast(message),
  };

  const shareSavedEntry = async () => {
    const text = formatQtShareText({
      dateYmd: today,
      passageRange: reading.range,
      fields: fieldsFromEntry(todayEntry),
    });
    try {
      const via = await shareOrCopyText(text);
      shareOpts.onShared(via);
    } catch (err) {
      if (isShareAbortError(err)) return;
      shareOpts.onError("공유에 실패했어요");
    }
  };

  const formBody =
    editing || !doneToday ? (
      <QtEntryForm
        key={`home-qt-${today}-${editing ? todayEntry?.updatedAt ?? "edit" : "new"}`}
        initial={todayEntry}
        share={shareOpts}
        onSave={async (fields) => {
          try {
            const res = await saveEntry(today, fields);
            showToast(res.message);
            if (res.ok) setEditing(false);
          } catch (err) {
            const detail =
              err instanceof Error ? err.message : "알 수 없는 오류";
            showToast(`저장 실패: ${detail}`);
          }
        }}
      />
    ) : (
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
    );

  return (
    <>
      <HomePremiumShell
        header={
          <AppHeader
            homeLayout
            title="오늘은"
            dateLabel={formatDisplayDate(today)}
            nickname={currentUser.name}
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
          <>
            <HomeDurannoPassage
              reading={reading}
              label="오늘의 말씀"
              rangeTrailing={
                showActions ? (
                  <PassageEntryActions
                    onEdit={() => setEditing(true)}
                    onDelete={() => setConfirmOpen(true)}
                    deleteDisabled={!hasEntry && !doneToday}
                  />
                ) : null
              }
            />
            <div className="premium-home-qt">{formBody}</div>
          </>
        }
      />
      <ConfirmModal
        open={confirmOpen}
        title="이 날의 큐티 기록을 삭제할까요?"
        description="삭제하면 완료도 함께 취소됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          const res = await clearEntry(today);
          showToast(res.message);
          setConfirmOpen(false);
          setEditing(false);
        }}
      />
      <Toast message={toast} />
    </>
  );
}
