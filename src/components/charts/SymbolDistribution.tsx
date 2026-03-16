import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import type { Trade } from "@/types/trade";

interface SymbolDistributionProps {
  trades: Trade[];
}

const COLORS = [
  "#006FEE", "#17c964", "#f5a524", "#f31260", "#7828c8",
  "#0e8aaa", "#c4841d", "#338ef7", "#45d483", "#f871a0",
];

export const SymbolDistribution = ({ trades }: SymbolDistributionProps) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const symbolMap = new Map<string, number>();
    for (const tr of trades) {
      if (!tr.symbol) continue;
      symbolMap.set(tr.symbol, (symbolMap.get(tr.symbol) || 0) + 1);
    }

    return Array.from(symbolMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [trades]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("dashboard.symbolDistribution")}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "hsl(var(--heroui-default-400))" }}
              >
                {data.map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--heroui-content1))",
                  border: "1px solid hsl(var(--heroui-divider))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [value, t("dashboard.totalTrades")]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
