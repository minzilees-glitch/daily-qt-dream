import { Suspense } from "react";
import { connection } from "next/server";
import { HomeClient } from "./HomeClient";
import {
  DURANNO_BIBLE_URL,
  fetchDurannoTodayMeta,
  type DurannoTodayMeta,
} from "@/lib/duranno";
import { todaySeoul } from "@/lib/dates";

/** Request-time Seoul "today" — not eligible for static prerender. */
export const instant = false;

function emptyReading(date: string): DurannoTodayMeta {
  return {
    date,
    range: "",
    title: "",
    url: DURANNO_BIBLE_URL,
  };
}

/** Stream Duranno behind Suspense so soft-nav is not blocked by the scrape. */
async function HomeWithDuranno({ today }: { today: string }) {
  let reading: DurannoTodayMeta;
  try {
    reading = await fetchDurannoTodayMeta(today);
  } catch {
    reading = emptyReading(today);
  }
  return <HomeClient reading={reading} />;
}

export default async function HomePage() {
  // Must run before todaySeoul() — Cache Components forbids bare `new Date()` at prerender.
  await connection();
  const today = todaySeoul();
  return (
    <Suspense fallback={<HomeClient reading={emptyReading(today)} />}>
      <HomeWithDuranno today={today} />
    </Suspense>
  );
}
