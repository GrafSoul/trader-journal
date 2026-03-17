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

interface HourlyPnlChartProps {
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

export const HourlyPnlChart = ({ trades }: HourlyPnlChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const hourTotals = new Array(24).fill(0);
    const hourCounts = new Array(24).fill(0);

    for (const tr of trades) {
      if (tr.status !== "closed" || !tr.close_time || tr.pnl === null) continue;
      const hour = new Date(tr.close_time).getHours();
      hourTotals[hour] += tr.pnl;
      hourCounts[hour] += 1;
    }

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: String(hour).padStart(2, "0"),
      avgPnl: hourCounts[hour] > 0
        ? Math.round((hourTotals[hour] / hourCounts[hour]) * 100) / 100
        : 0,
      count: hourCounts[hour],
    })).filter((d) => d.count > 0);
  }, [trades]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.hourlyPnl")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
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
                  return [`$${Number(value).toFixed(2)} (${count} ${t("dashboard.weekdayTrades")})`, t("dashboard.avgPnl")];
                }}
                labelFormatter={(label) => `${label}:00`}
              />
              <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.avgPnl >= 0 ? "#17c964" : "#f31260"}
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
