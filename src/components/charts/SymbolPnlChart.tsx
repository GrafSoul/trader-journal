import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import type { Trade } from "@/types/trade";

interface SymbolPnlChartProps {
  trades: Trade[];
}

export const SymbolPnlChart = ({ trades }: SymbolPnlChartProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const symbolMap = new Map<string, { pnl: number; count: number }>();

    for (const tr of trades) {
      if (!tr.symbol || tr.status !== "closed" || tr.pnl === null) continue;
      const entry = symbolMap.get(tr.symbol) || { pnl: 0, count: 0 };
      entry.pnl += tr.pnl;
      entry.count += 1;
      symbolMap.set(tr.symbol, entry);
    }

    return Array.from(symbolMap.entries())
      .map(([symbol, { pnl, count }]) => ({
        symbol,
        pnl: Math.round(pnl * 100) / 100,
        count,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);
  }, [trades]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.symbolPnl")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 5, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                tickFormatter={(v: number) => `$${v}`}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--heroui-content1))",
                  border: "1px solid hsl(var(--heroui-divider))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value, _name, props) => {
                  const count = (props.payload as { count: number }).count;
                  return [`$${Number(value).toFixed(2)} (${count} ${t("dashboard.weekdayTrades")})`, "P&L"];
                }}
              />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.pnl >= 0 ? "#17c964" : "#f31260"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
