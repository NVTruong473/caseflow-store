import type {
  CategorySlug,
  CompatibilityLabel,
  OrderStatus,
} from "@/types/domain";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfileRole = "customer" | "admin";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: ProfileRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: CategorySlug;
          name: string;
          description: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: CategorySlug;
          name: string;
          description: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: CategorySlug;
          name?: string;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          price: number;
          stock: number;
          image_url: string;
          compatibility: CompatibilityLabel[];
          is_featured: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          price: number;
          stock?: number;
          image_url: string;
          compatibility: CompatibilityLabel[];
          is_featured?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          price?: number;
          stock?: number;
          image_url?: string;
          compatibility?: CompatibilityLabel[];
          is_featured?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_code: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: string;
          status: OrderStatus;
          subtotal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_code: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: string;
          status?: OrderStatus;
          subtotal: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_code?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          shipping_address?: string;
          status?: OrderStatus;
          subtotal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order_with_items: {
        Args: {
          p_order_code: string;
          p_customer_name: string;
          p_customer_email: string;
          p_customer_phone: string;
          p_shipping_address: string;
          p_subtotal: number;
          p_items: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type PublicTable = keyof Database["public"]["Tables"];

export type TableRow<TableName extends PublicTable> =
  Database["public"]["Tables"][TableName]["Row"];

export type TableInsert<TableName extends PublicTable> =
  Database["public"]["Tables"][TableName]["Insert"];

export type TableUpdate<TableName extends PublicTable> =
  Database["public"]["Tables"][TableName]["Update"];
