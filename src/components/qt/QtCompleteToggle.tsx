"use client";

import { Check } from "lucide-react";

export function QtCompleteToggle({
  completed,
  onToggle,
  disabled,
  label = "QT 했어요",
}: {
  completed: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={completed}
      disabled={disabled}
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-4 rounded-[22px] px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 disabled:opacity-50 ${
        completed
          ? "bg-sky text-white shadow-[0_12px_28px_rgba(120,189,236,0.35)]"
          : "bg-white text-text-main shadow-[var(--shadow-soft)]"
      }`}
    >
      <div>
        <p className="text-[16px] font-semibold">{label}</p>
        <p
          className={`mt-0.5 text-sm ${
            completed ? "text-white/80" : "text-text-secondary"
          }`}
        >
          {completed ? "완료됨 · 다시 누르면 취소" : "아직 미완료 · 눌러서 체크"}
        </p>
      </div>
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
          completed ? "bg-white text-sky" : "bg-sky-light text-sky"
        }`}
      >
        <Check size={22} strokeWidth={2.25} />
      </span>
    </button>
  );
}
