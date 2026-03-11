// src/lib/database.types.ts
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
          user_id: string;
          email: string | null;
          display_name: string | null;
          phone: string | null;
          role: 'super_admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          display_name?: string | null;
          phone?: string | null;
          role?: 'super_admin' | 'user';
        };
        Update: {
          user_id?: string;
          email?: string | null;
          display_name?: string | null;
          phone?: string | null;
          role?: 'super_admin' | 'user';
        };
        Relationships: [];
      };

      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          property_type: string;
          status: string;
          price: number;
          currency: string;
          location: string;
          city: string;
          district: string | null;
          area: number;
          net_area: number | null;
          gross_area: number | null;
          rooms: number;
          bathrooms: number;
          floor: number | null;
          total_floors: number | null;
          building_age: number | null;
          heating: string | null;
          dues: number | null;
          frontage: string | null;
          deed_status: string | null;
          usage_status: string | null;
          in_site: boolean;
          site_name: string | null;
          balcony_count: number | null;
          pool: boolean;
          security: boolean;
          furnished: boolean;
          parking: boolean;
          elevator: boolean;
          balcony: boolean;
          garden: boolean;
          images: string[];
          moderation_status: string;
          approved_at: string | null;
          approved_by: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          featured: boolean;
          views: number;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          title: string;
          description: string;
          property_type: string;
          status: string;
          price: number;
          currency: string;
          location: string;
          city: string;
          district?: string | null;
          area: number;
          net_area?: number | null;
          gross_area?: number | null;
          rooms: number;
          bathrooms: number;
          floor?: number | null;
          total_floors?: number | null;
          building_age?: number | null;
          heating?: string | null;
          dues?: number | null;
          frontage?: string | null;
          deed_status?: string | null;
          usage_status?: string | null;
          in_site?: boolean;
          site_name?: string | null;
          balcony_count?: number | null;
          pool?: boolean;
          security?: boolean;
          furnished?: boolean;
          parking?: boolean;
          elevator?: boolean;
          balcony?: boolean;
          garden?: boolean;
          images?: string[];
          moderation_status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          featured?: boolean;
          user_id?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          property_type?: string;
          status?: string;
          price?: number;
          currency?: string;
          location?: string;
          city?: string;
          district?: string | null;
          area?: number;
          net_area?: number | null;
          gross_area?: number | null;
          rooms?: number;
          bathrooms?: number;
          floor?: number | null;
          total_floors?: number | null;
          building_age?: number | null;
          heating?: string | null;
          dues?: number | null;
          frontage?: string | null;
          deed_status?: string | null;
          usage_status?: string | null;
          in_site?: boolean;
          site_name?: string | null;
          balcony_count?: number | null;
          pool?: boolean;
          security?: boolean;
          furnished?: boolean;
          parking?: boolean;
          elevator?: boolean;
          balcony?: boolean;
          garden?: boolean;
          images?: string[];
          moderation_status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          featured?: boolean;
          views?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };

      inquiries: {
        Row: {
          id: string;
          property_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          property_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          status?: string;
        };
        Update: {
          property_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          message?: string;
          status?: string;
        };
        Relationships: [];
      };

      vehicles: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: string;
          price: number;
          currency: string;
          location: string;
          city: string;
          district: string | null;
          brand: string;
          model: string;
          year: number;
          km: number;
          transmission: string;
          fuel: string;
          body_type: string | null;
          color: string | null;
          engine: string | null;
          engine_power_hp: number | null;
          drive_type: string | null;
          doors: number | null;
          seats: number | null;
          damage_status: string | null;
          swap_available: boolean;
          images: string[];
          moderation_status: string;
          approved_at: string | null;
          approved_by: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          featured: boolean;
          views: number;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          title: string;
          description: string;
          status: string;
          price: number;
          currency: string;
          location: string;
          city: string;
          district?: string | null;
          brand: string;
          model: string;
          year: number;
          km: number;
          transmission: string;
          fuel: string;
          body_type?: string | null;
          color?: string | null;
          engine?: string | null;
          engine_power_hp?: number | null;
          drive_type?: string | null;
          doors?: number | null;
          seats?: number | null;
          damage_status?: string | null;
          swap_available?: boolean;
          images?: string[];
          moderation_status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          featured?: boolean;
          user_id?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          status?: string;
          price?: number;
          currency?: string;
          location?: string;
          city?: string;
          district?: string | null;
          brand?: string;
          model?: string;
          year?: number;
          km?: number;
          transmission?: string;
          fuel?: string;
          body_type?: string | null;
          color?: string | null;
          engine?: string | null;
          engine_power_hp?: number | null;
          drive_type?: string | null;
          doors?: number | null;
          seats?: number | null;
          damage_status?: string | null;
          swap_available?: boolean;
          images?: string[];
          moderation_status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          featured?: boolean;
          views?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };

      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          cover_image: string | null;
          seo_description: string | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          slug: string;
          content: string;
          cover_image?: string | null;
          seo_description?: string | null;
          published?: boolean;
        };
        Update: {
          title?: string;
          slug?: string;
          content?: string;
          cover_image?: string | null;
          seo_description?: string | null;
          published?: boolean;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Property = Database['public']['Tables']['properties']['Row'];
export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export type Inquiry = Database['public']['Tables']['inquiries']['Row'];
export type InquiryInsert = Database['public']['Tables']['inquiries']['Insert'];
export type InquiryUpdate = Database['public']['Tables']['inquiries']['Update'];

export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];
export type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];