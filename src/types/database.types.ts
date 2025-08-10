export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          skill_level: number
          total_score: number
          country: string | null
          games_played: number
          last_active: string
          gems: number
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          skill_level?: number
          total_score?: number
          country?: string | null
          games_played?: number
          last_active?: string
          gems?: number
          is_premium?: boolean
          cognitive_level?: number
          cognitive_badge?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          skill_level?: number
          total_score?: number
          country?: string | null
          games_played?: number
          last_active?: string
          gems?: number
          is_premium?: boolean
          cognitive_level?: number
          cognitive_badge?: string
          created_at?: string
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          game_type: string
          difficulty_level: number
          score: number
          duration: number
          success_rate: number | null
          performance_data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_type: string
          difficulty_level: number
          score: number
          duration: number
          success_rate?: number | null
          performance_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_type?: string
          difficulty_level?: number
          score?: number
          duration?: number
          success_rate?: number | null
          performance_data?: any | null
          created_at?: string
        }
      }
      game_stats: {
        Row: {
          id: string
          user_id: string
          memory_strength: number
          focus_duration: number
          distraction_resistance: number
          context_switching_speed: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          memory_strength?: number
          focus_duration?: number
          distraction_resistance?: number
          context_switching_speed?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          memory_strength?: number
          focus_duration?: number
          distraction_resistance?: number
          context_switching_speed?: number
          updated_at?: string
        }
      }
    }
  }
}