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
  ReferenceLine,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ChartContainer } from "./ChartContainer";
import type { Trade } from "@/types/trade";

interface RMultipleChartProps {
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

const BUCKETS = [
  { label: "<-2R", min: -Infinity, max: -2, midpoint: -3 },
  { label: "-2R to -1R", min: -2, max: -1, midpoint: -1.5 },
  { label: "-1R to 0", min: -1, max: 0, midpoint: -0.5 },
  { label: "0 to 1R", min: 0, max: 1, midpoint: 0.5 },
  { label: "1R to 2R", min: 1, max: 2, midpoint: 1.5 },
  { label: "2R to 3R", min: 2, max: 3, midpoint: 2.5 },
  { label: ">3R", min: 3, max: Infinity, midpoint: 4 },
];

export const RMultipleChart = ({ trades }: RMultipleChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const rMultiples = trades
      .filter(
        (tr) => tr.status === "closed" && tr.close_time && tr.r_multiple !== null
      )
      .map((tr) => tr.r_multiple!);

    if (rMultiples.length < 3) return [];

    const counts = BUCKETS.map((bucket) => ({
      label: bucket.label,
      count: rMultiples.filter((r) => r >= bucket.min && r < bucket.max).length,
      midpoint: bucket.midpoint,
    }));

    return counts.filter((b) => b.count > 0);
  }, [trades]);

  if (data.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.rMultiple")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--heroui-default-500))" }}
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
                labelFormatter={(label) => `R: ${label}`}
              />
              <ReferenceLine x="0 to 1R" stroke="hsl(var(--heroui-default-400))" strokeDasharray="4 4" />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.midpoint >= 0 ? "#17c964" : "#f31260"}
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
