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
/** Absolute floor for long-mode sheet height (grabber + a sliver of content). */
const MIN_SHEET_PX = 88;
/** Sheet margin-top overlap into passage (1.25rem). */
const SHEET_OVERLAP_PX = 20;
/** Air kept under 본문 제목 (range + summary) when sheet is fully raised. */
const TITLE_GAP_PX = 28;
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
  /** Negative floor so sheet can drag below default peek. */
  const [minRise, setMinRise] = useState(0);

  const modeRef = useRef<Mode>(mode);
  const riseRef = useRef(rise);
  const peekHRef = useRef(peekH);
  const maxRiseRef = useRef(maxRise);
  const minRiseRef = useRef(minRise);
  const draggingRef = useRef(false);
  const settledRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const lastStableModeRef = useRef<Mode | null>(null);

  modeRef.current = mode;
  riseRef.current = rise;
  peekHRef.current = peekH;
  maxRiseRef.current = maxRise;
  minRiseRef.current = minRise;

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

    /* Cap rise so sheet top sits just under 「범위 + 요약」(오늘의 말씀 stays visible). */
    const rangeEl = passageEl.querySelector(
      ".reading-passage-range",
    ) as HTMLElement | null;
    const titleRow = (rangeEl?.closest("p") ??
      rangeEl?.parentElement) as HTMLElement | null;
    let reservedTop = headerH + 72; /* fallback: header + label/title block */
    if (titleRow) {
      const topRect = topEl.getBoundingClientRect();
      const titleRect = titleRow.getBoundingClientRect();
      reservedTop = Math.round(
        titleRect.bottom - topRect.top + TITLE_GAP_PX,
      );
    }
    const nextMaxRise = Math.max(
      0,
      Math.round(available - nextPeek - reservedTop + SHEET_OVERLAP_PX),
    );
    /* Allow dragging below default peek down to MIN_SHEET_PX. */
    const nextMinRise = Math.min(0, MIN_SHEET_PX - nextPeek);

    if (nextPeek !== peekHRef.current) setPeekH(nextPeek);
    if (nextMaxRise !== maxRiseRef.current) setMaxRise(nextMaxRise);
    if (nextMinRise !== minRiseRef.current) setMinRise(nextMinRise);

    const clampRise = (r: number) =>
      Math.min(nextMaxRise, Math.max(nextMinRise, r));

    /* After two consistent reads, freeze mode until viewport resize.
     * Still refresh peek/maxRise above so drag limits stay sane. */
    if (settledRef.current && lastStableModeRef.current) {
      const clamped = clampRise(riseRef.current);
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
      const clamped = clampRise(riseRef.current);
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
    const dy = drag.startY - e.clientY; /* drag up → rise; down → negative */
    const next = Math.min(
      maxRiseRef.current,
      Math.max(minRiseRef.current, drag.startRise + dy),
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
            aria-label="시트 높이 조절"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="premium-sheet-grabber" aria-hidden />
          </div>
        ) : (
          <div className="premium-sheet-grabber-row" aria-hidden>
            <span className="premium-sheet-grabber" />
          </div>
        )}
        {sheet}
      </section>
    </div>
  );
}
