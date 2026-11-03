export type GroupId = string;
export type UserId = string;

export interface Group {
  id: GroupId;
  name: string;
  leaderId: UserId;
}

export interface User {
  id: UserId;
  name: string;
  /** Assigned by admin only — users do not self-join. */
  groupId: GroupId;
  isAdmin: boolean;
  isLeader: boolean;
  /** Local profile photo (data URL) from camera roll / file picker. */
  avatarUrl?: string | null;
}

/** One QT check for a user on a calendar date (YYYY-MM-DD, Asia/Seoul). */
export interface QtCompletion {
  userId: UserId;
  date: string;
  completed: boolean;
  /**
   * When false, day is completed (calendar/content) but does not earn a light
   * for rankings/stats — used for past-date backfills. Default true.
   */
  earnsLight?: boolean;
}

/**
 * Daily QT entry. Completion requires saving with validation
 * (at least one field trimmed length ≥ 20).
 */
export interface QtEntry {
  userId: UserId;
  date: string;
  meditation: string;
  verse: string;
  prayer: string;
  updatedAt: string;
}

/** @deprecated Use QtEntry — alias kept for gradual rename in UI. */
export type QtReflection = QtEntry;

export interface QtReadingRange {
  date: string; // YYYY-MM-DD
  range: string; // e.g. "창세기 1:1–2:3"
  title?: string;
  /** Full mock scripture text for the day’s reading. */
  passage?: string;
}

export interface MonthlyAward {
  yearMonth: string; // YYYY-MM
  groupId: GroupId;
  /** Total lights (completed QT days) for the winning group. */
  lights: number;
  confirmed: boolean;
}

export interface GroupRankRow {
  rank: number;
  groupId: GroupId;
  groupName: string;
  memberCount: number;
  /** Sum of completed QT days across members in ranking scope. */
  lights: number;
  possibleCount: number;
  isMine: boolean;
}

export interface DayStatus {
  date: string;
  completed: boolean;
  hasEntry: boolean;
}

export interface QtEntryFields {
  meditation: string;
  verse: string;
  prayer: string;
}
