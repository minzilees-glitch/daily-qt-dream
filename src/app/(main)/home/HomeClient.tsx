"use client";

import { useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { LightIcon } from "@/components/ui/LightIcon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Toast } from "@/components/ui/Toast";
import { DayEntryView } from "@/components/qt/DayEntryView";
import {
  QtEntryForm,
  type QtEntryFormHandle,
} from "@/components/qt/QtEntryForm";
import { HomeDurannoPassage } from "@/components/qt/HomeDurannoPassage";
import { PassageEntryActions } from "@/components/qt/PassageEntryActions";
import { HomePremiumShell } from "@/components/qt/HomePremiumShell";
import { useApp } from "@/lib/app-context";
import { formatDisplayDate } from "@/lib/dates";
import { durannoUrlForDate } from "@/lib/duranno";
import { getHistoryPassage } from "@/lib/history-passages";
import { useQtLeaveSaveExit } from "@/hooks/useQtLeaveSaveExit";
import { useSeoulToday } from "@/hooks/useSeoulToday";
import { entryHasQtContent, fieldsFromEntry } from "@/lib/qt-entry";
import { copyTextToClipboard, formatQtShareText } from "@/lib/qt-share";
import { QtShareActions } from "@/components/qt/QtShareActions";

export function HomeClient() {
  const {
    currentUser,
    isCompleted,
    getEntry,
    saveEntry,
    clearEntry,
    lastEarnedDate,
    shareTextLayout,
  } = useApp();
  const today = useSeoulToday();
  /** Same uploaded calendar as 「나의 큐티들」 — not Duranno scrape. */
  const historyPassage = getHistoryPassage(today);
  const reading = {
    range: historyPassage.range,
    url: durannoUrlForDate(today),
  };
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<QtEntryFormHandle>(null);
  const exitingEditRef = useRef(false);

  const todayEntry = currentUser ? getEntry(currentUser.id, today) : null;
  /** Completion flags without QT text (fetch miss / empty row) → compose, not empty copy. */
  const hasContent = entryHasQtContent(todayEntry);
  /** Read-only view only when there is real saved text; otherwise open the form. */
  const showCompose = editing || !hasContent;

  /** Nav/tab/back/route leave: flush draft and exit edit so return shows saved view. */
  useQtLeaveSaveExit({
    active: Boolean(currentUser) && showCompose,
    formRef,
    onExit: () => setEditing(false),
  });

  if (!currentUser) return null;

  /** Home light/status follow real QT text — not presence-only completion. */
  const doneToday = hasContent && isCompleted(currentUser.id, today);
  const showEdit = hasContent;
  const editActive = editing && showEdit;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  /** Persist draft then leave edit (back / pencil). Unmount also flushes as backup. */
  const exitEdit = async () => {
    if (exitingEditRef.current) return;
    exitingEditRef.current = true;
    try {
      await formRef.current?.flush();
      setEditing(false);
    } finally {
      exitingEditRef.current = false;
    }
  };

  const getShareText = () =>
    formatQtShareText({
      dateYmd: today,
      passageRange: reading.range,
      fields: fieldsFromEntry(todayEntry),
      layout: shareTextLayout,
    });

  const onShared = (via: "kakao") => {
    if (via === "kakao") showToast("카카오톡으로 보냈어요");
  };

  const onCopyShareText = async () => {
    try {
      await copyTextToClipboard(getShareText());
      showToast("클립보드에 복사했어요");
    } catch {
      showToast("복사에 실패했어요");
    }
  };

  const formBody = showCompose ? (
    <QtEntryForm
      ref={formRef}
      key={`home-qt-${today}-${editing ? todayEntry?.updatedAt ?? "edit" : "new"}`}
      initial={todayEntry}
      editing={editing && hasContent}
      onDelete={editing && hasContent ? () => setConfirmOpen(true) : undefined}
      onSave={async (fields, meta) => {
        const silent = meta?.reason === "autosave";
        try {
          const res = await saveEntry(today, fields);
          if (!silent) showToast(res.message);
          else if (!res.ok) showToast(res.message);
          if (res.ok && !silent) setEditing(false);
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
      <QtShareActions
        getShareText={getShareText}
        onShared={onShared}
        onError={(message) => showToast(message)}
      />
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
                size={22}
                justEarned={doneToday || lastEarnedDate === today}
                label=""
                /* Default (미완료) light: 50% opacity next to the home date. */
                className={doneToday ? undefined : "opacity-50"}
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
              onEditBack={
                editActive ? () => void exitEdit() : undefined
              }
              rangeTrailing={
                showEdit ? (
                  <PassageEntryActions
                    editActive={editActive}
                    onEdit={() => {
                      if (editActive) void exitEdit();
                      else setEditing(true);
                    }}
                    onCopy={() => void onCopyShareText()}
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
