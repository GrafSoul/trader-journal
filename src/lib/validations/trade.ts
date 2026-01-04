import { z } from "zod";

export const tradeSchema = z.object({
  // Common fields
  market: z.enum(["forex", "crypto", "stocks", "futures", "options", "other"]),
  symbol: z.string().min(1, "validation.symbolRequired").max(20),
  side: z.enum(["long", "short"]).nullable().optional(),
  status: z.enum(["planned", "opened", "closed", "canceled"]).optional(),
  open_time: z.string().nullable().optional(),
  close_time: z.string().nullable().optional(),
  entry: z.number().nullable().optional(),
  stop_loss: z.number().nullable().optional(),
  take_profit: z.number().nullable().optional(),
  exit_price: z.number().nullable().optional(),
  commission: z.number().nullable().optional(),
  risk_percent: z.number().nullable().optional(),
  risk_amount: z.number().nullable().optional(),
  pnl: z.number().nullable().optional(),
  pnl_percent: z.number().nullable().optional(),
  r_multiple: z.number().nullable().optional(),
  strategy: z.string().nullable().optional(),
  setup: z.string().nullable().optional(),
  entry_reason: z.string().nullable().optional(),
  exit_reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  emotions: z.string().nullable().optional(),
  
  // Forex-specific
  volume: z.number().nullable().optional(),
  volume_type: z.enum(["lots", "units", "contracts"]).optional(),
  swap: z.number().nullable().optional(),
  pip_value: z.number().nullable().optional(),
  
  // Crypto-specific
  fee: z.number().nullable().optional(),
  leverage: z.number().nullable().optional(),
  funding_rate: z.number().nullable().optional(),
  
  // Stocks-specific
  shares: z.number().nullable().optional(),
  dividend: z.number().nullable().optional(),
  
  // Futures-specific
  contracts: z.number().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  margin: z.number().nullable().optional(),
  
  // Options-specific
  option_type: z.enum(["call", "put"]).nullable().optional(),
  strike_price: z.number().nullable().optional(),
  premium: z.number().nullable().optional(),
});

export type TradeFormData = z.infer<typeof tradeSchema>;
