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
import {
  detectTradingSession,
  SESSION_ORDER,
  SESSION_COLORS,
  type TradingSessionName,
} from "@/utils/tradingSessions";

interface SessionPnlChartProps {
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

interface SessionData {
  session: TradingSessionName;
  label: string;
  totalPnl: number;
  avgPnl: number;
  count: number;
  winRate: number;
}

export const SessionPnlChart = ({ trades }: SessionPnlChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const buckets = new Map<
      TradingSessionName,
      { totalPnl: number; count: number; wins: number }
    >();

    for (const tr of trades) {
      if (tr.status !== "closed" || !tr.close_time || tr.pnl === null) continue;
      const session = detectTradingSession(tr.close_time);
      const bucket = buckets.get(session) || {
        totalPnl: 0,
        count: 0,
        wins: 0,
      };
      bucket.totalPnl += tr.pnl;
      bucket.count += 1;
      if (tr.pnl > 0) bucket.wins += 1;
      buckets.set(session, bucket);
    }

    const result: SessionData[] = [];
    for (const name of SESSION_ORDER) {
      const bucket = buckets.get(name);
      if (!bucket || bucket.count === 0) continue;
      result.push({
        session: name,
        label: t(`dashboard.sessions.${name}`),
        totalPnl: Math.round(bucket.totalPnl * 100) / 100,
        avgPnl: Math.round((bucket.totalPnl / bucket.count) * 100) / 100,
        count: bucket.count,
        winRate: Math.round((bucket.wins / bucket.count) * 100),
      });
    }
    return result;
  }, [trades, t]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">
          {t("dashboard.sessionPnl")}
        </h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart
              width={width}
              height={height}
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--heroui-default-200))"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--heroui-default-500))",
                }}
                tickFormatter={(v: number) => `$${v}`}
                width={70}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{
                  fill: "hsl(var(--heroui-default-100))",
                  fillOpacity: 0.3,
                }}
                formatter={(value, _name, props) => {
                  const entry = props.payload as SessionData;
                  return [
                    `$${Number(value).toFixed(2)} (${entry.count} ${t("dashboard.sessionTrades")}, WR: ${entry.winRate}%)`,
                    t("dashboard.sessionAvgPnl"),
                  ];
                }}
              />
              <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={SESSION_COLORS[entry.session]}
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
