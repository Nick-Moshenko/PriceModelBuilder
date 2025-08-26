import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      units: {
        Row: {
          id: string;
          project_id: string;
          floor: string;
          unit_number: string;
          plan_type: string;
          sqft: number;
          base_price_per_sqft: number;
          orientation: string;
          outdoor_sqft: number;
          bedrooms: number;
          bathrooms: number;
          base_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          floor: string;
          unit_number: string;
          plan_type: string;
          sqft: number;
          base_price_per_sqft: number;
          orientation: string;
          outdoor_sqft?: number;
          bedrooms: number;
          bathrooms: number;
          base_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          floor?: string;
          unit_number?: string;
          plan_type?: string;
          sqft?: number;
          base_price_per_sqft?: number;
          orientation?: string;
          outdoor_sqft?: number;
          bedrooms?: number;
          bathrooms?: number;
          base_price?: number;
          updated_at?: string;
        };
      };
      scenarios: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          version: string;
          created_by: string;
          is_baseline: boolean;
          global_settings: any;
          list_pricing: any;
          base_pricing_mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          version?: string;
          created_by: string;
          is_baseline?: boolean;
          global_settings?: any;
          list_pricing?: any;
          base_pricing_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          version?: string;
          created_by?: string;
          is_baseline?: boolean;
          global_settings?: any;
          list_pricing?: any;
          base_pricing_mode?: string;
          updated_at?: string;
        };
      };
      rules: {
        Row: {
          id: string;
          scenario_id: string;
          name: string;
          enabled: boolean;
          order_index: number;
          criteria: any;
          adjustment: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          scenario_id: string;
          name: string;
          enabled?: boolean;
          order_index?: number;
          criteria?: any;
          adjustment: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          scenario_id?: string;
          name?: string;
          enabled?: boolean;
          order_index?: number;
          criteria?: any;
          adjustment?: any;
        };
      };
      unit_prices: {
        Row: {
          id: string;
          scenario_id: string;
          unit_id: string;
          final_price: number;
          final_price_per_sqft: number;
          premiums: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scenario_id: string;
          unit_id: string;
          final_price: number;
          final_price_per_sqft: number;
          premiums?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scenario_id?: string;
          unit_id?: string;
          final_price?: number;
          final_price_per_sqft?: number;
          premiums?: any;
          updated_at?: string;
        };
      };
    };
  };
}