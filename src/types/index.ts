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

export interface QtReflection {
  userId: UserId;
  date: string;
  content: string;
  updatedAt: string;
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
  hasReflection: boolean;
}
