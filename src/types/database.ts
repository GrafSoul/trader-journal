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
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          default_currency: string;
          timezone: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          default_currency?: string;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          default_currency?: string;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          direction: 'buy' | 'sell';
          entry_price: number;
          exit_price: number | null;
          entry_date: string;
          exit_date: string | null;
          volume: number;
          profit: number | null;
          commission: number;
          swap: number;
          market_type: string;
          status: 'open' | 'closed';
          notes: string | null;
          external_id: string | null;
          import_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          direction: 'buy' | 'sell';
          entry_price: number;
          exit_price?: number | null;
          entry_date: string;
          exit_date?: string | null;
          volume: number;
          profit?: number | null;
          commission?: number;
          swap?: number;
          market_type?: string;
          status?: 'open' | 'closed';
          notes?: string | null;
          external_id?: string | null;
          import_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          direction?: 'buy' | 'sell';
          entry_price?: number;
          exit_price?: number | null;
          entry_date?: string;
          exit_date?: string | null;
          volume?: number;
          profit?: number | null;
          commission?: number;
          swap?: number;
          market_type?: string;
          status?: 'open' | 'closed';
          notes?: string | null;
          external_id?: string | null;
          import_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trade_tags: {
        Row: {
          id: string;
          trade_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          tag: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trade_id?: string;
          tag?: string;
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
