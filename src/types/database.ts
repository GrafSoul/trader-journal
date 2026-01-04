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
          display_name: string | null;
          base_currency: string;
          timezone: string;
          risk_default_percent: number | null;
          risk_default_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          base_currency?: string;
          timezone?: string;
          risk_default_percent?: number | null;
          risk_default_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          base_currency?: string;
          timezone?: string;
          risk_default_percent?: number | null;
          risk_default_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          market: 'forex' | 'crypto' | 'stocks' | 'futures' | 'options' | 'other';
          symbol: string;
          side: 'long' | 'short';
          status: 'planned' | 'opened' | 'closed' | 'canceled';
          open_time: string | null;
          close_time: string | null;
          entry: number | null;
          stop_loss: number | null;
          take_profit: number | null;
          exit_price: number | null;
          volume: number;
          volume_type: 'lots' | 'units' | 'contracts';
          commission: number | null;
          swap: number | null;
          risk_percent: number | null;
          risk_amount: number | null;
          pnl: number | null;
          pnl_percent: number | null;
          r_multiple: number | null;
          strategy: string | null;
          setup: string | null;
          entry_reason: string | null;
          exit_reason: string | null;
          notes: string | null;
          emotions: string | null;
          external_id: string | null;
          import_source: string | null;
          // Market-specific fields
          fee: number | null;
          leverage: number | null;
          funding_rate: number | null;
          shares: number | null;
          dividend: number | null;
          contracts: number | null;
          expiration_date: string | null;
          margin: number | null;
          option_type: 'call' | 'put' | null;
          strike_price: number | null;
          premium: number | null;
          pip_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          market?: 'forex' | 'crypto' | 'stocks' | 'futures' | 'options' | 'other';
          symbol: string;
          side: 'long' | 'short';
          status?: 'planned' | 'opened' | 'closed' | 'canceled';
          open_time?: string | null;
          close_time?: string | null;
          entry?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          exit_price?: number | null;
          volume: number;
          volume_type?: 'lots' | 'units' | 'contracts';
          commission?: number | null;
          swap?: number | null;
          risk_percent?: number | null;
          risk_amount?: number | null;
          pnl?: number | null;
          pnl_percent?: number | null;
          r_multiple?: number | null;
          strategy?: string | null;
          setup?: string | null;
          entry_reason?: string | null;
          exit_reason?: string | null;
          notes?: string | null;
          emotions?: string | null;
          external_id?: string | null;
          import_source?: string | null;
          fee?: number | null;
          leverage?: number | null;
          funding_rate?: number | null;
          shares?: number | null;
          dividend?: number | null;
          contracts?: number | null;
          expiration_date?: string | null;
          margin?: number | null;
          option_type?: 'call' | 'put' | null;
          strike_price?: number | null;
          premium?: number | null;
          pip_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          market?: 'forex' | 'crypto' | 'stocks' | 'futures' | 'options' | 'other';
          symbol?: string;
          side?: 'long' | 'short';
          status?: 'planned' | 'opened' | 'closed' | 'canceled';
          open_time?: string | null;
          close_time?: string | null;
          entry?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          exit_price?: number | null;
          volume?: number;
          volume_type?: 'lots' | 'units' | 'contracts';
          commission?: number | null;
          swap?: number | null;
          risk_percent?: number | null;
          risk_amount?: number | null;
          pnl?: number | null;
          pnl_percent?: number | null;
          r_multiple?: number | null;
          strategy?: string | null;
          setup?: string | null;
          entry_reason?: string | null;
          exit_reason?: string | null;
          notes?: string | null;
          emotions?: string | null;
          external_id?: string | null;
          import_source?: string | null;
          fee?: number | null;
          leverage?: number | null;
          funding_rate?: number | null;
          shares?: number | null;
          dividend?: number | null;
          contracts?: number | null;
          expiration_date?: string | null;
          margin?: number | null;
          option_type?: 'call' | 'put' | null;
          strike_price?: number | null;
          premium?: number | null;
          pip_value?: number | null;
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
