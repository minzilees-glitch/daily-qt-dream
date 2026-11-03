"use client";

import { useSyncExternalStore } from "react";
import { todaySeoul } from "@/lib/dates";

/**
 * Seoul "today" via useSyncExternalStore so SSR and the client's first paint
 * share getServerSnapshot, then client can refresh on interval/visibility.
 */
function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 60_000);
  const onVis = () => onStoreChange();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function useSeoulToday(): string {
  return useSyncExternalStore(subscribe, todaySeoul, todaySeoul);
}
