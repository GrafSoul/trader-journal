import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface TradingViewChartProps {
  symbol: string;
  market: string;
  side?: string | null;
  entry?: number | null;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  pnl?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
}

/**
 * Map internal symbol + market to TradingView symbol format.
 * MT5 micro-account symbols often end with "m" — strip it.
 */
const toTradingViewSymbol = (symbol: string, market: string): string => {
  const clean = symbol.replace(/[m.]+$/i, "").toUpperCase();

  switch (market) {
    case "forex":
      return `FX:${clean}`;
    case "crypto":
      return `BINANCE:${clean}`;
    case "stocks":
    case "futures":
    default:
      return clean;
  }
};

/**
 * Pick chart interval based on trade duration.
 */
const pickInterval = (
  openTime?: string | null,
  closeTime?: string | null
): string => {
  if (!openTime || !closeTime) return "D";
  const ms = new Date(closeTime).getTime() - new Date(openTime).getTime();
  const hours = ms / (1000 * 60 * 60);

  if (hours < 4) return "15";
  if (hours < 24) return "60";
  if (hours < 24 * 7) return "240";
  if (hours < 24 * 60) return "D";
  return "W";
};

const TradingViewChart = memo(
  ({
    symbol,
    market,
    side,
    entry,
    exitPrice,
    stopLoss,
    takeProfit,
    pnl,
    openTime,
    closeTime,
  }: TradingViewChartProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const tvSymbol = toTradingViewSymbol(symbol, market);
    const interval = pickInterval(openTime, closeTime);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const iframeSrc = useMemo(() => {
      const id = `tv_${Date.now()}`;
      const params = new URLSearchParams({
        frameElementId: id,
        symbol: tvSymbol,
        interval,
        timezone: tz,
        theme: theme === "dark" ? "dark" : "light",
        style: "1",
        locale: "en",
        allow_symbol_change: "1",
        save_image: "0",
        calendar: "0",
        hide_side_toolbar: "0",
        withdateranges: "1",
      });
      return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
    }, [tvSymbol, interval, tz, theme]);

    const isProfit = pnl !== null && pnl !== undefined && pnl > 0;
    const isLoss = pnl !== null && pnl !== undefined && pnl < 0;

    const formatPrice = (price: number | null | undefined) => {
      if (price === null || price === undefined) return null;
      return price.toFixed(5);
    };

    const hasTradeInfo =
      entry !== null &&
      entry !== undefined &&
      exitPrice !== null &&
      exitPrice !== undefined;

    return (
      <div>
        {/* Trade price indicators */}
        {hasTradeInfo && (
          <div className="flex items-center gap-x-4 gap-y-1 px-3 sm:px-4 py-2 sm:py-3 border-b border-default-200 text-xs sm:text-sm flex-wrap">
            {/* Side */}
            {side && (
              <div className="flex items-center gap-1">
                {side === "long" ? (
                  <ArrowUpRight size={14} className="text-success" />
                ) : (
                  <ArrowDownRight size={14} className="text-danger" />
                )}
                <span
                  className={
                    side === "long" ? "text-success font-medium" : "text-danger font-medium"
                  }
                >
                  {t(`trades.side.${side}`)}
                </span>
              </div>
            )}

            {/* Entry */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-default-500">{t("trades.fields.entry")}:</span>
              <span className="font-mono font-medium">{formatPrice(entry)}</span>
            </div>

            {/* Exit */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${isProfit ? "bg-success" : isLoss ? "bg-danger" : "bg-default-400"}`}
              />
              <span className="text-default-500">{t("trades.fields.exitPrice")}:</span>
              <span className="font-mono font-medium">{formatPrice(exitPrice)}</span>
            </div>

            {/* SL */}
            {stopLoss !== null && stopLoss !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-default-500">SL:</span>
                <span className="font-mono font-medium">{formatPrice(stopLoss)}</span>
              </div>
            )}

            {/* TP */}
            {takeProfit !== null && takeProfit !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-default-500">TP:</span>
                <span className="font-mono font-medium">{formatPrice(takeProfit)}</span>
              </div>
            )}

            {/* P&L */}
            {pnl !== null && pnl !== undefined && (
              <div
                className={`sm:ml-auto font-semibold ${
                  isProfit ? "text-success" : isLoss ? "text-danger" : "text-default-500"
                }`}
              >
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Chart iframe — h-[400px] mobile, sm:h-[700px] desktop */}
        <iframe
          src={iframeSrc}
          className="w-full border-none h-[400px] sm:h-[700px]"
          title={`TradingView ${tvSymbol}`}
        />
      </div>
    );
  }
);

TradingViewChart.displayName = "TradingViewChart";

export default TradingViewChart;
