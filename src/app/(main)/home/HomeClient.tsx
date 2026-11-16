"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Send } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { LightIcon } from "@/components/ui/LightIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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
    clearEntry,
    lastEarnedDate,
  } = useApp();
  const today = useSeoulToday();
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  if (!currentUser) return null;

  const group = groups.find((g) => g.id === currentUser.groupId);
  const doneToday = isCompleted(currentUser.id, today);
  const todayEntry = getEntry(currentUser.id, today);
  const hasEntry = Boolean(todayEntry);
  const showMenu = doneToday || editing || hasEntry;

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
          <>
            <HomeDurannoPassage
              reading={reading}
              label="오늘의 말씀"
              labelTrailing={
                showMenu ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      aria-label="더보기"
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex h-8 w-8 items-center justify-center bg-transparent text-text-main shadow-none"
                    >
                      <MoreHorizontal size={18} strokeWidth={1.75} />
                    </button>
                    {menuOpen ? (
                      <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-[var(--radius-md)] bg-white py-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                        <button
                          type="button"
                          className="block w-full px-4 py-2.5 text-left type-body-sm font-medium text-text-main hover:bg-sky-light"
                          onClick={() => {
                            setMenuOpen(false);
                            setEditing(true);
                          }}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="block w-full px-4 py-2.5 text-left type-body-sm font-medium text-danger hover:bg-sky-light disabled:opacity-40"
                          disabled={!hasEntry && !doneToday}
                          onClick={() => {
                            setMenuOpen(false);
                            setConfirmOpen(true);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null
              }
            />
            <div className="premium-home-qt">{formBody}</div>
          </>
        }
      />
      <ConfirmModal
        open={confirmOpen}
        title="이 날의 QT 기록을 삭제할까요?"
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
