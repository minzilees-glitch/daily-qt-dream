"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { QtEntryFields } from "@/types";
import { QT_MIN_CHARS, fieldsFromEntry } from "@/lib/qt-entry";
import type { QtEntry } from "@/types";

export function QtEntryForm({
  initial,
  onSave,
  onClear,
  disabled,
  showClear,
}: {
  initial?: QtEntry | null;
  onSave: (fields: QtEntryFields) => void;
  onClear?: () => void;
  disabled?: boolean;
  showClear?: boolean;
}) {
  const seed = fieldsFromEntry(initial);
  const [meditation, setMeditation] = useState(seed.meditation);
  const [verse, setVerse] = useState(seed.verse);
  const [prayer, setPrayer] = useState(seed.prayer);

  const fields = { meditation, verse, prayer };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-text-secondary">
        묵상 · 마음에 남는 구절 · 기도제목 중{" "}
        <span className="font-semibold text-text-main">하나 이상</span>을
        작성하고, 그중 하나는 공백 제외{" "}
        <span className="font-semibold text-text-main">{QT_MIN_CHARS}자 이상</span>
        이어야 완료됩니다.
      </p>

      <Field
        id="meditation"
        label="오늘의 묵상"
        placeholder="오늘 말씀을 통해 받은 은혜를 적어보세요."
        value={meditation}
        disabled={disabled}
        rows={5}
        onChange={setMeditation}
      />
      <Field
        id="verse"
        label="오늘 마음에 남는 구절"
        placeholder="기억에 남는 구절을 적어보세요."
        value={verse}
        disabled={disabled}
        rows={3}
        onChange={setVerse}
      />
      <Field
        id="prayer"
        label="묵상 후 기도제목"
        placeholder="오늘의 기도제목을 적어보세요."
        value={prayer}
        disabled={disabled}
        rows={3}
        onChange={setPrayer}
      />

      <PrimaryButton
        type="button"
        className="w-full"
        disabled={disabled}
        onClick={() => onSave(fields)}
      >
        저장하고 QT 완료하기
      </PrimaryButton>

      {showClear && onClear ? (
        <PrimaryButton
          type="button"
          variant="soft"
          className="w-full"
          disabled={disabled}
          onClick={onClear}
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
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
        <span
          className={`text-[11px] tabular-nums ${
            len >= QT_MIN_CHARS ? "text-sky" : "text-text-secondary/70"
          }`}
        >
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
        className="w-full resize-none rounded-[22px] border-0 bg-white px-4 py-3.5 text-[15px] leading-relaxed text-text-main shadow-[var(--shadow-soft)] placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-sky disabled:opacity-60"
      />
    </div>
  );
}
