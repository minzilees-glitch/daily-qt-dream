"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { QtEntryFormHandle } from "@/components/qt/QtEntryForm";

/**
 * On leave (nav/tab/back/route unmount, pagehide, beforeunload) flush the QT
 * draft and exit edit mode. On bfcache restore (pageshow persisted), exit edit
 * so return shows the saved view — not the input form.
 */
export function useQtLeaveSaveExit({
  active,
  formRef,
  onExit,
}: {
  /** True while the QT form is on screen (compose or edit). */
  active: boolean;
  formRef: RefObject<QtEntryFormHandle | null>;
  /** Clear edit mode so a saved entry presents as DayEntryView. */
  onExit: () => void;
}) {
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    if (!active) return;

    const leave = () => {
      void formRef.current?.flush();
      onExitRef.current();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) onExitRef.current();
    };

    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeunload", leave);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("pageshow", onPageShow);
      // SPA tab/route unmount — flush + exit before state is discarded.
      leave();
    };
  }, [active, formRef]);
}
