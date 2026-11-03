import type { QtEntry, QtEntryFields } from "@/types";

export const QT_MIN_CHARS = 20;

export function trimFields(fields: QtEntryFields): QtEntryFields {
  return {
    meditation: fields.meditation.trim(),
    verse: fields.verse.trim(),
    prayer: fields.prayer.trim(),
  };
}

/** At least one field must be ≥ QT_MIN_CHARS after trim. */
export function isValidQtEntry(fields: QtEntryFields): boolean {
  const t = trimFields(fields);
  return (
    t.meditation.length >= QT_MIN_CHARS ||
    t.verse.length >= QT_MIN_CHARS ||
    t.prayer.length >= QT_MIN_CHARS
  );
}

export function isEmptyQtEntry(fields: QtEntryFields): boolean {
  const t = trimFields(fields);
  return !t.meditation && !t.verse && !t.prayer;
}

export function validationMessage(fields: QtEntryFields): string | null {
  if (isEmptyQtEntry(fields) || !isValidQtEntry(fields)) {
    return "묵상 · 구절 · 기도제목 중 하나 이상을 20자 이상 적어 주세요.";
  }
  return null;
}

export function emptyFields(): QtEntryFields {
  return { meditation: "", verse: "", prayer: "" };
}

export function fieldsFromEntry(entry?: QtEntry | null): QtEntryFields {
  if (!entry) return emptyFields();
  return {
    meditation: entry.meditation ?? "",
    verse: entry.verse ?? "",
    prayer: entry.prayer ?? "",
  };
}

/** Legacy localStorage shape migration. */
export function normalizeEntry(
  raw: Partial<QtEntry> & { content?: string },
): QtEntry {
  const meditation =
    raw.meditation ??
    (typeof raw.content === "string" ? raw.content : "") ??
    "";
  return {
    userId: raw.userId ?? "",
    date: raw.date ?? "",
    meditation,
    verse: raw.verse ?? "",
    prayer: raw.prayer ?? "",
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}
