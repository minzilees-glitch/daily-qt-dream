import type { QtEntry, QtEntryFields } from "@/types";

/** Combined trimmed length of all QT fields must be ≥ this. */
export const QT_MIN_TOTAL_CHARS = 10;

export function trimFields(fields: QtEntryFields): QtEntryFields {
  return {
    meditation: fields.meditation.trim(),
    verse: fields.verse.trim(),
    decisionObedience: fields.decisionObedience.trim(),
    prayer: fields.prayer.trim(),
  };
}

export function totalTrimmedLength(fields: QtEntryFields): number {
  const t = trimFields(fields);
  return (
    t.meditation.length +
    t.verse.length +
    t.decisionObedience.length +
    t.prayer.length
  );
}

/** All QT text fields combined (trimmed) must be ≥ QT_MIN_TOTAL_CHARS. */
export function isValidQtEntry(fields: QtEntryFields): boolean {
  return totalTrimmedLength(fields) >= QT_MIN_TOTAL_CHARS;
}

export function isEmptyQtEntry(fields: QtEntryFields): boolean {
  return totalTrimmedLength(fields) === 0;
}

export function validationMessage(fields: QtEntryFields): string | null {
  if (!isValidQtEntry(fields)) {
    return "전체 합쳐 10자 이상 적어주세요.";
  }
  return null;
}

export function emptyFields(): QtEntryFields {
  return {
    meditation: "",
    verse: "",
    decisionObedience: "",
    prayer: "",
  };
}

export function fieldsFromEntry(entry?: QtEntry | null): QtEntryFields {
  if (!entry) return emptyFields();
  return {
    meditation: entry.meditation ?? "",
    verse: entry.verse ?? "",
    decisionObedience: entry.decisionObedience ?? "",
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
    decisionObedience: raw.decisionObedience ?? "",
    prayer: raw.prayer ?? "",
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}
