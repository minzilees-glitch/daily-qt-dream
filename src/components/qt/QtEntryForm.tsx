"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { QtEntryFields } from "@/types";
import {
  QT_MIN_TOTAL_CHARS,
  fieldsFromEntry,
  totalTrimmedLength,
} from "@/lib/qt-entry";
import { getTextareaCaretMetrics } from "@/lib/textarea-caret";
import type { QtEntry } from "@/types";

/** Matches .qt-lined-field --qt-line ≈ 17×1.9 when CSS var is unavailable. */
const QT_LINE_FALLBACK_PX = 36;

export function QtEntryForm({
  initial,
  onSave,
  onDelete,
  disabled,
  /** Editing a saved entry: secondary 삭제 + primary 「수정사항 저장」. */
  editing = false,
  /** Optional notice above 「큐티는 전체 합쳐…」 helper (e.g. past-empty history). */
  helperNotice,
}: {
  initial?: QtEntry | null;
  onSave: (fields: QtEntryFields) => void | Promise<void>;
  /** Opens delete confirm (edit mode only). */
  onDelete?: () => void;
  disabled?: boolean;
  editing?: boolean;
  helperNotice?: ReactNode;
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
    <div>
      {/* Helper → first field: slightly tighter than field stack (--space-stack). */}
      <div className="pt-[var(--space-stack-lg)] pb-[var(--space-stack)]">
        {helperNotice ? (
          <div className="qt-validation-hint type-caption mb-[var(--space-stack-sm)] break-keep text-text-secondary">
            {helperNotice}
          </div>
        ) : null}
        <p className="qt-validation-hint type-caption text-text-secondary">
          큐티는 전체{" "}
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
            (현재 {totalLen}자)
          </span>
        </p>
      </div>

      <div className="space-y-[var(--space-stack-lg)]">
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

      <div className="flex flex-col gap-[var(--space-stack-sm)]">
        <PrimaryButton
          type="button"
          variant="primary"
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
          {busy
            ? "저장 중…"
            : editing
              ? "수정사항 저장"
              : "저장하고 큐티 완료"}
        </PrimaryButton>

        {editing && onDelete ? (
          <PrimaryButton
            type="button"
            variant="secondary"
            className="w-full touch-manipulation !bg-[color-mix(in_srgb,var(--color-danger)_16%,white)] !text-danger hover:brightness-95 [&_svg]:!text-danger"
            disabled={locked}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Defer past the current synthetic click so ConfirmModal backdrop
              // does not receive the same tap (mobile WebViews).
              queueMicrotask(() => onDelete());
            }}
          >
            삭제
          </PrimaryButton>
        ) : null}
      </div>
      </div>
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

type CaretPaint = {
  x: number;
  y: number;
  height: number;
  /** Remount key so blink restarts after caret moves. */
  tick: number;
};

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
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState<CaretPaint | null>(null);

  const paintCaret = () => {
    const node = ref.current;
    if (!node || disabledRef.current || document.activeElement !== node) {
      setCaret(null);
      return;
    }
    const start = node.selectionStart ?? 0;
    const end = node.selectionEnd ?? 0;
    // Range selection: rely on native highlight; no insertion caret.
    if (start !== end) {
      setCaret(null);
      return;
    }
    const m = getTextareaCaretMetrics(node, start);
    // Center a font-sized caret inside the tall notebook line box.
    const height = m.fontSize;
    const y = m.top + Math.max(0, (m.lineHeight - height) / 2);
    setCaret((prev) => ({
      x: m.left,
      y,
      height,
      tick: prev && prev.x === m.left && prev.y === y ? prev.tick : Date.now(),
    }));
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    syncAutoGrowHeight(el, minRows);

    const onResize = () => syncAutoGrowHeight(el, minRows);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value, minRows]);

  useLayoutEffect(() => {
    if (!focused || disabled) {
      setCaret(null);
      return;
    }
    paintCaret();
    document.addEventListener("selectionchange", paintCaret);
    window.addEventListener("resize", paintCaret);
    return () => {
      document.removeEventListener("selectionchange", paintCaret);
      window.removeEventListener("resize", paintCaret);
    };
  }, [focused, disabled, value]);

  return (
    <div>
      <label htmlFor={id} className="qt-field-title mb-3 block">
        {label}
      </label>
      <div className="qt-lined-field-shell">
        <textarea
          ref={ref}
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyUp={paintCaret}
          onClick={paintCaret}
          onSelect={paintCaret}
          rows={minRows}
          placeholder={placeholder}
          className="qt-lined-field w-full text-text-main placeholder:text-text-secondary/60 focus:outline-none focus:ring-0 disabled:opacity-60"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {caret ? (
          <span
            key={caret.tick}
            aria-hidden
            className="qt-lined-caret"
            style={{
              height: caret.height,
              transform: `translate(${caret.x}px, ${caret.y}px)`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
