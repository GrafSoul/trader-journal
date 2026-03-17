import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ChartContainer } from "./ChartContainer";
import type { Trade } from "@/types/trade";

interface CumulativeWinRateChartProps {
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

export const CumulativeWinRateChart = ({ trades }: CumulativeWinRateChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const closedTrades = trades
      .filter((tr) => tr.status === "closed" && tr.close_time && tr.pnl !== null)
      .sort((a, b) => (a.close_time! > b.close_time! ? 1 : -1));

    if (closedTrades.length < 2) return [];

    let wins = 0;
    let total = 0;

    return closedTrades.map((tr) => {
      total += 1;
      if (tr.pnl! > 0) wins += 1;
      return {
        date: tr.close_time!.slice(0, 10),
        winRate: Math.round((wins / total) * 10000) / 100,
        tradeNum: total,
      };
    });
  }, [trades]);

  if (data.length < 2) return null;

  const lastWinRate = data[data.length - 1].winRate;
  const lineColor = lastWinRate >= 50 ? "#17c964" : "#f31260";

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.cumulativeWinRate")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 100]}
                width={50}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{ stroke: "hsl(var(--heroui-default-400))", strokeWidth: 1 }}
                formatter={(value, _name, props) => {
                  const tradeNum = (props.payload as { tradeNum: number }).tradeNum;
                  return [`${Number(value).toFixed(1)}% (${tradeNum} ${t("dashboard.weekdayTrades")})`, t("dashboard.cumulativeWinRate")];
                }}
                labelFormatter={(label) => String(label)}
              />
              <ReferenceLine
                y={50}
                stroke="hsl(var(--heroui-default-400))"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          )}
        </ChartContainer>
      </CardBody>
    </Card>
  );
};
