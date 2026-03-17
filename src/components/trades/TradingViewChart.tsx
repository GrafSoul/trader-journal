import { useEffect, useRef, memo } from "react";
import { useTheme } from "@/hooks/useTheme";

interface TradingViewChartProps {
  symbol: string;
  market: string;
  openTime?: string | null;
  closeTime?: string | null;
}

/**
 * Map internal symbol + market to TradingView symbol format.
 * MT5 micro-account symbols often end with "m" — strip it.
 */
const toTradingViewSymbol = (symbol: string, market: string): string => {
  // Strip trailing "m" (MT5 micro), "." suffixes, etc.
  let clean = symbol.replace(/[m.]+$/i, "").toUpperCase();

  switch (market) {
    case "forex":
      return `FX:${clean}`;
    case "crypto":
      return `BINANCE:${clean}`;
    case "stocks":
      return clean; // TradingView resolves most stock tickers
    case "futures":
      return clean;
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
  ({ symbol, market, openTime, closeTime }: TradingViewChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    const tvSymbol = toTradingViewSymbol(symbol, market);
    const interval = pickInterval(openTime, closeTime);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Clear previous widget
      container.innerHTML = "";

      const widgetDiv = document.createElement("div");
      widgetDiv.className = "tradingview-widget-container__widget";
      widgetDiv.style.height = "100%";
      widgetDiv.style.width = "100%";
      container.appendChild(widgetDiv);

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tvSymbol,
        interval: interval,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        theme: theme === "dark" ? "dark" : "light",
        style: "1",
        locale: "en",
        allow_symbol_change: true,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        calendar: false,
        support_host: "https://www.tradingview.com",
      });

      container.appendChild(script);

      return () => {
        if (container) container.innerHTML = "";
      };
    }, [tvSymbol, interval, theme]);

    return (
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: "500px", width: "100%" }}
      />
    );
  }
);

TradingViewChart.displayName = "TradingViewChart";

export default TradingViewChart;
