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

interface StreakChartProps {
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

interface Streak {
  index: number;
  length: number;
  isWin: boolean;
}

export const StreakChart = ({ trades }: StreakChartProps) => {
  const { t } = useTranslation();

  const { data, currentStreak } = useMemo(() => {
    const closedTrades = trades
      .filter((tr) => tr.status === "closed" && tr.close_time && tr.pnl !== null)
      .sort((a, b) => (a.close_time! > b.close_time! ? 1 : -1));

    if (closedTrades.length < 2) return { data: [], currentStreak: null };

    const streaks: Streak[] = [];
    let currentIsWin = closedTrades[0].pnl! > 0;
    let count = 1;

    for (let i = 1; i < closedTrades.length; i++) {
      const isWin = closedTrades[i].pnl! > 0;
      if (isWin === currentIsWin) {
        count += 1;
      } else {
        streaks.push({ index: streaks.length + 1, length: count, isWin: currentIsWin });
        currentIsWin = isWin;
        count = 1;
      }
    }
    streaks.push({ index: streaks.length + 1, length: count, isWin: currentIsWin });

    const chartData = streaks.map((s) => ({
      index: `#${s.index}`,
      value: s.isWin ? s.length : -s.length,
      isWin: s.isWin,
      length: s.length,
    }));

    const last = streaks[streaks.length - 1];
    return {
      data: chartData,
      currentStreak: { length: last.length, isWin: last.isWin },
    };
  }, [trades]);

  if (data.length < 1) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">{t("dashboard.streaks")}</h3>
        {currentStreak && (
          <span
            className="text-sm font-medium"
            style={{ color: currentStreak.isWin ? "#17c964" : "#f31260" }}
          >
            {t("dashboard.currentStreak")}: {currentStreak.length}{" "}
            {currentStreak.isWin ? t("dashboard.wins") : t("dashboard.losses")}
          </span>
        )}
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--heroui-default-500))" }}
                tickFormatter={(v: number) => String(Math.abs(v))}
                width={35}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: "hsl(var(--heroui-default-100))", fillOpacity: 0.3 }}
                formatter={(_value, _name, props) => {
                  const { isWin, length } = props.payload as { isWin: boolean; length: number };
                  const label = isWin ? t("dashboard.wins") : t("dashboard.losses");
                  return [`${length} ${label}`, t("dashboard.streaks")];
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--heroui-default-300))" strokeWidth={1} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isWin ? "#17c964" : "#f31260"}
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
