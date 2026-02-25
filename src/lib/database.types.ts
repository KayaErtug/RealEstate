export interface Database {
  public: {
    Tables: {
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
          rooms: number;
          bathrooms: number;
          floor: number | null;
          total_floors: number | null;
          building_age: number | null;
          furnished: boolean;
          parking: boolean;
          elevator: boolean;
          balcony: boolean;
          garden: boolean;
          images: string[];
          featured: boolean;
          views: number;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'updated_at' | 'views'>;
        Update: Partial<Database['public']['Tables']['properties']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['inquiries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
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
          images: string[];
          featured: boolean;
          views: number;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at' | 'views'>;
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
    };
  };
}

export type Property = Database['public']['Tables']['properties']['Row'];
export type Inquiry = Database['public']['Tables']['inquiries']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];