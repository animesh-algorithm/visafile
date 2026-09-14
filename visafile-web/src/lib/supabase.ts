import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type VisaFileDatabase = {
  public: {
    Tables: {
      ds160_intake_submissions: {
        Row: {
          id: string;
          user_id: string;
          answers: Record<string, unknown>;
          step: number;
          progress: number;
          source: string;
          schema_version: number;
          automation_job_id: string | null;
          automation_status: string;
          automation_error: string | null;
          authorize_official_submission: boolean;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          answers: Record<string, unknown>;
          step: number;
          progress: number;
          source?: string;
          schema_version?: number;
          automation_job_id?: string | null;
          automation_status?: string;
          automation_error?: string | null;
          authorize_official_submission?: boolean;
          submitted_at?: string;
          created_at?: string;
        };
        Update: {
          automation_job_id?: string | null;
          automation_status?: string;
          automation_error?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type VisaFileSupabaseClient = SupabaseClient<VisaFileDatabase>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<VisaFileDatabase>(supabaseUrl!, supabaseAnonKey!)
  : null;
