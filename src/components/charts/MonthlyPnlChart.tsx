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
import type { Trade } from "@/types/trade";

interface MonthlyPnlChartProps {
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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MonthlyPnlChart = ({ trades }: MonthlyPnlChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const monthMap = new Map<string, { pnl: number; count: number }>();

    for (const tr of trades) {
      if (tr.status !== "closed" || !tr.close_time || tr.pnl === null) continue;
      const date = new Date(tr.close_time);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthMap.get(key) || { pnl: 0, count: 0 };
      entry.pnl += tr.pnl;
      entry.count += 1;
      monthMap.set(key, entry);
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([key, { pnl, count }]) => {
        const monthIdx = parseInt(key.slice(5, 7), 10) - 1;
        const year = key.slice(0, 4);
        return {
          label: `${MONTH_LABELS[monthIdx]} ${year}`,
          pnl: Math.round(pnl * 100) / 100,
          count,
        };
      });
  }, [trades]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.monthlyPnl")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                interval="preserveStartEnd"
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
