import type {
  BookCategorySlug,
  BookFormat,
  CategorySlug,
  CompatibilityLabel,
  CoverAssetSource,
  EditionLanguage,
  InventoryStatus,
  OrderStatus,
  ShippingStatus,
  UserRole,
} from "@/types/domain";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfileRole = UserRole;
type SourceReviewStatus = "draft" | "needs-review" | "approved" | "rejected";
type ContentQualityRequirementLevel = "blocking" | "optional";
type ContentQualityStatus =
  | "verified"
  | "missing"
  | "unverified"
  | "not-applicable";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: ProfileRole;
          full_name: string | null;
          email: string | null;
          email_verified_at: string | null;
          phone: string | null;
          phone_verified_at: string | null;
          default_shipping_address: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: ProfileRole;
          full_name?: string | null;
          email?: string | null;
          email_verified_at?: string | null;
          phone?: string | null;
          phone_verified_at?: string | null;
          default_shipping_address?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: ProfileRole;
          full_name?: string | null;
          email?: string | null;
          email_verified_at?: string | null;
          phone?: string | null;
          phone_verified_at?: string | null;
          default_shipping_address?: Json | null;
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
      book_categories: {
        Row: {
          id: string;
          slug: BookCategorySlug;
          labels: Json;
          description: Json;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: BookCategorySlug;
          labels: Json;
          description: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: BookCategorySlug;
          labels?: Json;
          description?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_authors: {
        Row: {
          id: string;
          slug: string;
          name: string;
          bio_short: Json | null;
          country: string | null;
          birth_year: number | null;
          death_year: number | null;
          source_note: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          bio_short?: Json | null;
          country?: string | null;
          birth_year?: number | null;
          death_year?: number | null;
          source_note?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          bio_short?: Json | null;
          country?: string | null;
          birth_year?: number | null;
          death_year?: number | null;
          source_note?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_translators: {
        Row: {
          id: string;
          slug: string;
          name: string;
          bio_short: Json | null;
          source_note: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          bio_short?: Json | null;
          source_note?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          bio_short?: Json | null;
          source_note?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_publishers: {
        Row: {
          id: string;
          slug: string;
          name: string;
          country: string | null;
          website: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          country?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          country?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_cover_assets: {
        Row: {
          id: string;
          path: string;
          alt_text: Json;
          source: CoverAssetSource;
          source_note: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          alt_text: Json;
          source?: CoverAssetSource;
          source_note?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          alt_text?: Json;
          source?: CoverAssetSource;
          source_note?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_works: {
        Row: {
          id: string;
          slug: string;
          title: string;
          original_title: string | null;
          localized_title: Json;
          original_language: string;
          themes: string[];
          age_rating: string | null;
          publication_era: string | null;
          canonical_summary: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          original_title?: string | null;
          localized_title?: Json;
          original_language: string;
          themes?: string[];
          age_rating?: string | null;
          publication_era?: string | null;
          canonical_summary: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          original_title?: string | null;
          localized_title?: Json;
          original_language?: string;
          themes?: string[];
          age_rating?: string | null;
          publication_era?: string | null;
          canonical_summary?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_work_authors: {
        Row: {
          work_id: string;
          author_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          work_id: string;
          author_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          work_id?: string;
          author_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_work_authors_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "book_authors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_work_authors_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "book_works";
            referencedColumns: ["id"];
          },
        ];
      };
      book_work_categories: {
        Row: {
          work_id: string;
          category_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          work_id: string;
          category_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          work_id?: string;
          category_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_work_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "book_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_work_categories_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "book_works";
            referencedColumns: ["id"];
          },
        ];
      };
      book_editions: {
        Row: {
          id: string;
          work_id: string;
          slug: string;
          display_title: string;
          localized_display_title: Json;
          subtitle: string | null;
          language: EditionLanguage;
          format: BookFormat;
          publisher_id: string | null;
          isbn13: string | null;
          isbn10: string | null;
          publication_year: number | null;
          page_count: number | null;
          dimensions: Json | null;
          weight_grams: number | null;
          cover_asset_id: string | null;
          price_vnd: number;
          compare_at_price_vnd: number | null;
          stock_quantity: number;
          low_stock_threshold: number;
          inventory_status: InventoryStatus;
          summary: Json;
          table_of_contents: Json | null;
          sample_excerpt_policy: string | null;
          is_featured: boolean;
          is_active: boolean;
          pair_id: string | null;
          paired_edition_id: string | null;
          reason_to_read: Json | null;
          display_facts: Json;
          omitted_optional_fact_keys: string[];
          source_edition_key: string | null;
          source_review_status: SourceReviewStatus | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          work_id: string;
          slug: string;
          display_title: string;
          localized_display_title?: Json;
          subtitle?: string | null;
          language: EditionLanguage;
          format: BookFormat;
          publisher_id?: string | null;
          isbn13?: string | null;
          isbn10?: string | null;
          publication_year?: number | null;
          page_count?: number | null;
          dimensions?: Json | null;
          weight_grams?: number | null;
          cover_asset_id?: string | null;
          price_vnd: number;
          compare_at_price_vnd?: number | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          inventory_status?: InventoryStatus;
          summary: Json;
          table_of_contents?: Json | null;
          sample_excerpt_policy?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          pair_id?: string | null;
          paired_edition_id?: string | null;
          reason_to_read?: Json | null;
          display_facts?: Json;
          omitted_optional_fact_keys?: string[];
          source_edition_key?: string | null;
          source_review_status?: SourceReviewStatus | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          work_id?: string;
          slug?: string;
          display_title?: string;
          localized_display_title?: Json;
          subtitle?: string | null;
          language?: EditionLanguage;
          format?: BookFormat;
          publisher_id?: string | null;
          isbn13?: string | null;
          isbn10?: string | null;
          publication_year?: number | null;
          page_count?: number | null;
          dimensions?: Json | null;
          weight_grams?: number | null;
          cover_asset_id?: string | null;
          price_vnd?: number;
          compare_at_price_vnd?: number | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          inventory_status?: InventoryStatus;
          summary?: Json;
          table_of_contents?: Json | null;
          sample_excerpt_policy?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          pair_id?: string | null;
          paired_edition_id?: string | null;
          reason_to_read?: Json | null;
          display_facts?: Json;
          omitted_optional_fact_keys?: string[];
          source_edition_key?: string | null;
          source_review_status?: SourceReviewStatus | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_editions_cover_asset_id_fkey";
            columns: ["cover_asset_id"];
            isOneToOne: false;
            referencedRelation: "book_cover_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_editions_publisher_id_fkey";
            columns: ["publisher_id"];
            isOneToOne: false;
            referencedRelation: "book_publishers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_editions_paired_edition_id_fkey";
            columns: ["paired_edition_id"];
            isOneToOne: false;
            referencedRelation: "book_editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_editions_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "book_works";
            referencedColumns: ["id"];
          },
        ];
      };
      book_edition_translators: {
        Row: {
          edition_id: string;
          translator_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          edition_id: string;
          translator_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          edition_id?: string;
          translator_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_edition_translators_edition_id_fkey";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "book_editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_edition_translators_translator_id_fkey";
            columns: ["translator_id"];
            isOneToOne: false;
            referencedRelation: "book_translators";
            referencedColumns: ["id"];
          },
        ];
      };
      book_catalog_provenance_records: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          field_key: string;
          source_label: string;
          source_url: string | null;
          checked_at: string;
          content_kind: string;
          rights_basis: string;
          rights_basis_note: string;
          license: Json | null;
          attribution: Json;
          review_status: SourceReviewStatus;
          reviewer_note: string | null;
          reviewed_at: string | null;
          edition_match_confidence: string;
          source_edition_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          entity_type: string;
          entity_id: string;
          field_key: string;
          source_label: string;
          source_url?: string | null;
          checked_at: string;
          content_kind: string;
          rights_basis: string;
          rights_basis_note: string;
          license?: Json | null;
          attribution: Json;
          review_status: SourceReviewStatus;
          reviewer_note?: string | null;
          reviewed_at?: string | null;
          edition_match_confidence: string;
          source_edition_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          field_key?: string;
          source_label?: string;
          source_url?: string | null;
          checked_at?: string;
          content_kind?: string;
          rights_basis?: string;
          rights_basis_note?: string;
          license?: Json | null;
          attribution?: Json;
          review_status?: SourceReviewStatus;
          reviewer_note?: string | null;
          reviewed_at?: string | null;
          edition_match_confidence?: string;
          source_edition_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_content_quality_checks: {
        Row: {
          id: string;
          edition_id: string;
          requirement: string;
          requirement_level: ContentQualityRequirementLevel;
          status: ContentQualityStatus;
          provenance_record_id: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          requirement: string;
          requirement_level: ContentQualityRequirementLevel;
          status: ContentQualityStatus;
          provenance_record_id?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string;
          requirement?: string;
          requirement_level?: ContentQualityRequirementLevel;
          status?: ContentQualityStatus;
          provenance_record_id?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_content_quality_checks_edition_id_fkey";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "book_editions";
            referencedColumns: ["id"];
          },
        ];
      };
      book_catalog_compatibility: {
        Row: {
          id: string;
          legacy_entity_type: "work" | "edition";
          legacy_id: string;
          legacy_slug: string;
          behavior: "preserved" | "redirect" | "retired-to-catalog";
          target_slug: string | null;
          reason: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          legacy_entity_type: "work" | "edition";
          legacy_id: string;
          legacy_slug: string;
          behavior: "preserved" | "redirect" | "retired-to-catalog";
          target_slug?: string | null;
          reason: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          legacy_entity_type?: "work" | "edition";
          legacy_id?: string;
          legacy_slug?: string;
          behavior?: "preserved" | "redirect" | "retired-to-catalog";
          target_slug?: string | null;
          reason?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_merchandising_shelves: {
        Row: {
          id: string;
          slug: string;
          shelf_type: string;
          source_kind: string;
          labels: Json;
          description: Json;
          inclusion_rule: Json;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          sort_order: number;
          min_items: number;
          max_items: number;
          fallback: Json;
          required_permission: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          shelf_type: string;
          source_kind: string;
          labels: Json;
          description: Json;
          inclusion_rule: Json;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          sort_order: number;
          min_items: number;
          max_items: number;
          fallback: Json;
          required_permission?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          shelf_type?: string;
          source_kind?: string;
          labels?: Json;
          description?: Json;
          inclusion_rule?: Json;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          sort_order?: number;
          min_items?: number;
          max_items?: number;
          fallback?: Json;
          required_permission?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_merchandising_shelf_items: {
        Row: {
          id: string;
          shelf_id: string;
          edition_id: string;
          position: number;
          is_active: boolean;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          shelf_id: string;
          edition_id: string;
          position: number;
          is_active?: boolean;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shelf_id?: string;
          edition_id?: string;
          position?: number;
          is_active?: boolean;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_merchandising_shelf_items_edition_id_fkey";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "book_editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_merchandising_shelf_items_shelf_id_fkey";
            columns: ["shelf_id"];
            isOneToOne: false;
            referencedRelation: "book_merchandising_shelves";
            referencedColumns: ["id"];
          },
        ];
      };
      book_inventory_adjustments: {
        Row: {
          id: string;
          edition_id: string;
          quantity_delta: number;
          reason: string;
          created_by_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          quantity_delta: number;
          reason: string;
          created_by_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string;
          quantity_delta?: number;
          reason?: string;
          created_by_user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_inventory_adjustments_edition_id_fkey";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "book_editions";
            referencedColumns: ["id"];
          },
        ];
      };
      book_promotions: {
        Row: {
          id: string;
          code: string;
          name: Json;
          discount_type: "fixed-vnd" | "percentage";
          amount_vnd: number | null;
          percentage_basis_points: number | null;
          starts_at: string;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: Json;
          discount_type: "fixed-vnd" | "percentage";
          amount_vnd?: number | null;
          percentage_basis_points?: number | null;
          starts_at: string;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: Json;
          discount_type?: "fixed-vnd" | "percentage";
          amount_vnd?: number | null;
          percentage_basis_points?: number | null;
          starts_at?: string;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          customer_id: string | null;
          shipping_address_json: Json | null;
          payment_method: string;
          payment_status: string;
          shipping_method: string;
          shipping_status: ShippingStatus;
          internal_notes: string;
          currency: "VND";
          discount_total_vnd: number;
          shipping_fee_vnd: number;
          tax_total_vnd: number;
          payment_fee_vnd: number;
          tax_estimates: Json;
          fee_estimates: Json;
          display_estimate: Json | null;
          promotion_code: string | null;
          total_vnd: number;
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
          customer_id?: string | null;
          shipping_address_json?: Json | null;
          payment_method?: string;
          payment_status?: string;
          shipping_method?: string;
          shipping_status?: ShippingStatus;
          internal_notes?: string;
          currency?: "VND";
          discount_total_vnd?: number;
          shipping_fee_vnd?: number;
          tax_total_vnd?: number;
          payment_fee_vnd?: number;
          tax_estimates?: Json;
          fee_estimates?: Json;
          display_estimate?: Json | null;
          promotion_code?: string | null;
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
          customer_id?: string | null;
          shipping_address_json?: Json | null;
          payment_method?: string;
          payment_status?: string;
          shipping_method?: string;
          shipping_status?: ShippingStatus;
          internal_notes?: string;
          currency?: "VND";
          discount_total_vnd?: number;
          shipping_fee_vnd?: number;
          tax_total_vnd?: number;
          payment_fee_vnd?: number;
          tax_estimates?: Json;
          fee_estimates?: Json;
          display_estimate?: Json | null;
          promotion_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          book_edition_id: string | null;
          book_work_id: string | null;
          edition_title: string | null;
          edition_language: EditionLanguage | null;
          edition_format: BookFormat | null;
          unit_price_vnd: number | null;
          line_total_vnd: number | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          book_edition_id?: string | null;
          book_work_id?: string | null;
          edition_title?: string | null;
          edition_language?: EditionLanguage | null;
          edition_format?: BookFormat | null;
          unit_price_vnd?: number | null;
          line_total_vnd?: number | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          book_edition_id?: string | null;
          book_work_id?: string | null;
          edition_title?: string | null;
          edition_language?: EditionLanguage | null;
          edition_format?: BookFormat | null;
          unit_price_vnd?: number | null;
          line_total_vnd?: number | null;
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
          {
            foreignKeyName: "order_items_book_edition_id_fkey";
            columns: ["book_edition_id"];
            isOneToOne: false;
            referencedRelation: "book_editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_book_work_id_fkey";
            columns: ["book_work_id"];
            isOneToOne: false;
            referencedRelation: "book_works";
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
      create_book_order_with_items: {
        Args: {
          p_order_code: string;
          p_customer_id: string;
          p_customer_name: string;
          p_customer_email: string;
          p_customer_phone: string;
          p_shipping_address: Json;
          p_shipping_method: string;
          p_payment_method: string;
          p_discount_total_vnd: number;
          p_shipping_fee_vnd: number;
          p_tax_total_vnd: number;
          p_payment_fee_vnd: number;
          p_tax_estimates: Json;
          p_fee_estimates: Json;
          p_display_estimate: Json | null;
          p_promotion_code: string | null;
          p_items: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      order_status: OrderStatus;
      book_edition_language: EditionLanguage;
      book_format: BookFormat;
      inventory_status: InventoryStatus;
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
