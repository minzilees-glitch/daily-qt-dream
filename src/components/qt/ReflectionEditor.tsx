"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function ReflectionEditor({
  initial,
  onSave,
  disabled,
}: {
  initial: string;
  onSave: (content: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);

  return (
    <div className="space-y-3">
      <label htmlFor="reflection" className="block text-sm font-medium text-text-secondary">
        오늘의 묵상
      </label>
      <textarea
        id="reflection"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        rows={7}
        placeholder="오늘 말씀을 통해 받은 은혜를 자유롭게 적어보세요. (선택)"
        className="w-full resize-none rounded-[22px] border-0 bg-white px-4 py-4 text-[15px] leading-relaxed text-text-main shadow-[var(--shadow-soft)] placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-sky disabled:opacity-60"
      />
      <PrimaryButton
        type="button"
        className="w-full"
        disabled={disabled}
        onClick={() => onSave(value)}
      >
        묵상 저장
      </PrimaryButton>
      <p className="text-center text-xs text-text-secondary">
        체크와 묵상은 서로 독립적입니다. 작성 없이도 완료할 수 있어요.
      </p>
    </div>
  );
}
