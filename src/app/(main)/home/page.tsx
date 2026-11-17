import { Suspense } from "react";
import { connection } from "next/server";
import { HomeClient } from "./HomeClient";
import {
  DURANNO_BIBLE_URL,
  fetchDurannoTodayMeta,
  type DurannoTodayMeta,
} from "@/lib/duranno";
import { todaySeoul } from "@/lib/dates";

function emptyReading(date: string): DurannoTodayMeta {
  return {
    date,
    range: "",
    title: "",
    url: DURANNO_BIBLE_URL,
  };
}

/** Stream Duranno behind Suspense so soft-nav to /home is not blocked. */
async function HomeWithDuranno() {
  await connection();
  const today = todaySeoul();
  let reading: DurannoTodayMeta;
  try {
    reading = await fetchDurannoTodayMeta(today);
  } catch {
    reading = emptyReading(today);
  }
  return <HomeClient reading={reading} />;
}

export default function HomePage() {
  const today = todaySeoul();
  return (
    <Suspense fallback={<HomeClient reading={emptyReading(today)} />}>
      <HomeWithDuranno />
    </Suspense>
  );
}
