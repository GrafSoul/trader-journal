import type { StatusType } from "@/store/statuses/statuses";

export interface DashboardStats {
  total_trades: number;
  closed_trades: number;
  winning_trades: number;
  losing_trades: number;
  net_pnl: number;
  win_rate: number;
  avg_r: number;
  profit_factor: number;
  best_trade: number | null;
  worst_trade: number | null;
  avg_win: number | null;
  avg_loss: number | null;
}

export interface StatsState {
  dashboard: DashboardStats | null;
  status: StatusType;
  error: string | null;
}
