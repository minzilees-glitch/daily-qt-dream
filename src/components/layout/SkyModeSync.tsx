"use client";

import { useEffect } from "react";
import {
  SKY_MODE_ATTR,
  msUntilSkyModeChange,
  skyModeSeoul,
} from "@/lib/sky-mode";

function applySkyMode() {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(SKY_MODE_ATTR, skyModeSeoul());
}

/**
 * Keeps `html[data-sky-mode]` = 낮모드 | 밤모드 (Asia/Seoul).
 * 밤모드 = 19:00–06:00 → CSS `--sky-mode-fill` = black; else sky.
 */
export function SkyModeSync() {
  useEffect(() => {
    applySkyMode();
    let boundaryTimer: ReturnType<typeof setTimeout> | undefined;

    const armBoundary = () => {
      if (boundaryTimer) clearTimeout(boundaryTimer);
      boundaryTimer = setTimeout(() => {
        applySkyMode();
        armBoundary();
      }, msUntilSkyModeChange());
    };
    armBoundary();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        applySkyMode();
        armBoundary();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (boundaryTimer) clearTimeout(boundaryTimer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
