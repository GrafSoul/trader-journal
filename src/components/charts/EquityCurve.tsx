import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import type { Trade } from "@/types/trade";

interface EquityCurveProps {
  trades: Trade[];
}

export const EquityCurve = ({ trades }: EquityCurveProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const closedTrades = trades
      .filter((tr) => tr.status === "closed" && tr.close_time && tr.pnl !== null)
      .sort((a, b) => (a.close_time! > b.close_time! ? 1 : -1));

    let cumulative = 0;
    return closedTrades.map((tr) => {
      cumulative += tr.pnl!;
      return {
        date: tr.close_time!.slice(0, 10),
        pnl: Math.round(cumulative * 100) / 100,
      };
    });
  }, [trades]);

  if (data.length < 2) return null;

  const isPositive = data[data.length - 1].pnl >= 0;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.equityCurve")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#17c964" : "#f31260"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#17c964" : "#f31260"}
                    stopOpacity={0}
                  />
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
                contentStyle={{
                  backgroundColor: "hsl(var(--heroui-content1))",
                  border: "1px solid hsl(var(--heroui-divider))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                labelFormatter={(label: string) => label}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={isPositive ? "#17c964" : "#f31260"}
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
