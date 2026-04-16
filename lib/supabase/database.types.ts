export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          city: string | null;
          role: "buyer" | "traveler" | "both";
          rating: number;
          total_deliveries: number;
          verified: boolean;
          avatar_url: string | null;
          bio: string | null;
          followers_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          role?: "buyer" | "traveler" | "both";
          rating?: number;
          total_deliveries?: number;
          verified?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          role?: "buyer" | "traveler" | "both";
          rating?: number;
          total_deliveries?: number;
          verified?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      followers: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          type: "request" | "trip";
          content: string;
          origin: string | null;
          destination: string | null;
          departure_date: string | null;
          weight_available_kg: number | null;
          price_per_kg_tnd: number | null;
          product_price_tnd: number | null;
          reward_tnd: number | null;
          item_description: string | null;
          item_weight_kg: number | null;
          images: string[];
          status: "active" | "completed" | "cancelled";
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
          author?: Profile;
        };
        Insert: {
          id?: string;
          author_id: string;
          type: "request" | "trip";
          content: string;
          origin?: string | null;
          destination?: string | null;
          departure_date?: string | null;
          weight_available_kg?: number | null;
          price_per_kg_tnd?: number | null;
          product_price_tnd?: number | null;
          reward_tnd?: number | null;
          item_description?: string | null;
          item_weight_kg?: number | null;
          images?: string[];
          status?: "active" | "completed" | "cancelled";
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          type?: "request" | "trip";
          content?: string;
          origin?: string | null;
          destination?: string | null;
          departure_date?: string | null;
          weight_available_kg?: number | null;
          price_per_kg_tnd?: number | null;
          product_price_tnd?: number | null;
          reward_tnd?: number | null;
          item_description?: string | null;
          item_weight_kg?: number | null;
          images?: string[];
          status?: "active" | "completed" | "cancelled";
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
          author?: Profile;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_bookmarks: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      post_offers: {
        Row: {
          id: string;
          post_id: string;
          offerer_id: string;
          buyer_id: string;
          traveler_id: string;
          message: string | null;
          proposed_price_tnd: number | null;
          item_price_tnd: number | null;
          amount_tnd: number | null;
          platform_fee_tnd: number | null;
          platform_fee_rate: number | null;
          total_paid_tnd: number | null;
          payment_intent_id: string | null;
          payment_method: "konnect" | "manual" | null;
          status: "pending" | "accepted" | "declined" | "cancelled";
          payment_status: "awaiting_acceptance" | "pending" | "awaiting_payment" | "awaiting_verification" | "authorized" | "captured" | "failed" | "refunded" | null;
          delivery_status: "pending" | "in_transit" | "delivered" | "buyer_confirmed" | "completed" | null;
          delivery_otp: string | null;
          otp_generated_at: string | null;
          traveler_confirmed_delivery: boolean | null;
          traveler_confirmed_at: string | null;
          buyer_confirmed_receipt: boolean | null;
          buyer_confirmed_at: string | null;
          otp_verified: boolean | null;
          otp_verified_at: string | null;
          payment_released: boolean | null;
          payment_released_at: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          offerer_id: string;
          buyer_id: string;
          traveler_id: string;
          message?: string | null;
          proposed_price_tnd?: number | null;
          item_price_tnd?: number | null;
          amount_tnd?: number | null;
          platform_fee_tnd?: number | null;
          platform_fee_rate?: number | null;
          total_paid_tnd?: number | null;
          payment_intent_id?: string | null;
          payment_method?: "konnect" | "manual" | null;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          payment_status?: "awaiting_acceptance" | "pending" | "awaiting_payment" | "awaiting_verification" | "authorized" | "captured" | "failed" | "refunded" | null;
          delivery_status?: "pending" | "in_transit" | "delivered" | "buyer_confirmed" | "completed" | null;
          delivery_otp?: string | null;
          otp_generated_at?: string | null;
          traveler_confirmed_delivery?: boolean | null;
          traveler_confirmed_at?: string | null;
          buyer_confirmed_receipt?: boolean | null;
          buyer_confirmed_at?: string | null;
          otp_verified?: boolean | null;
          otp_verified_at?: string | null;
          payment_released?: boolean | null;
          payment_released_at?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          offerer_id?: string;
          buyer_id?: string;
          traveler_id?: string;
          message?: string | null;
          proposed_price_tnd?: number | null;
          item_price_tnd?: number | null;
          amount_tnd?: number | null;
          platform_fee_tnd?: number | null;
          platform_fee_rate?: number | null;
          total_paid_tnd?: number | null;
          payment_intent_id?: string | null;
          payment_method?: "konnect" | "manual" | null;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          payment_status?: "awaiting_acceptance" | "pending" | "awaiting_payment" | "awaiting_verification" | "authorized" | "captured" | "failed" | "refunded" | null;
          delivery_status?: "pending" | "in_transit" | "delivered" | "buyer_confirmed" | "completed" | null;
          delivery_otp?: string | null;
          otp_generated_at?: string | null;
          traveler_confirmed_delivery?: boolean | null;
          traveler_confirmed_at?: string | null;
          buyer_confirmed_receipt?: boolean | null;
          buyer_confirmed_at?: string | null;
          otp_verified?: boolean | null;
          otp_verified_at?: string | null;
          payment_released?: boolean | null;
          payment_released_at?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string | null;
          type: "like" | "comment" | "offer" | "message" | "delivery_update" | "escrow_update";
          post_id: string | null;
          comment_id: string | null;
          offer_id: string | null;
          thread_id: string | null;
          order_id: string | null;
          title: string;
          message: string | null;
          is_read: boolean;
          created_at: string;
          sender?: Profile;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          sender_id?: string | null;
          type: "like" | "comment" | "offer" | "message" | "delivery_update" | "escrow_update";
          post_id?: string | null;
          comment_id?: string | null;
          offer_id?: string | null;
          thread_id?: string | null;
          order_id?: string | null;
          title: string;
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          sender_id?: string | null;
          type?: "like" | "comment" | "offer" | "message" | "delivery_update" | "escrow_update";
          post_id?: string | null;
          comment_id?: string | null;
          offer_id?: string | null;
          thread_id?: string | null;
          order_id?: string | null;
          title?: string;
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          traveler_id: string | null;
          trip_id: string | null;
          type: "buy_and_bring" | "pickup_and_bring";
          product_price_tnd: number | null;
          reward_tnd: number;
          item_description: string;
          item_weight_kg: number | null;
          origin: string;
          destination: string;
          status: "open" | "accepted" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed";
          delivery_qr_token: string;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          traveler_id?: string | null;
          trip_id?: string | null;
          type: "buy_and_bring" | "pickup_and_bring";
          product_price_tnd?: number | null;
          reward_tnd: number;
          item_description: string;
          item_weight_kg?: number | null;
          origin: string;
          destination: string;
          status?: "open" | "accepted" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed";
          delivery_qr_token?: string;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          traveler_id?: string | null;
          trip_id?: string | null;
          type?: "buy_and_bring" | "pickup_and_bring";
          product_price_tnd?: number | null;
          reward_tnd?: number;
          item_description?: string;
          item_weight_kg?: number | null;
          origin?: string;
          destination?: string;
          status?: "open" | "accepted" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed";
          delivery_qr_token?: string;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_threads: {
        Row: {
          id: string;
          order_id: string | null;
          post_id: string | null;
          trip_id: string | null;
          offer_id: string | null;
          buyer_id: string;
          traveler_id: string;
          payment_intent_id: string | null;
          delivery_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          post_id?: string | null;
          trip_id?: string | null;
          offer_id?: string | null;
          buyer_id: string;
          traveler_id: string;
          payment_intent_id?: string | null;
          delivery_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          post_id?: string | null;
          trip_id?: string | null;
          offer_id?: string | null;
          buyer_id?: string;
          traveler_id?: string;
          payment_intent_id?: string | null;
          delivery_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          message?: string;
          created_at?: string;
        };
      };
      payment_proofs: {
        Row: {
          id: string;
          offer_id: string | null;
          order_id: string | null;
          buyer_id: string;
          provider: "d17" | "flouci" | "other";
          image_url: string;
          amount_tnd: number;
          transaction_id: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          offer_id?: string | null;
          order_id?: string | null;
          buyer_id: string;
          provider: "d17" | "flouci" | "other";
          image_url: string;
          amount_tnd: number;
          transaction_id?: string | null;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          offer_id?: string | null;
          order_id?: string | null;
          buyer_id?: string;
          provider?: "d17" | "flouci" | "other";
          image_url?: string;
          amount_tnd?: number;
          transaction_id?: string | null;
          verified?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Post = Tables<"posts">;
export type PostLike = Tables<"post_likes">;
export type PostComment = Tables<"post_comments">;
export type PostBookmark = Tables<"post_bookmarks">;
export type PostOffer = Tables<"post_offers">;
export type Notification = Tables<"notifications">;
export type Order = Tables<"orders">;
export type ChatThread = Tables<"chat_threads">;
export type ChatMessage = Tables<"chat_messages">;
export type PaymentProof = Tables<"payment_proofs">;
