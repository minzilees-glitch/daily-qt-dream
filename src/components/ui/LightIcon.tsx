"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Official 빛 asset — white spark masked to yellow (active) or muted gray. */

const SRC = "/icons/light-icon.png";
const INACTIVE_TIP = "완료하면 빛을 얻을 수 있어요";
const FUTURE_TIP = "때가 되어야 열립니다. 기다려주세요.";
const BURST_MS = 950;

type Tone = "active" | "inactive" | "onDark" | "white" | "blue" | "sky";

function toneColor(tone: Tone): string {
  switch (tone) {
    case "active":
      return "#F5C518";
    case "onDark":
      return "#FFE066";
    case "white":
      return "#FFFFFF";
    case "blue":
      return "#008CFF";
    case "sky":
      return "#5FBCFC";
    case "inactive":
    default:
      return "#C2CAD2";
  }
}

function isEarnedYellow(tone: Tone): boolean {
  return tone === "active" || tone === "onDark";
}

/**
 * One-shot sunburst for just-earned lights. Not used as a persistent badge.
 */
function RayBurst({ size, color }: { size: number; color: string }) {
  const pad = Math.max(2, Math.round(size * 0.18));
  const box = size + pad * 2;
  const cx = box / 2;
  const cy = box / 2;
  const inner = size * 0.48;
  const outer = size * 0.62;
  const stroke = Math.max(1.25, size * 0.07);
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg
      className="light-rays pointer-events-none absolute inset-0"
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden
    >
      {angles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * inner}
            y1={cy + Math.sin(rad) * inner}
            x2={cx + Math.cos(rad) * outer}
            y2={cy + Math.sin(rad) * outer}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function LightGlyph({
  tone,
  size,
  className = "",
}: {
  tone: Tone;
  size: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: toneColor(tone),
        WebkitMaskImage: `url(${SRC})`,
        maskImage: `url(${SRC})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      aria-hidden
    />
  );
}

export function LightIcon({
  active = true,
  tone,
  size = 18,
  className = "",
  label,
  tip,
  future = false,
  /**
   * Allow the one-shot earn burst. Default true.
   * Pass false to never show rays (e.g. 「이번달 내가 모은 빛」).
   */
  rays = true,
  /**
   * Force a one-shot burst (e.g. calendar cell that mounts already-active
   * after saveEntry). Ignored when rays={false}.
   */
  justEarned = false,
}: {
  active?: boolean;
  tone?: Tone;
  size?: number;
  className?: string;
  label?: string;
  tip?: string;
  future?: boolean;
  rays?: boolean;
  justEarned?: boolean;
}) {
  const resolved: Tone = future
    ? "inactive"
    : (tone ?? (active ? "active" : "inactive"));
  const isInactive = resolved === "inactive";
  const tipText = tip ?? (future ? FUTURE_TIP : INACTIVE_TIP);
  const tipId = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [burst, setBurst] = useState(false);
  const prevToneRef = useRef<Tone | null>(null);

  // inactive (or any non-yellow) → earned yellow: one-shot rays, then hide.
  useEffect(() => {
    if (!rays) {
      prevToneRef.current = resolved;
      setBurst(false);
      return;
    }
    const prev = prevToneRef.current;
    prevToneRef.current = resolved;
    if (prev === null) return; // initial mount — no burst for already-active icons
    const wasLit =
      isEarnedYellow(prev) || prev === "sky" || prev === "blue";
    const nowLit =
      isEarnedYellow(resolved) || resolved === "sky" || resolved === "blue";
    const becameEarned = !wasLit && nowLit;
    if (!becameEarned) return;
    setBurst(true);
    const t = window.setTimeout(() => setBurst(false), BURST_MS);
    return () => window.clearTimeout(t);
  }, [resolved, rays]);

  // Explicit earn signal (calendar / cross-route completion).
  useEffect(() => {
    if (!rays || !justEarned) return;
    setBurst(true);
    const t = window.setTimeout(() => setBurst(false), BURST_MS);
    return () => window.clearTimeout(t);
  }, [justEarned, rays]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const t = window.setTimeout(() => setOpen(false), 2800);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const aria =
    label ??
    (future ? "아직 열리지 않은 빛" : isInactive ? "빛 미수집" : "빛 수집됨");

  const showBurst = rays && burst && !isInactive;
  const pad = Math.max(2, Math.round(size * 0.18));
  const box = showBurst ? size + pad * 2 : size;

  if (!isInactive) {
    return (
      <span
        className={`inline-flex overflow-visible ${className}`}
        role="img"
        aria-label={aria}
        title={aria}
      >
        <span
          className={`relative inline-flex shrink-0 items-center justify-center overflow-visible${
            showBurst ? " light-earn-burst" : ""
          }`}
          style={{ width: box, height: box }}
        >
          {showBurst ? (
            <RayBurst size={size} color={toneColor(resolved)} />
          ) : null}
          <span
            className="relative z-[1] inline-flex"
            style={{ width: size, height: size }}
          >
            <LightGlyph tone={resolved} size={size} />
          </span>
        </span>
      </span>
    );
  }

  return (
    <span ref={wrapRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={`${aria}. ${tipText}`}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex rounded-full bg-transparent p-0.5 shadow-none"
      >
        <LightGlyph tone="inactive" size={size} />
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-[12px] bg-text-main px-3 py-2 text-center text-[12px] font-medium leading-snug text-white shadow-none"
        >
          {tipText}
        </span>
      ) : null}
    </span>
  );
}

/** Icon + count for rankings / stats rows. */
export function LightCount({
  lights,
  size = 16,
  tone = "active",
  className = "",
  textClassName = "text-[15px] font-semibold text-text-main",
  /** Metrics default off — no earn burst unless explicitly enabled. */
  rays = false,
}: {
  lights: number;
  size?: number;
  tone?: Tone;
  className?: string;
  textClassName?: string;
  rays?: boolean;
}) {
  const resolvedTone: Tone = lights > 0 ? tone : "inactive";
  return (
    <span className={`inline-flex items-center gap-1 overflow-visible ${className}`}>
      <LightIcon
        tone={resolvedTone}
        size={size}
        label={`빛 ${lights}`}
        rays={rays}
      />
      <span className={textClassName}>{lights}</span>
    </span>
  );
}
