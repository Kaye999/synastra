// Placeholder Database type. Another agent will generate the real schema types
// via `supabase gen types typescript` once the schema is finalised.
//
// Two schemas are used:
//   - public          → Supabase default
//   - astral          → app data (profiles keyed by Clerk user id)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfilesTable = {
  Row: {
    id: string;
    user_id: string;
    tier: 'free' | 'reader' | 'depth';
    birth_data: Json;
    first_name: string | null;
    chat_quota_used_today: number | null;
    chat_quota_reset_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    tier?: 'free' | 'reader' | 'depth';
    birth_data: Json;
    first_name?: string | null;
    chat_quota_used_today?: number | null;
    chat_quota_reset_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ProfilesTable['Row']>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: ProfilesTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  astral: {
    Tables: {
      profiles: ProfilesTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
