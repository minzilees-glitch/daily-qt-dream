"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

const NAV_CHROME_PX = 72;
const PEEK_RATIO = 0.3;
/** Extra form room so the sheet isn't only the peek strip. */
const PEEK_EXTRA_PX = 160;

type Mode = "short" | "long";

/**
 * Home shell: short passages sit flush under the text; long passages keep a
 * bottom peek with an in-frame scroll + upward-draggable sheet.
 */
export function HomePremiumShell({
  header,
  passage,
  sheet,
}: {
  header: ReactNode;
  passage: ReactNode;
  sheet: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("short");
  const [rise, setRise] = useState(0);
  const [peekH, setPeekH] = useState(280);
  const [maxRise, setMaxRise] = useState(240);

  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startRise: number;
  } | null>(null);

  const measure = useCallback(() => {
    const passageEl = passageRef.current;
    const topEl = topRef.current;
    if (!passageEl || !topEl) return;

    const vh = window.innerHeight;
    const safeBottom =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--safe-bottom",
        ),
      ) || 0;
    const available = Math.max(320, vh - NAV_CHROME_PX - safeBottom);
    const nextPeek = Math.round(available * PEEK_RATIO + PEEK_EXTRA_PX);
    const headerBand = topEl.querySelector(
      ".premium-home-header-band",
    ) as HTMLElement | null;
    const headerH = headerBand?.offsetHeight ?? 120;
    /* Space the passage may occupy before we treat content as “long”. */
    const passageBudget = available - nextPeek + 20 - headerH;
    const contentH = passageEl.scrollHeight;
    const nextMode: Mode = contentH > passageBudget + 8 ? "long" : "short";
    const nextMaxRise = Math.max(
      80,
      Math.round(available - nextPeek - headerH - 24),
    );

    setPeekH(nextPeek);
    setMaxRise(nextMaxRise);
    setMode((prev) => {
      if (prev !== nextMode) setRise(0);
      return nextMode;
    });
    setRise((r) => Math.min(r, nextMaxRise));
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const passageEl = passageRef.current;
    if (!passageEl) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(passageEl);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== "long") return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    handleRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startRise: rise,
    };
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dy = drag.startY - e.clientY; /* drag up → rise */
    const next = Math.min(maxRise, Math.max(0, drag.startRise + dy));
    setRise(next);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      handleRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const sheetHeight =
    mode === "long" ? Math.round(peekH + rise) : undefined;

  return (
    <div
      ref={rootRef}
      className={`premium-qt-root premium-home-root premium-home-shell premium-home-shell--${mode}`}
    >
      <div ref={topRef} className="premium-home-top">
        <div className="premium-home-header-band">{header}</div>
        <div ref={passageRef} className="premium-home-passage">
          {passage}
        </div>
      </div>

      <section
        ref={sheetRef}
        className="premium-qt-sheet premium-home-form-sheet"
        style={
          sheetHeight != null
            ? { height: sheetHeight, minHeight: sheetHeight }
            : undefined
        }
      >
        {mode === "long" ? (
          <div
            ref={handleRef}
            className="premium-home-sheet-drag"
            aria-hidden
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        ) : null}
        {sheet}
      </section>
    </div>
  );
}
