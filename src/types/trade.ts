import type { StatusType } from "@/store/statuses/statuses";

// ==================== ENUMS ====================
export type MarketType = "forex" | "crypto" | "stocks" | "futures" | "options" | "other";
export type TradeSide = "long" | "short";
export type TradeStatus = "planned" | "opened" | "closed" | "canceled";
export type VolumeType = "lots" | "units" | "contracts";

export type OptionType = "call" | "put";

// ==================== TRADE ====================
export interface Trade {
  id: string;
  user_id: string;
  
  // Instrument
  market: MarketType;
  symbol: string;
  side: TradeSide | null;
  status: TradeStatus;
  
  // Timing
  open_time: string | null;
  close_time: string | null;
  
  // Prices
  entry: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  exit_price: number | null;
  
  // Volume (Forex)
  volume: number | null;
  volume_type: VolumeType;
  
  // Costs
  commission: number | null;
  swap: number | null;
  
  // Risk
  risk_percent: number | null;
  risk_amount: number | null;
  
  // Results
  pnl: number | null;
  pnl_percent: number | null;
  r_multiple: number | null;
  
  // Analysis
  strategy: string | null;
  setup: string | null;
  entry_reason: string | null;
  exit_reason: string | null;
  notes: string | null;
  emotions: string | null;
  
  // External import
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
  option_type: OptionType | null;
  strike_price: number | null;
  premium: number | null;
  pip_value: number | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ==================== CREATE/UPDATE DTOs ====================
export interface CreateTradeDto {
  market: MarketType;
  symbol: string;
  side?: TradeSide | null;
  status?: TradeStatus;
  open_time?: string | null;
  close_time?: string | null;
  entry?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  exit_price?: number | null;
  volume?: number | null;
  volume_type?: VolumeType;
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
  // Market-specific
  fee?: number | null;
  leverage?: number | null;
  funding_rate?: number | null;
  shares?: number | null;
  dividend?: number | null;
  contracts?: number | null;
  expiration_date?: string | null;
  margin?: number | null;
  option_type?: OptionType | null;
  strike_price?: number | null;
  premium?: number | null;
  pip_value?: number | null;
}

export interface UpdateTradeDto extends Partial<CreateTradeDto> {
  id: string;
}

// ==================== FILTERS ====================
export interface TradeFilters {
  market?: MarketType;
  symbol?: string;
  side?: TradeSide;
  status?: TradeStatus;
  startDate?: string;
  endDate?: string;
}

// ==================== REDUX STATE ====================
export interface TradeState {
  trades: Trade[];
  selectedTrade: Trade | null;
  filters: TradeFilters;
  status: StatusType;
  error: string | null;
}
