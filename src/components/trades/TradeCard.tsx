import { Card, CardBody, Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import type { Trade } from "@/types/trade";

interface TradeCardProps {
  trade: Trade;
}

export const TradeCard = ({ trade }: TradeCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isProfit = trade.pnl !== null && trade.pnl > 0;
  const isLoss = trade.pnl !== null && trade.pnl < 0;

  const statusColors: Record<
    string,
    "default" | "primary" | "success" | "warning" | "danger"
  > = {
    planned: "default",
    opened: "primary",
    closed: "success",
    canceled: "warning",
  };

  const sideColors: Record<string, "success" | "danger"> = {
    long: "success",
    short: "danger",
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const formatPnl = (pnl: number | null) => {
    if (pnl === null) return "-";
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}$${pnl.toFixed(2)}`;
  };

  return (
    <Card
      isPressable
      onPress={() => navigate(`/trades/${trade.id}`)}
      className="hover:shadow-lg transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold">{trade.symbol}</span>
              {trade.side && (
                <Chip size="sm" color={sideColors[trade.side]} variant="flat">
                  {t(`trades.side.${trade.side}`)}
                </Chip>
              )}
              <Chip size="sm" color={statusColors[trade.status]} variant="flat">
                {t(`trades.status.${trade.status}`)}
              </Chip>
            </div>

            <div className="flex items-center gap-4 text-sm text-default-500">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(trade.open_time)}</span>
              </div>
              <span>{t(`trades.market.${trade.market}`)}</span>
              <span>
                {trade.volume} {t(`trades.volumeType.${trade.volume_type}`)}
              </span>
            </div>

            {trade.strategy && (
              <div className="mt-2 text-sm text-default-400">
                {trade.strategy}
              </div>
            )}
          </div>

          <div className="text-right">
            <div
              className={`flex items-center gap-1 text-lg font-semibold ${
                isProfit
                  ? "text-success"
                  : isLoss
                  ? "text-danger"
                  : "text-default-500"
              }`}>
              {isProfit && <TrendingUp size={18} />}
              {isLoss && <TrendingDown size={18} />}
              {!isProfit && !isLoss && <DollarSign size={18} />}
              <span>{formatPnl(trade.pnl)}</span>
            </div>
            {trade.r_multiple !== null && (
              <div className="text-sm text-default-400">
                {trade.r_multiple >= 0 ? "+" : ""}
                {trade.r_multiple.toFixed(2)}R
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
