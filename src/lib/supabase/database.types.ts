export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          name: string;
          leader_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          leader_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          leader_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          group_id: string | null;
          role: "admin" | "member" | "leader";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          group_id?: string | null;
          role?: "admin" | "member" | "leader";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          group_id?: string | null;
          role?: "admin" | "member" | "leader";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qt_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          meditation: string;
          verse: string;
          prayer: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          meditation?: string;
          verse?: string;
          prayer?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          meditation?: string;
          verse?: string;
          prayer?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reading_ranges: {
        Row: {
          entry_date: string;
          reference: string;
          title: string | null;
          body: string | null;
          created_at: string;
        };
        Insert: {
          entry_date: string;
          reference: string;
          title?: string | null;
          body?: string | null;
          created_at?: string;
        };
        Update: {
          entry_date?: string;
          reference?: string;
          title?: string | null;
          body?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      qt_entry_presence: {
        Row: {
          user_id: string;
          entry_date: string;
          updated_at: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
