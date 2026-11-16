import { connection } from "next/server";
import { HomeClient } from "./HomeClient";
import {
  DURANNO_BIBLE_URL,
  fetchDurannoTodayMeta,
  type DurannoTodayMeta,
} from "@/lib/duranno";
import { todaySeoul } from "@/lib/dates";

/** Request-time Duranno fetch — not eligible for instant-nav prerender. */
export const instant = false;

export default async function HomePage() {
  // Request-time: Seoul "today" + live Duranno meta (Cache Components).
  await connection();
  const today = todaySeoul();
  let reading: DurannoTodayMeta;
  try {
    reading = await fetchDurannoTodayMeta(today);
  } catch {
    reading = {
      date: today,
      range: "",
      title: "",
      url: DURANNO_BIBLE_URL,
    };
  }

  return <HomeClient reading={reading} />;
}
