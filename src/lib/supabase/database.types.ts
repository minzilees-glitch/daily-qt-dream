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
          /** Real name (본명) from community verification — not Kakao nickname. */
          legal_name: string | null;
          /** pending | verified | exception */
          community_status: string | null;
          /** QT share/copy layout: titled (field titles) | plain (contents only). */
          share_text_layout: "titled" | "plain";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          group_id?: string | null;
          role?: "admin" | "member" | "leader";
          avatar_url?: string | null;
          legal_name?: string | null;
          community_status?: string | null;
          share_text_layout?: "titled" | "plain";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          group_id?: string | null;
          role?: "admin" | "member" | "leader";
          avatar_url?: string | null;
          legal_name?: string | null;
          community_status?: string | null;
          share_text_layout?: "titled" | "plain";
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
          decision_obedience: string;
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
          decision_obedience?: string;
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
          decision_obedience?: string;
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
    Functions: {
      get_qt_presence: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          entry_date: string;
        }[];
      };
      get_group_qt_counts: {
        Args: {
          p_group_id: string;
          p_from?: string | null;
          p_to?: string | null;
        };
        Returns: {
          user_id: string;
          entry_count: number;
        }[];
      };
      current_profile_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      my_group_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      profiles_share_group: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      claimed_legal_names: {
        Args: Record<string, never>;
        Returns: { legal_name: string }[];
      };
      is_legal_name_taken: {
        Args: { candidate: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
