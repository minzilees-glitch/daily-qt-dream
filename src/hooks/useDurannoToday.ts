"use client";

import { useEffect, useState } from "react";
import {
  DURANNO_BIBLE_URL,
  type DurannoTodayMeta,
} from "@/lib/duranno";

const cachePrefix = "daily-qt:duranno-meta:";

function emptyReading(date: string): DurannoTodayMeta {
  return {
    date,
    range: "",
    title: "",
    url: `${DURANNO_BIBLE_URL}?qtDate=${encodeURIComponent(date)}`,
  };
}

function readSessionCache(date: string): DurannoTodayMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(cachePrefix + date);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DurannoTodayMeta;
    if (!parsed?.date || parsed.date !== date) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(reading: DurannoTodayMeta) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      cachePrefix + reading.date,
      JSON.stringify(reading),
    );
  } catch {
    // Quota / private mode — ignore.
  }
}

/**
 * Load today's Duranno range/title without blocking `/home` navigation.
 * Seeds from sessionStorage when available, then refreshes from the API.
 */
export function useDurannoToday(date: string): DurannoTodayMeta {
  const [reading, setReading] = useState<DurannoTodayMeta>(() => {
    return readSessionCache(date) ?? emptyReading(date);
  });

  useEffect(() => {
    const cached = readSessionCache(date);
    if (cached?.range) {
      setReading(cached);
    } else {
      setReading(emptyReading(date));
    }

    let cancelled = false;
    const ctrl = new AbortController();

    void (async () => {
      try {
        const res = await fetch(
          `/api/duranno/today?date=${encodeURIComponent(date)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as DurannoTodayMeta;
        if (cancelled || !data?.date) return;
        setReading(data);
        if (data.range) writeSessionCache(data);
      } catch {
        // Aborted or network — keep placeholder / cache.
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [date]);

  return reading;
}
