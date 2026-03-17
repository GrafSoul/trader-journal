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

interface TradeDurationChartProps {
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

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const DURATION_BUCKETS = [
  { label: "<1h", minMs: 0, maxMs: HOUR },
  { label: "1-4h", minMs: HOUR, maxMs: 4 * HOUR },
  { label: "4-12h", minMs: 4 * HOUR, maxMs: 12 * HOUR },
  { label: "12h-1d", minMs: 12 * HOUR, maxMs: DAY },
  { label: "1-3d", minMs: DAY, maxMs: 3 * DAY },
  { label: "3-7d", minMs: 3 * DAY, maxMs: 7 * DAY },
  { label: ">7d", minMs: 7 * DAY, maxMs: Infinity },
];

export const TradeDurationChart = ({ trades }: TradeDurationChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const validTrades = trades.filter(
      (tr) => tr.status === "closed" && tr.open_time && tr.close_time && tr.pnl !== null
    );

    if (validTrades.length < 2) return [];

    const buckets = DURATION_BUCKETS.map((b) => ({
      label: b.label,
      count: 0,
      totalPnl: 0,
      avgPnl: 0,
      minMs: b.minMs,
      maxMs: b.maxMs,
    }));

    for (const tr of validTrades) {
      const durationMs = new Date(tr.close_time!).getTime() - new Date(tr.open_time!).getTime();
      if (durationMs < 0) continue;

      const bucket = buckets.find((b) => durationMs >= b.minMs && durationMs < b.maxMs);
      if (bucket) {
        bucket.count += 1;
        bucket.totalPnl += tr.pnl!;
      }
    }

    return buckets
      .filter((b) => b.count > 0)
      .map((b) => ({
        label: b.label,
        count: b.count,
        avgPnl: Math.round((b.totalPnl / b.count) * 100) / 100,
      }));
  }, [trades]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.tradeDuration")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                allowDecimals={false}
                width={35}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: "hsl(var(--heroui-default-100))", fillOpacity: 0.3 }}
                formatter={(value, _name, props) => {
                  const { avgPnl } = props.payload as { avgPnl: number };
                  return [
                    `${String(value)} ${t("dashboard.weekdayTrades")} (avg $${avgPnl.toFixed(2)})`,
                    t("dashboard.tradeDuration"),
                  ];
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
