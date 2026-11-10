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
/** Ignore padding when classifying — short-mode adds ~62px bottom pad that
 *  would otherwise inflate scrollHeight and flip long↔short forever. */
const MODE_HYSTERESIS_PX = 28;
const MEASURE_DEBOUNCE_MS = 80;

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

  const modeRef = useRef<Mode>(mode);
  const riseRef = useRef(rise);
  const peekHRef = useRef(peekH);
  const maxRiseRef = useRef(maxRise);
  const draggingRef = useRef(false);
  const settledRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const lastStableModeRef = useRef<Mode | null>(null);

  modeRef.current = mode;
  riseRef.current = rise;
  peekHRef.current = peekH;
  maxRiseRef.current = maxRise;

  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startRise: number;
  } | null>(null);

  const measureNow = useCallback(() => {
    if (draggingRef.current) return;

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
    const passageBudget = available - nextPeek + 20 - headerH;

    /* Content height only — strip vertical padding so short-mode gap padding
     * cannot push scrollHeight over the long threshold (feedback loop). */
    const cs = getComputedStyle(passageEl);
    const padY =
      (Number.parseFloat(cs.paddingTop) || 0) +
      (Number.parseFloat(cs.paddingBottom) || 0);
    const contentH = Math.max(0, passageEl.scrollHeight - padY);

    const nextMaxRise = Math.max(
      80,
      Math.round(available - nextPeek - headerH - 24),
    );

    if (nextPeek !== peekHRef.current) setPeekH(nextPeek);
    if (nextMaxRise !== maxRiseRef.current) setMaxRise(nextMaxRise);

    /* After two consistent reads, freeze mode until viewport resize.
     * Still refresh peek/maxRise above so drag limits stay sane. */
    if (settledRef.current && lastStableModeRef.current) {
      const clamped = Math.min(riseRef.current, nextMaxRise);
      if (clamped !== riseRef.current) setRise(clamped);
      return;
    }

    const prev = modeRef.current;
    let nextMode: Mode;
    if (prev === "long") {
      /* Hysteresis: harder to leave long than to enter it. */
      nextMode =
        contentH < passageBudget - MODE_HYSTERESIS_PX ? "short" : "long";
    } else {
      nextMode =
        contentH > passageBudget + MODE_HYSTERESIS_PX ? "long" : "short";
    }

    if (nextMode !== prev) {
      setMode(nextMode);
      setRise(0);
    } else {
      const clamped = Math.min(riseRef.current, nextMaxRise);
      if (clamped !== riseRef.current) setRise(clamped);
    }

    if (lastStableModeRef.current === nextMode) {
      settledRef.current = true;
    } else {
      lastStableModeRef.current = nextMode;
      settledRef.current = false;
    }
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      measureNow();
    }, MEASURE_DEBOUNCE_MS);
  }, [measureNow]);

  useLayoutEffect(() => {
    measureNow();
  }, [measureNow]);

  useEffect(() => {
    const passageEl = passageRef.current;
    if (!passageEl) return;
    const ro = new ResizeObserver(() => {
      if (draggingRef.current) return;
      scheduleMeasure();
    });
    ro.observe(passageEl);
    const onResize = () => {
      settledRef.current = false;
      lastStableModeRef.current = null;
      scheduleMeasure();
    };
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [scheduleMeasure]);

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (modeRef.current !== "long") return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    handleRef.current?.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startRise: riseRef.current,
    };
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dy = drag.startY - e.clientY; /* drag up → rise */
    const next = Math.min(
      maxRiseRef.current,
      Math.max(0, drag.startRise + dy),
    );
    setRise(next);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    draggingRef.current = false;
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
