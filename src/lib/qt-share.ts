import type { QtEntryFields } from "@/types";

/** Share clipboard field order — matches home QT form. */
export const QT_SHARE_FIELD_ORDER: {
  key: keyof QtEntryFields;
  title: string;
}[] = [
  { key: "verse", title: "오늘 나의 마음에 남는 구절" },
  { key: "meditation", title: "오늘 나의 묵상" },
  { key: "decisionObedience", title: "오늘 나의 결단과 순종" },
  { key: "prayer", title: "묵상 후 나의 기도제목" },
];

/**
 * Build share clipboard text (Asia/Seoul civil date as YYYY/MM/DD).
 * Empty fields are omitted entirely (title + body).
 */
export function formatQtShareText({
  dateYmd,
  passageRange,
  fields,
}: {
  dateYmd: string;
  passageRange: string;
  fields: QtEntryFields;
}): string {
  const dateSlash = dateYmd.trim().replace(/-/g, "/");
  const range = passageRange.trim();
  const header = range ? `${dateSlash} ${range}` : dateSlash;

  const blocks = QT_SHARE_FIELD_ORDER.flatMap(({ key, title }) => {
    const body = fields[key]?.trim() ?? "";
    if (!body) return [];
    return [`- ${title}\n${body}`];
  });

  if (blocks.length === 0) return header;
  return `${header}\n${blocks.join("\n\n")}`;
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) throw new Error("clipboard copy failed");
}

export function isShareAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: string }).name === "AbortError"
  );
}

/**
 * System share sheet (Web Share API): `navigator.share({ text })` when available.
 * Falls back to clipboard when Share API is missing or rejects (except user cancel).
 * KakaoTalk deep-link sharing lives in `@/lib/kakao-sdk` (separate CTA).
 */
export async function shareOrCopyText(
  text: string,
): Promise<"share" | "clipboard"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const data: ShareData = { text };
    const can =
      typeof navigator.canShare !== "function" || navigator.canShare(data);
    if (can) {
      try {
        await navigator.share(data);
        return "share";
      } catch (err) {
        if (isShareAbortError(err)) throw err;
        /* fall through to clipboard */
      }
    }
  }
  await copyTextToClipboard(text);
  return "clipboard";
}
