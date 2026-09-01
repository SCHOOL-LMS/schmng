export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          description: string
          details: Json
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          description?: string
          details?: Json
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          description?: string
          details?: Json
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      offer_letters: {
        Row: {
          candidate_email: string
          candidate_name: string
          created_at: string
          created_by: string | null
          id: string
          position: string
          salary: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_email: string
          candidate_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          position: string
          salary?: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_email?: string
          candidate_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          position?: string
          salary?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          note: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          class_name: string | null
          created_at: string
          department: string | null
          email: string
          employee_id: string | null
          force_password_change: boolean
          full_name: string
          gender: string | null
          id: string
          last_login: string | null
          password_reset_at: string | null
          permissions: Json
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["app_role"]
          salary: number | null
          start_date: string | null
          status: string
          two_factor_enabled: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          class_name?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employee_id?: string | null
          force_password_change?: boolean
          full_name?: string
          gender?: string | null
          id: string
          last_login?: string | null
          password_reset_at?: string | null
          permissions?: Json
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salary?: number | null
          start_date?: string | null
          status?: string
          two_factor_enabled?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          class_name?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employee_id?: string | null
          force_password_change?: boolean
          full_name?: string
          gender?: string | null
          id?: string
          last_login?: string | null
          password_reset_at?: string | null
          permissions?: Json
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salary?: number | null
          start_date?: string | null
          status?: string
          two_factor_enabled?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          allowed_ips: string
          created_at: string
          id: string
          lockout_duration: number
          max_concurrent_sessions: number
          max_login_attempts: number
          session_timeout: number
          singleton: boolean
          updated_at: string
        }
        Insert: {
          allowed_ips?: string
          created_at?: string
          id?: string
          lockout_duration?: number
          max_concurrent_sessions?: number
          max_login_attempts?: number
          session_timeout?: number
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          allowed_ips?: string
          created_at?: string
          id?: string
          lockout_duration?: number
          max_concurrent_sessions?: number
          max_login_attempts?: number
          session_timeout?: number
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      staff_performance: {
        Row: {
          comments: string
          created_at: string
          id: string
          rating: string
          rating_score: number
          review_period: string
          reviewer_id: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          comments?: string
          created_at?: string
          id?: string
          rating: string
          rating_score?: number
          review_period: string
          reviewer_id?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          comments?: string
          created_at?: string
          id?: string
          rating?: string
          rating_score?: number
          review_period?: string
          reviewer_id?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_performance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          schedule_date: string
          schedule_type: string
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          schedule_date: string
          schedule_type: string
          staff_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          schedule_date?: string
          schedule_type?: string
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      access_level:
        | "super_administrator"
        | "administrator"
        | "standard"
        | "basic"
      app_role:
        | "super_admin"
        | "school_manager"
        | "staff"
        | "student"
        | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level: [
        "super_administrator",
        "administrator",
        "standard",
        "basic",
      ],
      app_role: ["super_admin", "school_manager", "staff", "student", "parent"],
    },
  },
} as const
