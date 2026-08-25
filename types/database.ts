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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          is_pinned: boolean
          lesson_id: string
          org_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          lesson_id: string
          org_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          lesson_id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to_sku: string
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          kind: string
          max_redemptions: number | null
          org_id: string
          owner_user_id: string | null
          redemption_count: number
          restricted_to_email: string | null
          starts_at: string | null
          value: Json
        }
        Insert: {
          applies_to_sku?: string
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind: string
          max_redemptions?: number | null
          org_id: string
          owner_user_id?: string | null
          redemption_count?: number
          restricted_to_email?: string | null
          starts_at?: string | null
          value: Json
        }
        Update: {
          applies_to_sku?: string
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          max_redemptions?: number | null
          org_id?: string
          owner_user_id?: string | null
          redemption_count?: number
          restricted_to_email?: string | null
          starts_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string
          discount_code_id: string | null
          expires_at: string | null
          id: string
          org_id: string
          product_sku: string
          source: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_code_id?: string | null
          expires_at?: string | null
          id?: string
          org_id: string
          product_sku: string
          source?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          discount_code_id?: string | null
          expires_at?: string | null
          id?: string
          org_id?: string
          product_sku?: string
          source?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_org_id_product_sku_fkey"
            columns: ["org_id", "product_sku"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "sku"]
          },
          {
            foreignKeyName: "enrollments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_watched_at: string
          lesson_id: string
          org_id: string
          position_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_watched_at?: string
          lesson_id: string
          org_id: string
          position_seconds?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_watched_at?: string
          lesson_id?: string
          org_id?: string
          position_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          bunny_video_id: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_free_preview: boolean
          module_id: string
          order_index: number
          org_id: string
          published_at: string | null
          title: string
        }
        Insert: {
          bunny_video_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free_preview?: boolean
          module_id: string
          order_index: number
          org_id: string
          published_at?: string | null
          title: string
        }
        Update: {
          bunny_video_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free_preview?: boolean
          module_id?: string
          order_index?: number
          org_id?: string
          published_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          org_id: string
          product_sku: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          org_id: string
          product_sku: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          org_id?: string
          product_sku?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_org_id_product_sku_fkey"
            columns: ["org_id", "product_sku"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "sku"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          grants_skus: string[]
          id: string
          is_active: boolean
          org_id: string
          price_kobo: number
          sku: string
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          grants_skus?: string[]
          id?: string
          is_active?: boolean
          org_id: string
          price_kobo: number
          sku: string
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          grants_skus?: string[]
          id?: string
          is_active?: boolean
          org_id?: string
          price_kobo?: number
          sku?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_alumni: boolean
          last_active_at: string | null
          org_id: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_alumni?: boolean
          last_active_at?: string | null
          org_id: string
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_alumni?: boolean
          last_active_at?: string | null
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          file_format: string
          id: string
          kind: string
          lesson_id: string | null
          module_id: string
          org_id: string
          size_bytes: number
          storage_path: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_format: string
          id?: string
          kind: string
          lesson_id?: string | null
          module_id: string
          org_id: string
          size_bytes?: number
          storage_path?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_format?: string
          id?: string
          kind?: string
          lesson_id?: string | null
          module_id?: string
          org_id?: string
          size_bytes?: number
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_kobo: number
          created_at: string
          discount_code_id: string | null
          id: string
          org_id: string
          paid_at: string | null
          product_sku: string
          reference: string
          status: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          discount_code_id?: string | null
          id?: string
          org_id: string
          paid_at?: string | null
          product_sku: string
          reference: string
          status?: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          discount_code_id?: string | null
          id?: string
          org_id?: string
          paid_at?: string | null
          product_sku?: string
          reference?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_org_id_product_sku_fkey"
            columns: ["org_id", "product_sku"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "sku"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      curriculum: {
        Row: {
          duration_seconds: number | null
          is_free_preview: boolean | null
          lesson_description: string | null
          lesson_id: string | null
          lesson_order: number | null
          lesson_title: string | null
          module_description: string | null
          module_id: string | null
          module_order: number | null
          module_title: string | null
          org_id: string | null
          product_sku: string | null
          published_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_org_id_product_sku_fkey"
            columns: ["org_id", "product_sku"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "sku"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: { p_user: string }; Returns: boolean }
      user_has_sku: {
        Args: { p_sku: string; p_user: string }
        Returns: boolean
      }
      validate_discount_code: {
        Args: { p_code: string; p_sku: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
