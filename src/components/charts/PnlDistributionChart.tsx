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

interface PnlDistributionChartProps {
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

export const PnlDistributionChart = ({ trades }: PnlDistributionChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const pnls = trades
      .filter((tr) => tr.status === "closed" && tr.pnl !== null)
      .map((tr) => tr.pnl!);

    if (pnls.length < 3) return [];

    const min = Math.min(...pnls);
    const max = Math.max(...pnls);
    const range = max - min;
    if (range === 0) return [];

    const bucketCount = Math.min(15, Math.max(5, Math.ceil(Math.sqrt(pnls.length))));
    const bucketSize = range / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const from = min + i * bucketSize;
      const to = from + bucketSize;
      return {
        label: `${from >= 0 ? "+" : ""}${Math.round(from)}`,
        from,
        to,
        count: 0,
        midpoint: (from + to) / 2,
      };
    });

    for (const pnl of pnls) {
      const idx = Math.min(
        Math.floor((pnl - min) / bucketSize),
        bucketCount - 1
      );
      buckets[idx].count++;
    }

    return buckets.filter((b) => b.count > 0);
  }, [trades]);

  if (data.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.pnlDistribution")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--heroui-default-500))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                allowDecimals={false}
                width={35}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: "hsl(var(--heroui-default-100))", fillOpacity: 0.3 }}
                formatter={(value) => [String(value), t("dashboard.totalTrades")]}
                labelFormatter={(label) => `P&L: ${label}`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.midpoint >= 0 ? "#17c964" : "#f31260"}
                    fillOpacity={0.8}
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
