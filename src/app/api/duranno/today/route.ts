import { NextResponse } from "next/server";
import {
  DURANNO_BIBLE_URL,
  fetchDurannoTodayMeta,
} from "@/lib/duranno";
import { todaySeoul } from "@/lib/dates";

function emptyReading(date: string) {
  return {
    date,
    range: "",
    title: "",
    url: `${DURANNO_BIBLE_URL}?qtDate=${encodeURIComponent(date)}`,
  };
}

/**
 * Server-side Duranno scrape for the home client.
 * Keeps `/home` itself instant (no request-time RSC scrape on soft-nav).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim() || todaySeoul();

  try {
    const reading = await fetchDurannoTodayMeta(date);
    return NextResponse.json(reading, {
      headers: {
        // Edge/browser can reuse today's meta for a few minutes.
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch {
    return NextResponse.json(emptyReading(date), {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }
}
