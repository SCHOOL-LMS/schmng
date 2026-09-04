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
      admissions: {
        Row: {
          address: string | null
          admission_number: string | null
          alt_contact: string | null
          assistance_needed: string | null
          city: string | null
          class_admitted: string
          community: string | null
          created_at: string
          created_by: string | null
          digital_address: string | null
          disability_status: string
          disability_type: string | null
          dob: string | null
          emergency_name: string | null
          emergency_phone: string | null
          emergency_relationship: string | null
          emergency_residence: string | null
          emergency_residence_district: string | null
          gender: string
          hometown: string | null
          hometown_district: string | null
          id: string
          last_attendance: string | null
          parent_email: string
          parent_name: string
          parent_phone: string | null
          parent_profile_id: string | null
          place_of_birth: string | null
          previous_class: string | null
          previous_school: string | null
          reason_for_leaving: string | null
          relationship: string | null
          residence: string | null
          residence_district: string | null
          status: string
          student_login_email: string | null
          student_name: string
          student_profile_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_number?: string | null
          alt_contact?: string | null
          assistance_needed?: string | null
          city?: string | null
          class_admitted: string
          community?: string | null
          created_at?: string
          created_by?: string | null
          digital_address?: string | null
          disability_status?: string
          disability_type?: string | null
          dob?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          emergency_residence?: string | null
          emergency_residence_district?: string | null
          gender?: string
          hometown?: string | null
          hometown_district?: string | null
          id?: string
          last_attendance?: string | null
          parent_email: string
          parent_name: string
          parent_phone?: string | null
          parent_profile_id?: string | null
          place_of_birth?: string | null
          previous_class?: string | null
          previous_school?: string | null
          reason_for_leaving?: string | null
          relationship?: string | null
          residence?: string | null
          residence_district?: string | null
          status?: string
          student_login_email?: string | null
          student_name: string
          student_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_number?: string | null
          alt_contact?: string | null
          assistance_needed?: string | null
          city?: string | null
          class_admitted?: string
          community?: string | null
          created_at?: string
          created_by?: string | null
          digital_address?: string | null
          disability_status?: string
          disability_type?: string | null
          dob?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          emergency_residence?: string | null
          emergency_residence_district?: string | null
          gender?: string
          hometown?: string | null
          hometown_district?: string | null
          id?: string
          last_attendance?: string | null
          parent_email?: string
          parent_name?: string
          parent_phone?: string | null
          parent_profile_id?: string | null
          place_of_birth?: string | null
          previous_class?: string | null
          previous_school?: string | null
          reason_for_leaving?: string | null
          relationship?: string | null
          residence?: string | null
          residence_district?: string | null
          status?: string
          student_login_email?: string | null
          student_name?: string
          student_profile_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      class_teachers: {
        Row: {
          class_name: string
          created_at: string
          id: string
          teacher_email: string
          teacher_id: string | null
          teacher_name: string
          teacher_phone: string
          updated_at: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          teacher_email?: string
          teacher_id?: string | null
          teacher_name?: string
          teacher_phone?: string
          updated_at?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          teacher_email?: string
          teacher_id?: string | null
          teacher_name?: string
          teacher_phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education_levels: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          max_age: number | null
          min_age: number | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          max_age?: number | null
          min_age?: number | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          max_age?: number | null
          min_age?: number | null
          name?: string
          sort_order?: number
          updated_at?: string
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
          admission_number: string | null
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
          admission_number?: string | null
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
          admission_number?: string | null
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
      school_branding: {
        Row: {
          accent_color: string
          created_at: string
          currency: string
          date_format: string
          display_name: string
          id: string
          language: string
          locale: string
          logo_url: string | null
          primary_color: string
          school_id: string
          show_powered_by: boolean
          tagline: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          currency?: string
          date_format?: string
          display_name?: string
          id?: string
          language?: string
          locale?: string
          logo_url?: string | null
          primary_color?: string
          school_id: string
          show_powered_by?: boolean
          tagline?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          currency?: string
          date_format?: string
          display_name?: string
          id?: string
          language?: string
          locale?: string
          logo_url?: string | null
          primary_color?: string
          school_id?: string
          show_powered_by?: boolean
          tagline?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_branding_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_types: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          active: boolean
          code: string
          country: string
          created_at: string
          currency: string
          id: string
          level_codes: string[]
          locale: string
          name: string
          region: string
          timezone: string
          type_code: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          country?: string
          created_at?: string
          currency?: string
          id?: string
          level_codes?: string[]
          locale?: string
          name: string
          region?: string
          timezone?: string
          type_code?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          country?: string
          created_at?: string
          currency?: string
          id?: string
          level_codes?: string[]
          locale?: string
          name?: string
          region?: string
          timezone?: string
          type_code?: string
          updated_at?: string
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
      student_attendance: {
        Row: {
          admission_id: string
          attendance_date: string
          created_at: string
          id: string
          note: string
          status: string
        }
        Insert: {
          admission_id: string
          attendance_date?: string
          created_at?: string
          id?: string
          note?: string
          status?: string
        }
        Update: {
          admission_id?: string
          attendance_date?: string
          created_at?: string
          id?: string
          note?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_exeat: {
        Row: {
          admission_id: string
          created_at: string
          departed_at: string | null
          destination: string
          id: string
          reason: string
          return_at: string | null
          returned_at: string | null
          signed_by_id: string | null
          signed_by_name: string
          status: string
          updated_at: string
        }
        Insert: {
          admission_id: string
          created_at?: string
          departed_at?: string | null
          destination?: string
          id?: string
          reason?: string
          return_at?: string | null
          returned_at?: string | null
          signed_by_id?: string | null
          signed_by_name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admission_id?: string
          created_at?: string
          departed_at?: string | null
          destination?: string
          id?: string
          reason?: string
          return_at?: string | null
          returned_at?: string | null
          signed_by_id?: string | null
          signed_by_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_exeat_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          admission_id: string
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string | null
          id: string
          status: string
          term: string
          updated_at: string
        }
        Insert: {
          admission_id: string
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          id?: string
          status?: string
          term: string
          updated_at?: string
        }
        Update: {
          admission_id?: string
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          id?: string
          status?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_performance: {
        Row: {
          admission_id: string
          assessment_type: string
          grade: string
          id: string
          recorded_at: string
          remarks: string
          score: number
          subject: string
          term: string
        }
        Insert: {
          admission_id: string
          assessment_type?: string
          grade?: string
          id?: string
          recorded_at?: string
          remarks?: string
          score?: number
          subject: string
          term: string
        }
        Update: {
          admission_id?: string
          assessment_type?: string
          grade?: string
          id?: string
          recorded_at?: string
          remarks?: string
          score?: number
          subject?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_performance_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          active: boolean
          code: string
          created_at: string
          credits: number | null
          elective: boolean
          id: string
          level_code: string
          name: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          credits?: number | null
          elective?: boolean
          id?: string
          level_code: string
          name: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          credits?: number | null
          elective?: boolean
          id?: string
          level_code?: string
          name?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          academic_year_start_month: number
          created_at: string
          departments: string[]
          features: Json
          grading_system: string
          id: string
          positions: string[]
          rating_scale: Json
          schedule_types: string[]
          school_id: string
          updated_at: string
          week_starts_on: string
        }
        Insert: {
          academic_year_start_month?: number
          created_at?: string
          departments?: string[]
          features?: Json
          grading_system?: string
          id?: string
          positions?: string[]
          rating_scale?: Json
          schedule_types?: string[]
          school_id: string
          updated_at?: string
          week_starts_on?: string
        }
        Update: {
          academic_year_start_month?: number
          created_at?: string
          departments?: string[]
          features?: Json
          grading_system?: string
          id?: string
          positions?: string[]
          rating_scale?: Json
          schedule_types?: string[]
          school_id?: string
          updated_at?: string
          week_starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
