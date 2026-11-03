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
}

/** One QT check for a user on a calendar date (YYYY-MM-DD, Asia/Seoul). */
export interface QtCompletion {
  userId: UserId;
  date: string;
  completed: boolean;
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
}

export interface MonthlyAward {
  yearMonth: string; // YYYY-MM
  groupId: GroupId;
  rate: number;
  confirmed: boolean;
}

export interface GroupRankRow {
  rank: number;
  groupId: GroupId;
  groupName: string;
  memberCount: number;
  completionCount: number;
  possibleCount: number;
  rate: number;
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
