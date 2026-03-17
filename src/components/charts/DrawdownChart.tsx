import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ChartContainer } from "./ChartContainer";
import type { Trade } from "@/types/trade";

interface DrawdownChartProps {
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

export const DrawdownChart = ({ trades }: DrawdownChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const closedTrades = trades
      .filter((tr) => tr.status === "closed" && tr.close_time && tr.pnl !== null)
      .sort((a, b) => (a.close_time! > b.close_time! ? 1 : -1));

    if (closedTrades.length < 2) return [];

    let cumulative = 0;
    let peak = 0;

    return closedTrades.map((tr) => {
      cumulative += tr.pnl!;
      if (cumulative > peak) peak = cumulative;
      const drawdown = cumulative - peak;
      return {
        date: tr.close_time!.slice(0, 10),
        drawdown: Math.round(drawdown * 100) / 100,
      };
    });
  }, [trades]);

  if (data.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.drawdown")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f31260" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f31260" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                tickFormatter={(v: number) => `$${v}`}
                width={70}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{ stroke: "hsl(var(--heroui-default-400))", strokeWidth: 1 }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, t("dashboard.drawdown")]}
                labelFormatter={(label) => String(label)}
              />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#f31260"
                strokeWidth={2}
                fill="url(#drawdownGradient)"
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardBody>
    </Card>
  );
};
