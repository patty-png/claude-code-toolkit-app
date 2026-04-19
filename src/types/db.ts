// Auto-generated from Supabase — run `npx supabase gen types typescript --project-id <id> > src/types/db.ts`
// Placeholder until Supabase project is connected

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      tools: {
        Row: {
          id: number
          slug: string
          name: string
          category_id: string | null
          tag: string | null
          blurb: string
          url: string | null
          install_command: string | null
          install_notes: string | null
          is_featured: boolean
          feature_rank: number | null
          created_at: string
          updated_at: string
          search_vector: unknown | null
        }
        Insert: Omit<Database['public']['Tables']['tools']['Row'], 'id' | 'created_at' | 'updated_at' | 'search_vector'>
        Update: Partial<Database['public']['Tables']['tools']['Insert']>
      }
      categories: {
        Row: {
          id: string
          label: string
          short_label: string | null
          emoji: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      videos: {
        Row: {
          id: number
          title: string
          url: string
          youtube_id: string | null
          thumbnail_url: string | null
          channel: string | null
          duration_seconds: number | null
          topic: string | null
          skill_level: 'beginner' | 'intermediate' | 'advanced' | null
          description: string | null
          published_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['videos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['videos']['Insert']>
      }
      courses: {
        Row: {
          id: number
          title: string
          provider: string
          url: string
          price_usd: number | null
          is_free: boolean
          has_certificate: boolean
          skill_level: 'beginner' | 'intermediate' | 'advanced' | null
          duration_hours: number | null
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['courses']['Insert']>
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      stack_items: {
        Row: {
          id: string
          project_id: string
          tool_id: number | null
          custom_tool_name: string | null
          custom_tool_url: string | null
          fields: Json
          added_at: string
        }
        Insert: Omit<Database['public']['Tables']['stack_items']['Row'], 'id' | 'added_at'>
        Update: Partial<Database['public']['Tables']['stack_items']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
