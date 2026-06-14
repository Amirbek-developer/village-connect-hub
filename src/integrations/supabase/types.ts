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
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          images: string[]
          is_pinned: boolean
          is_urgent: boolean
          likes: number
          title: string
          type: Database["public"]["Enums"]["announcement_type"]
          updated_at: string
          views: number
          village_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          images?: string[]
          is_pinned?: boolean
          is_urgent?: boolean
          likes?: number
          title: string
          type?: Database["public"]["Enums"]["announcement_type"]
          updated_at?: string
          views?: number
          village_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          images?: string[]
          is_pinned?: boolean
          is_urgent?: boolean
          likes?: number
          title?: string
          type?: Database["public"]["Enums"]["announcement_type"]
          updated_at?: string
          views?: number
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category: string
          comment_count: number
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          upvotes: number
          views: number
          village_id: string | null
        }
        Insert: {
          author_id: string
          category?: string
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          upvotes?: number
          views?: number
          village_id?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          upvotes?: number
          views?: number
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          address: string | null
          created_at: string
          description: string
          id: string
          images: string[]
          latitude: number | null
          longitude: number | null
          reporter_id: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          type: Database["public"]["Enums"]["issue_type"]
          updated_at: string
          upvotes: number
          village_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[]
          latitude?: number | null
          longitude?: number | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          type: Database["public"]["Enums"]["issue_type"]
          updated_at?: string
          upvotes?: number
          village_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          latitude?: number | null
          longitude?: number | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          type?: Database["public"]["Enums"]["issue_type"]
          updated_at?: string
          upvotes?: number
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          images: string[]
          is_barter: boolean
          price: number | null
          seller_id: string
          status: Database["public"]["Enums"]["product_status"]
          title: string
          unit: string | null
          updated_at: string
          views: number
          village_id: string | null
        }
        Insert: {
          category: string
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[]
          is_barter?: boolean
          price?: number | null
          seller_id: string
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          unit?: string | null
          updated_at?: string
          views?: number
          village_id?: string | null
        }
        Update: {
          category?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_barter?: boolean
          price?: number | null
          seller_id?: string
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          unit?: string | null
          updated_at?: string
          views?: number
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          first_name: string | null
          id: string
          joined_date: string | null
          language: string
          last_name: string | null
          name: string
          phone: string | null
          updated_at: string
          verified: boolean
          village_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          joined_date?: string | null
          language?: string
          last_name?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          verified?: boolean
          village_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          joined_date?: string | null
          language?: string
          last_name?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          verified?: boolean
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          contact_phone: string | null
          created_at: string
          description: string
          experience_years: number | null
          id: string
          images: string[]
          is_verified: boolean
          price_from: number | null
          price_to: number | null
          price_type: Database["public"]["Enums"]["price_type"]
          provider_id: string
          rating: number
          review_count: number
          title: string
          updated_at: string
          village_id: string | null
        }
        Insert: {
          category: string
          contact_phone?: string | null
          created_at?: string
          description: string
          experience_years?: number | null
          id?: string
          images?: string[]
          is_verified?: boolean
          price_from?: number | null
          price_to?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          provider_id: string
          rating?: number
          review_count?: number
          title: string
          updated_at?: string
          village_id?: string | null
        }
        Update: {
          category?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          experience_years?: number | null
          id?: string
          images?: string[]
          is_verified?: boolean
          price_from?: number | null
          price_to?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          provider_id?: string
          rating?: number
          review_count?: number
          title?: string
          updated_at?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
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
      villages: {
        Row: {
          created_at: string
          district: string
          id: string
          name: string
          region: string
        }
        Insert: {
          created_at?: string
          district: string
          id?: string
          name: string
          region: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          name?: string
          region?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      announcement_type: "official" | "public" | "event" | "urgent"
      app_role:
        | "super_admin"
        | "village_admin"
        | "moderator"
        | "verified"
        | "user"
      issue_status:
        | "pending"
        | "reviewing"
        | "in_progress"
        | "resolved"
        | "rejected"
      issue_type:
        | "road"
        | "electricity"
        | "water"
        | "gas"
        | "garbage"
        | "lighting"
        | "other"
      price_type: "hourly" | "project" | "negotiable" | "fixed"
      product_status: "active" | "sold" | "reserved" | "archived"
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
      announcement_type: ["official", "public", "event", "urgent"],
      app_role: [
        "super_admin",
        "village_admin",
        "moderator",
        "verified",
        "user",
      ],
      issue_status: [
        "pending",
        "reviewing",
        "in_progress",
        "resolved",
        "rejected",
      ],
      issue_type: [
        "road",
        "electricity",
        "water",
        "gas",
        "garbage",
        "lighting",
        "other",
      ],
      price_type: ["hourly", "project", "negotiable", "fixed"],
      product_status: ["active", "sold", "reserved", "archived"],
    },
  },
} as const
