import { todaySeoul } from "@/lib/dates";

/** Living Life QT bible view — open this URL; do not embed full scripture. */
export const DURANNO_BIBLE_URL =
  "https://www.duranno.com/qt/view/bible.asp";

export type DurannoTodayMeta = {
  date: string;
  /** Verse range label, e.g. "아모스 7:10~17" */
  range: string;
  /** QT summary title from Duranno `<h1><em>…</em>` */
  title: string;
  /** Canonical Duranno URL for the CTA */
  url: string;
};

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRange(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch today's QT meta from Duranno: verse range + title only.
 * Never returns or stores the full scripture body.
 */
export async function fetchDurannoTodayMeta(
  date: string = todaySeoul(),
): Promise<DurannoTodayMeta> {
  const requestUrl = `${DURANNO_BIBLE_URL}?qtDate=${encodeURIComponent(date)}`;
  const res = await fetch(requestUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; DailyQtDream/1.0; +local-dev)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Duranno fetch failed (${res.status})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  let html: string;
  try {
    html = new TextDecoder("euc-kr").decode(buf);
  } catch {
    html = buf.toString("utf8");
  }

  const match = html.match(
    /<h1>\s*<span>([\s\S]*?)<\/span>\s*<em>([\s\S]*?)<\/em>\s*<\/h1>/i,
  );
  if (!match) {
    throw new Error("Duranno page: range/title not found");
  }

  const range = normalizeRange(match[1] ?? "");
  const title = decodeHtmlEntities(match[2] ?? "");
  if (!range) {
    throw new Error("Duranno page: empty range");
  }

  return {
    date,
    range,
    title,
    url: DURANNO_BIBLE_URL,
  };
}
