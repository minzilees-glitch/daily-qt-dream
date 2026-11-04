"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { QtEntryFields } from "@/types";
import {
  QT_MIN_TOTAL_CHARS,
  fieldsFromEntry,
  totalTrimmedLength,
} from "@/lib/qt-entry";
import type { QtEntry } from "@/types";

export function QtEntryForm({
  initial,
  onSave,
  onClear,
  disabled,
  showClear,
}: {
  initial?: QtEntry | null;
  onSave: (fields: QtEntryFields) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  disabled?: boolean;
  showClear?: boolean;
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
    <div className="space-y-7">
      <p className="text-[13px] leading-relaxed text-text-secondary">
        묵상 · 구절 · 결단과 순종 · 기도제목을{" "}
        <span className="font-bold text-text-main opacity-100">
          전체 합쳐 {QT_MIN_TOTAL_CHARS}자 이상
        </span>{" "}
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
        id="meditation"
        label="오늘 나의 묵상"
        placeholder="오늘 말씀을 통해 받은 은혜를 적어보세요."
        value={meditation}
        disabled={locked}
        rows={5}
        onChange={setMeditation}
      />
      <Field
        id="verse"
        label="오늘 나의 마음에 남는 구절"
        placeholder="기억에 남는 구절을 적어보세요."
        value={verse}
        disabled={locked}
        rows={3}
        onChange={setVerse}
      />
      <Field
        id="decisionObedience"
        label="오늘 나의 결단과 순종"
        placeholder="오늘 결단하고 순종할 것을 적어보세요."
        value={decisionObedience}
        disabled={locked}
        rows={3}
        onChange={setDecisionObedience}
      />
      <Field
        id="prayer"
        label="묵상 후 나의 기도제목"
        placeholder="오늘의 기도제목을 적어보세요."
        value={prayer}
        disabled={locked}
        rows={3}
        onChange={setPrayer}
      />

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
        {busy ? "저장 중…" : "저장하고 QT 완료하기"}
      </PrimaryButton>

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

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  rows,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows: number;
}) {
  const len = value.trim().length;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[17px] font-semibold text-text-main">
          {label}
        </label>
        <span className="text-[12px] tabular-nums text-text-secondary/70">
          {len}자
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-[12px] border-0 bg-ivory px-4 py-3.5 text-[18px] leading-relaxed text-text-main shadow-none placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-sky disabled:opacity-60"
      />
    </div>
  );
}
