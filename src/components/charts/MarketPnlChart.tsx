import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ChartContainer } from "./ChartContainer";
import type { Trade, MarketType } from "@/types/trade";

interface MarketPnlChartProps {
  trades: Trade[];
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(var(--heroui-content1))",
    border: "1px solid hsl(var(--heroui-divider))",
    borderRadius: "8px",
    fontSize: "13px",
    color: "hsl(var(--heroui-foreground))",
  },
  labelStyle: { color: "hsl(var(--heroui-default-600))" },
  itemStyle: { color: "hsl(var(--heroui-foreground))" },
};

const MARKET_ORDER: MarketType[] = ["forex", "crypto", "stocks", "futures", "options", "other"];

export const MarketPnlChart = ({ trades }: MarketPnlChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const marketMap = new Map<MarketType, { pnl: number; count: number }>();

    for (const tr of trades) {
      if (tr.status !== "closed" || !tr.close_time || tr.pnl === null) continue;
      const market = tr.market;
      const entry = marketMap.get(market) || { pnl: 0, count: 0 };
      entry.pnl += tr.pnl;
      entry.count += 1;
      marketMap.set(market, entry);
    }

    return MARKET_ORDER
      .filter((market) => marketMap.has(market))
      .map((market) => {
        const { pnl, count } = marketMap.get(market)!;
        return {
          market: t(`trades.market.${market}`),
          pnl: Math.round(pnl * 100) / 100,
          count,
        };
      });
  }, [trades, t]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.marketPnl")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="market"
                tick={{ fontSize: 12, fill: "hsl(var(--heroui-default-500))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                tickFormatter={(v: number) => `$${v}`}
                width={70}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: "hsl(var(--heroui-default-100))", fillOpacity: 0.3 }}
                formatter={(value, _name, props) => {
                  const count = (props.payload as { count: number }).count;
                  return [`$${Number(value).toFixed(2)} (${count} ${t("dashboard.weekdayTrades")})`, "P&L"];
                }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.pnl >= 0 ? "#17c964" : "#f31260"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ChartContainer>
      </CardBody>
    </Card>
  );
};
