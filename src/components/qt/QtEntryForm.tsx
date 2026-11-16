"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { QtEntryFields } from "@/types";
import {
  QT_MIN_TOTAL_CHARS,
  fieldsFromEntry,
  totalTrimmedLength,
} from "@/lib/qt-entry";
import {
  formatQtShareText,
  isShareAbortError,
  shareOrCopyText,
} from "@/lib/qt-share";
import type { QtEntry } from "@/types";

const QT_LINE_FALLBACK_PX = 36;

export function QtEntryForm({
  initial,
  onSave,
  onClear,
  disabled,
  showClear,
  /** Home: 「나의 큐티 나누기」 shares date + range + non-empty fields. */
  share,
}: {
  initial?: QtEntry | null;
  onSave: (fields: QtEntryFields) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  disabled?: boolean;
  showClear?: boolean;
  share?: {
    dateYmd: string;
    passageRange: string;
    onShared?: (via: "share" | "clipboard") => void;
    onError?: (message: string) => void;
  };
}) {
  const seed = fieldsFromEntry(initial);
  const [meditation, setMeditation] = useState(seed.meditation);
  const [verse, setVerse] = useState(seed.verse);
  const [decisionObedience, setDecisionObedience] = useState(
    seed.decisionObedience,
  );
  const [prayer, setPrayer] = useState(seed.prayer);
  const [busy, setBusy] = useState(false);

  const fields = { meditation, verse, decisionObedience, prayer };
  const totalLen = totalTrimmedLength(fields);
  const locked = disabled || busy;

  return (
    <div className="space-y-[var(--space-stack-lg)]">
      <p className="qt-validation-hint type-caption pt-[var(--space-stack-lg)] text-text-secondary">
        QT는 전체 합쳐{" "}
        <strong className="type-caption-em">
          최소 {QT_MIN_TOTAL_CHARS}자 이상
        </strong>{" "}
        적어주세요.
        <span
          className={`ml-1.5 tabular-nums ${
            totalLen >= QT_MIN_TOTAL_CHARS
              ? "text-text-main"
              : "text-text-secondary/70"
          }`}
        >
          (지금 {totalLen}자)
        </span>
      </p>

      <Field
        id="verse"
        label="오늘 나의 마음에 남는 구절"
        placeholder="기억에 남는 구절을 적어보세요."
        value={verse}
        disabled={locked}
        minRows={3}
        onChange={setVerse}
      />
      <Field
        id="meditation"
        label="오늘 나의 묵상"
        placeholder="오늘 말씀을 통해 받은 은혜를 적어보세요."
        value={meditation}
        disabled={locked}
        minRows={3}
        onChange={setMeditation}
      />
      <Field
        id="decisionObedience"
        label="오늘 나의 결단과 순종"
        placeholder="오늘 결단하고 순종할 것을 적어보세요."
        value={decisionObedience}
        disabled={locked}
        minRows={3}
        onChange={setDecisionObedience}
      />
      <Field
        id="prayer"
        label="묵상 후 나의 기도제목"
        placeholder="오늘의 기도제목을 적어보세요."
        value={prayer}
        disabled={locked}
        minRows={3}
        onChange={setPrayer}
      />

      <div className="flex flex-col gap-2">
        {share ? (
          <PrimaryButton
            type="button"
            variant="soft"
            className="w-full"
            disabled={locked}
            onClick={async () => {
              const text = formatQtShareText({
                dateYmd: share.dateYmd,
                passageRange: share.passageRange,
                fields,
              });
              try {
                const via = await shareOrCopyText(text);
                share.onShared?.(via);
              } catch (err) {
                if (isShareAbortError(err)) return;
                share.onError?.("공유에 실패했어요");
              }
            }}
          >
            <Send size={18} strokeWidth={2.25} aria-hidden />
            나의 큐티 나누기
          </PrimaryButton>
        ) : null}

        <PrimaryButton
          type="button"
          className="w-full"
          disabled={locked}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(fields);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "저장 중…" : "저장하고 큐티 완료하기"}
        </PrimaryButton>
      </div>

      {showClear && onClear ? (
        <PrimaryButton
          type="button"
          variant="soft"
          className="w-full"
          disabled={locked}
          onClick={async () => {
            setBusy(true);
            try {
              await onClear();
            } finally {
              setBusy(false);
            }
          }}
        >
          기록 삭제 · 완료 취소
        </PrimaryButton>
      ) : null}
    </div>
  );
}

function readLinePx(el: HTMLTextAreaElement): number {
  const raw = getComputedStyle(el).getPropertyValue("--qt-line").trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : QT_LINE_FALLBACK_PX;
}

/** Grow one notebook line at a time; no inner scrollbar. */
function syncAutoGrowHeight(el: HTMLTextAreaElement, minRows: number) {
  const line = readLinePx(el);
  const minH = minRows * line;
  el.style.height = "0px";
  const needed = Math.max(minH, el.scrollHeight);
  el.style.height = `${Math.ceil(needed / line) * line}px`;
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  minRows,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  minRows: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    syncAutoGrowHeight(el, minRows);

    const onResize = () => syncAutoGrowHeight(el, minRows);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value, minRows]);

  return (
    <div>
      <label htmlFor={id} className="qt-field-title mb-3 block">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        placeholder={placeholder}
        className="qt-lined-field type-body w-full text-text-main placeholder:text-text-secondary/60 focus:outline-none focus:ring-0 disabled:opacity-60"
      />
    </div>
  );
}
