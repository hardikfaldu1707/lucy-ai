// Generated from the live Supabase schema via the Supabase MCP
// (generate_typescript_types). Regenerate after applying new migrations.
// Do not edit by hand.

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
      action_costs: {
        Row: {
          action_type: string
          cost: number
        }
        Insert: {
          action_type: string
          cost: number
        }
        Update: {
          action_type?: string
          cost?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json
          profile_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json
          profile_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: string
          character_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          reason: string | null
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          category?: string
          character_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          character_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          detail: Json
          event_type: string
          id: string
          ip: string | null
          profile_id: string | null
          route: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          ip?: string | null
          profile_id?: string | null
          route?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          ip?: string | null
          profile_id?: string | null
          route?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          character_id: string | null
          completion_tokens: number
          cost_usd: number
          created_at: string
          id: string
          model: string
          profile_id: string | null
          prompt_tokens: number
          total_tokens: number
        }
        Insert: {
          character_id?: string | null
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          id?: string
          model: string
          profile_id?: string | null
          prompt_tokens?: number
          total_tokens?: number
        }
        Update: {
          character_id?: string | null
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          id?: string
          model?: string
          profile_id?: string | null
          prompt_tokens?: number
          total_tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_call_sessions: {
        Row: {
          character_id: string
          coins_charged: number
          conversation_id: string | null
          ended_at: string | null
          expires_at: string
          id: string
          profile_id: string
          started_at: string
          status: string
          transcript_json: Json
        }
        Insert: {
          character_id: string
          coins_charged?: number
          conversation_id?: string | null
          ended_at?: string | null
          expires_at: string
          id?: string
          profile_id: string
          started_at?: string
          status?: string
          transcript_json?: Json
        }
        Update: {
          character_id?: string
          coins_charged?: number
          conversation_id?: string | null
          ended_at?: string | null
          expires_at?: string
          id?: string
          profile_id?: string
          started_at?: string
          status?: string
          transcript_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "voice_call_sessions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_call_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_call_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_records: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          external_ref: string | null
          id: string
          invoice_url: string | null
          metadata: Json
          profile_id: string
          record_type: string
          status: Database["public"]["Enums"]["billing_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          date?: string
          external_ref?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json
          profile_id: string
          record_type?: string
          status?: Database["public"]["Enums"]["billing_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          external_ref?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json
          profile_id?: string
          record_type?: string
          status?: Database["public"]["Enums"]["billing_status"]
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      character_creation_options: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_enabled: boolean
          label: string
          metadata: Json
          option_group: string | null
          option_key: string
          sort_order: number
          step_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          label: string
          metadata?: Json
          option_group?: string | null
          option_key: string
          sort_order?: number
          step_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          label?: string
          metadata?: Json
          option_group?: string | null
          option_key?: string
          sort_order?: number
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_creation_options_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "character_creation_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      character_creation_steps: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          is_required: boolean
          label: string
          sort_order: number
          step_key: string
          step_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          label: string
          sort_order?: number
          step_key: string
          step_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          label?: string
          sort_order?: number
          step_key?: string
          step_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          age: number
          ai_model: string | null
          appearance: Json
          avatar_url: string
          card_display_mode: string
          category: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string
          gallery_urls: string[]
          gallery_items: Json
          gender: string
          id: string
          is_published: boolean
          name: string
          personality: string[]
          preview_video_url: string | null
          slug: string | null
          style: string
          suggested_questions: string[]
          system_prompt: string | null
          tagline: string
          tags: string[]
          tenant_id: string | null
          updated_at: string
          visibility: string
          voice_id: string | null
          voice_preview_url: string | null
        }
        Insert: {
          age?: number
          ai_model?: string | null
          appearance?: Json
          avatar_url: string
          card_display_mode?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          gallery_urls?: string[]
          gallery_items?: Json
          gender?: string
          id?: string
          is_published?: boolean
          name: string
          personality?: string[]
          preview_video_url?: string | null
          slug?: string | null
          style?: string
          suggested_questions?: string[]
          system_prompt?: string | null
          tagline?: string
          tags?: string[]
          tenant_id?: string | null
          updated_at?: string
          visibility?: string
          voice_id?: string | null
          voice_preview_url?: string | null
        }
        Update: {
          age?: number
          ai_model?: string | null
          appearance?: Json
          avatar_url?: string
          card_display_mode?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          gallery_urls?: string[]
          gallery_items?: Json
          gender?: string
          id?: string
          is_published?: boolean
          name?: string
          personality?: string[]
          preview_video_url?: string | null
          slug?: string | null
          style?: string
          suggested_questions?: string[]
          system_prompt?: string | null
          tagline?: string
          tags?: string[]
          tenant_id?: string | null
          updated_at?: string
          visibility?: string
          voice_id?: string | null
          voice_preview_url?: string | null
        }
        Relationships: []
      }
      character_photo_unlocks: {
        Row: {
          character_id: string
          created_at: string
          id: string
          photo_url: string
          profile_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          photo_url: string
          profile_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          photo_url?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_photo_unlocks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_photo_unlocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_packs: {
        Row: {
          badge: string | null
          coin_amount: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          label: string
          price_cents: number
          slug: string
          sort_order: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          coin_amount: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          label: string
          price_cents: number
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          coin_amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          label?: string
          price_cents?: number
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coin_balances: {
        Row: {
          balance: number
          profile_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          profile_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_balances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          idempotency_key: string | null
          metadata: Json
          profile_id: string
          reason: Database["public"]["Enums"]["coin_reason"]
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          profile_id: string
          reason: Database["public"]["Enums"]["coin_reason"]
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          profile_id?: string
          reason?: Database["public"]["Enums"]["coin_reason"]
        }
        Relationships: [
          {
            foreignKeyName: "coin_ledger_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          profile_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          profile_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          profile_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          character_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          profile_id: string
          summary: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          profile_id: string
          summary?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          profile_id?: string
          summary?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          bucket: string | null
          character_id: string | null
          created_at: string
          id: string
          message_id: string | null
          path: string | null
          profile_id: string
          provider: string
          scope: string
          size_bytes: number | null
          type: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Insert: {
          bucket?: string | null
          character_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          path?: string | null
          profile_id: string
          provider: string
          scope?: string
          size_bytes?: number | null
          type: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Update: {
          bucket?: string | null
          character_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          path?: string | null
          profile_id?: string
          provider?: string
          scope?: string
          size_bytes?: number | null
          type?: Database["public"]["Enums"]["media_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          character_id: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          profile_id: string
          title: string
          type: Database["public"]["Enums"]["memory_type"]
          updated_at: string
        }
        Insert: {
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          profile_id: string
          title: string
          type: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
        }
        Update: {
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          profile_id?: string
          title?: string
          type?: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          duration: number | null
          id: string
          media_url: string | null
          profile_id: string
          role: Database["public"]["Enums"]["message_role"]
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          duration?: number | null
          id?: string
          media_url?: string | null
          profile_id: string
          role: Database["public"]["Enums"]["message_role"]
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          media_url?: string | null
          profile_id?: string
          role?: Database["public"]["Enums"]["message_role"]
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          href: string | null
          id: string
          profile_id: string
          read: boolean
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          profile_id: string
          read?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          profile_id?: string
          read?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          created_at: string
          email: string
          email_verified: boolean
          id: string
          is_admin: boolean
          is_banned: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          tenant_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          id: string
          is_admin?: boolean
          is_banned?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          tenant_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: string
          is_admin?: boolean
          is_banned?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          tenant_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          brand_name: string
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          external_ref: string | null
          monthly_coin_allowance: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          profile_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          monthly_coin_allowance?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          profile_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          monthly_coin_allowance?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          profile_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_characters: {
        Row: {
          character_id: string
          created_at: string
          is_favorite: boolean
          message_count: number
          profile_id: string
          relationship_status: Database["public"]["Enums"]["relationship_status"]
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          is_favorite?: boolean
          message_count?: number
          profile_id: string
          relationship_status?: Database["public"]["Enums"]["relationship_status"]
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          is_favorite?: boolean
          message_count?: number
          profile_id?: string
          relationship_status?: Database["public"]["Enums"]["relationship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_characters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          creativity: number
          extra: Json
          notify_email: boolean
          notify_marketing: boolean
          notify_push: boolean
          privacy_incognito: boolean
          privacy_store_memory: boolean
          profile_id: string
          response_length: string
          updated_at: string
        }
        Insert: {
          creativity?: number
          extra?: Json
          notify_email?: boolean
          notify_marketing?: boolean
          notify_push?: boolean
          privacy_incognito?: boolean
          privacy_store_memory?: boolean
          profile_id: string
          response_length?: string
          updated_at?: string
        }
        Update: {
          creativity?: number
          extra?: Json
          notify_email?: boolean
          notify_marketing?: boolean
          notify_push?: boolean
          privacy_incognito?: boolean
          privacy_store_memory?: boolean
          profile_id?: string
          response_length?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      coin_balance_check: {
        Row: {
          cached_balance: number | null
          drift: number | null
          ledger_balance: number | null
          profile_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coin_balances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_ai_cost_by_profile: {
        Args: never
        Returns: {
          cost_usd: number
          profile_id: string
        }[]
      }
      admin_ai_usage_by_character: {
        Args: never
        Returns: {
          character_id: string
          cost_usd: number
          replies: number
          total_tokens: number
        }[]
      }
      admin_ai_usage_by_model: {
        Args: never
        Returns: {
          cost_usd: number
          model: string
          replies: number
          total_tokens: number
        }[]
      }
      admin_ai_usage_totals: {
        Args: never
        Returns: {
          cost_usd: number
          replies: number
          total_tokens: number
        }[]
      }
      admin_billing_revenue_by_profile: {
        Args: never
        Returns: {
          profile_id: string
          revenue_usd: number
        }[]
      }
      admin_message_stats: {
        Args: never
        Returns: {
          character_id: string
          total_messages: number
          unique_users: number
        }[]
      }
      count_user_messages_today: {
        Args: { p_profile_id: string }
        Returns: number
      }
      current_profile_id: { Args: never; Returns: string }
      grant_coins: {
        Args: {
          p_amount: number
          p_idempotency_key?: string
          p_metadata?: Json
          p_profile_id: string
          p_reason: Database["public"]["Enums"]["coin_reason"]
        }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      spend_coins: {
        Args: {
          p_amount: number
          p_idempotency_key?: string
          p_metadata?: Json
          p_reason: Database["public"]["Enums"]["coin_reason"]
        }
        Returns: number
      }
      spend_coins_for_profile: {
        Args: {
          p_amount: number
          p_idempotency_key?: string
          p_metadata?: Json
          p_profile_id: string
          p_reason: Database["public"]["Enums"]["coin_reason"]
        }
        Returns: number
      }
    }
    Enums: {
      billing_status: "paid" | "pending" | "failed"
      coin_reason:
        | "subscription_grant"
        | "admin_grant"
        | "purchase"
        | "signup_bonus"
        | "refund"
        | "spend_text"
        | "spend_image"
        | "spend_voice"
        | "spend_photo"
        | "adjustment"
      media_type: "image" | "video"
      memory_type: "personality" | "relationship" | "semantic" | "episodic"
      message_role: "user" | "assistant" | "system"
      message_type: "text" | "voice" | "image" | "video" | "system"
      relationship_status:
        | "stranger"
        | "acquaintance"
        | "friend"
        | "close"
        | "partner"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      subscription_plan: "free" | "premium" | "ultimate"
      subscription_status: "active" | "cancelled" | "past_due" | "trialing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
