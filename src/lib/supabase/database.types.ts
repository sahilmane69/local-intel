export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          full_name: string | null;
          account_type: "student" | "working-professional" | null;
          city: string | null;
          neighborhood: string | null;
          bio: string | null;
          latitude: number | null;
          longitude: number | null;
          location_source: "gps" | "manual" | null;
          role: "member" | "moderator" | "official";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          full_name?: string | null;
          account_type?: "student" | "working-professional" | null;
          city?: string | null;
          neighborhood?: string | null;
          bio?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_source?: "gps" | "manual" | null;
          role?: "member" | "moderator" | "official";
        };
        Update: Partial<Omit<Database["public"]["Tables"]["profiles"]["Insert"], "id">>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          category: "roads" | "utilities" | "safety" | "environment" | "transit" | "parks";
          status: "open" | "in-progress" | "resolved";
          city: string | null;
          neighborhood: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          location_source: "gps" | "manual" | null;
          verification_status: "unverified" | "community-corroborated" | "officially-confirmed";
          upvote_count: number;
          comment_count: number;
          tags: string[];
          intake_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          title: string;
          body?: string;
          category: Database["public"]["Tables"]["posts"]["Row"]["category"];
          city?: string | null;
          neighborhood: string;
          status?: Database["public"]["Tables"]["posts"]["Row"]["status"];
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_source?: "gps" | "manual" | null;
          tags?: string[];
          intake_notes?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["posts"]["Insert"], "author_id">>;
        Relationships: [];
      };
      post_media: {
        Row: { id: string; post_id: string; kind: "image" | "video" | "audio"; storage_path: string | null; public_url: string; mime_type: string; file_name: string; caption: string | null; poster_url: string | null; sort_order: number; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["post_media"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["post_media"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: { id: string; post_id: string; author_id: string; parent_id: string | null; body: string; created_at: string; updated_at: string };
        Insert: { post_id: string; author_id: string; parent_id?: string | null; body: string };
        Update: { body?: string };
        Relationships: [];
      };
      post_votes: {
        Row: { id: string; post_id: string; user_id: string; value: -1 | 1; created_at: string };
        Insert: { post_id: string; user_id: string; value: -1 | 1 };
        Update: { value?: -1 | 1 };
        Relationships: [];
      };
      saved_posts: {
        Row: { id: string; post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string };
        Update: never;
        Relationships: [];
      };
      evidence_sources: {
        Row: { id: string; post_id: string; media_id: string | null; kind: "photo" | "video" | "audio" | "link" | "source-post"; label: string; href: string | null; note: string | null; recorded_at: string | null; created_at: string };
        Insert: { post_id: string; media_id?: string | null; kind: "photo" | "video" | "audio" | "link" | "source-post"; label: string; href?: string | null; note?: string | null; recorded_at?: string | null };
        Update: never;
        Relationships: [];
      };
      verification_events: { Row: { id: string; post_id: string; actor_id: string; status: "unverified" | "community-corroborated" | "officially-confirmed"; notes: string; created_at: string }; Insert: never; Update: never; Relationships: [] };
      ai_analyses: { Row: { id: string; post_id: string; summary: string; suggested_category: "roads" | "utilities" | "safety" | "environment" | "transit" | "parks" | null; duplicate_hints: Json; evidence_notes: string; sources: Json; checked_at: string; model: string; created_at: string; assessment: "unverified" | "community-corroborated" | null; confidence: "low" | "medium" | "high" | null; reasoning: string | null; known_facts: string | null; uncertainties: string | null; next_steps: string | null; analysis_comment: string | null }; Insert: { post_id: string; summary: string; suggested_category?: "roads" | "utilities" | "safety" | "environment" | "transit" | "parks" | null; duplicate_hints?: Json; evidence_notes: string; sources?: Json; checked_at?: string; model: string; assessment?: "unverified" | "community-corroborated" | null; confidence?: "low" | "medium" | "high" | null; reasoning?: string | null; known_facts?: string | null; uncertainties?: string | null; next_steps?: string | null; analysis_comment?: string | null }; Update: never; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
