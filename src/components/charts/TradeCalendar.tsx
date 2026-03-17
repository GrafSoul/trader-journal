import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ChartContainer } from "./ChartContainer";
import type { Trade } from "@/types/trade";

interface TradeCalendarProps {
  trades: Trade[];
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
  highlightRange?: { start: string; end: string } | null;
}

interface DayData {
  date: string;
  totalPnl: number;
  count: number;
}

const WEEKS = 52;
const DAYS = 7;
const CELL_GAP = 3;
const LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 16;
const MIN_CELL_SIZE = 10;
const MAX_CELL_SIZE = 16;

const WEEKDAY_LABELS_IDX = [0, 2, 4]; // Mon, Wed, Fri

function getSquareColor(
  pnl: number,
  maxAbsPnl: number,
  isDark: boolean,
): string {
  if (pnl === 0 || maxAbsPnl === 0) {
    return isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.06)";
  }

  const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
  const level = Math.ceil(intensity * 4);
  const opacities = [0.25, 0.45, 0.7, 1.0];
  const opacity = opacities[Math.min(level, 4) - 1];

  if (pnl > 0) return `rgba(23, 201, 100, ${opacity})`;
  return `rgba(243, 18, 96, ${opacity})`;
}

export const TradeCalendar = ({
  trades,
  selectedDate: externalSelected,
  onSelectDate,
  highlightRange,
}: TradeCalendarProps) => {
  const { t } = useTranslation();
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: DayData;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scrolledRef = useRef(false);

  // Reset scroll flag when trades change so calendar re-scrolls
  useEffect(() => {
    scrolledRef.current = false;
  }, [trades]);

  // Use external control if provided, otherwise internal
  const selectedDate = externalSelected !== undefined ? externalSelected : internalSelected;

  // Group trades by date
  const dailyMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const tr of trades) {
      if (tr.status !== "closed" || !tr.close_time || tr.pnl === null) continue;
      const dateKey = tr.close_time.slice(0, 10);
      const existing = map.get(dateKey) || {
        date: dateKey,
        totalPnl: 0,
        count: 0,
      };
      existing.totalPnl += tr.pnl;
      existing.count += 1;
      map.set(dateKey, existing);
    }
    return map;
  }, [trades]);

  // Generate calendar grid (last 52 weeks)
  const { cells, months, maxAbsPnl } = useMemo(() => {
    const now = new Date();
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - WEEKS * 7);
    const startDay = startDate.getDay();
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const cells: Array<{
      date: string;
      col: number;
      row: number;
      pnl: number;
      count: number;
    }> = [];
    let maxAbs = 0;

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const dayOfWeek = cursor.getDay();
      const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const diffDays = Math.floor(
        (cursor.getTime() - startDate.getTime()) / 86400000,
      );
      const col = Math.floor(diffDays / 7);

      const dayData = dailyMap.get(dateStr);
      const pnl = dayData ? Math.round(dayData.totalPnl * 100) / 100 : 0;
      const count = dayData ? dayData.count : 0;

      if (Math.abs(pnl) > maxAbs) maxAbs = Math.abs(pnl);

      cells.push({ date: dateStr, col, row, pnl, count });
      cursor.setDate(cursor.getDate() + 1);
    }

    const months: Array<{ label: string; col: number }> = [];
    let lastMonth = -1;
    for (const cell of cells) {
      const m = new Date(cell.date).getMonth();
      if (m !== lastMonth && cell.row === 0) {
        const monthKey = [
          "jan", "feb", "mar", "apr", "may", "jun",
          "jul", "aug", "sep", "oct", "nov", "dec",
        ][m];
        months.push({
          label: t(`dashboard.calendarMonths.${monthKey}`),
          col: cell.col,
        });
        lastMonth = m;
      }
    }

    return { cells, months, maxAbsPnl: maxAbs };
  }, [dailyMap, t]);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const handleCellClick = useCallback(
    (date: string) => {
      const newDate = selectedDate === date ? null : date;
      if (onSelectDate) {
        onSelectDate(newDate);
      } else {
        setInternalSelected(newDate);
      }
      setTooltip(null);
    },
    [selectedDate, onSelectDate],
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGRectElement>, date: string) => {
      const dayData = dailyMap.get(date);
      if (!dayData) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 40,
        data: dayData,
      });
    },
    [dailyMap],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (cells.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <h3 className="text-lg font-semibold">
          {t("dashboard.tradeCalendar")}
        </h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ChartContainer className="h-auto min-h-[140px]">
          {({ width }) => {
            const cellSize = Math.max(
              MIN_CELL_SIZE,
              Math.min(
                MAX_CELL_SIZE,
                Math.floor((width - LABEL_WIDTH) / (WEEKS + 1)) - CELL_GAP,
              ),
            );
            const gridWidth =
              LABEL_WIDTH + (WEEKS + 1) * (cellSize + CELL_GAP);
            const gridHeight =
              MONTH_LABEL_HEIGHT + DAYS * (cellSize + CELL_GAP);

            const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

            return (
              <>
                <div
                  ref={(el) => {
                    if (el && !scrolledRef.current) {
                      requestAnimationFrame(() => {
                        el.scrollLeft = el.scrollWidth;
                      });
                      scrolledRef.current = true;
                    }
                  }}
                  className="relative overflow-x-auto"
                >
                  <svg
                    ref={svgRef}
                    width={gridWidth}
                    height={gridHeight}
                    className="select-none block mx-auto"
                  >
                    {/* Month labels */}
                    {months.map((m, i) => (
                      <text
                        key={i}
                        x={LABEL_WIDTH + m.col * (cellSize + CELL_GAP)}
                        y={MONTH_LABEL_HEIGHT - 4}
                        fontSize={10}
                        fill="hsl(var(--heroui-default-500))"
                      >
                        {m.label}
                      </text>
                    ))}

                    {/* Weekday labels */}
                    {WEEKDAY_LABELS_IDX.map((idx) => (
                      <text
                        key={idx}
                        x={0}
                        y={
                          MONTH_LABEL_HEIGHT +
                          idx * (cellSize + CELL_GAP) +
                          cellSize * 0.75
                        }
                        fontSize={10}
                        fill="hsl(var(--heroui-default-400))"
                      >
                        {t(`dashboard.weekdays.${weekdayKeys[idx]}`)}
                      </text>
                    ))}

                    {/* Cells */}
                    {cells.map((cell) => {
                      const isSelected = selectedDate === cell.date;
                      const isInRange =
                        !isSelected &&
                        highlightRange != null &&
                        cell.date >= highlightRange.start &&
                        cell.date <= highlightRange.end;

                      return (
                        <rect
                          key={cell.date}
                          x={LABEL_WIDTH + cell.col * (cellSize + CELL_GAP)}
                          y={
                            MONTH_LABEL_HEIGHT +
                            cell.row * (cellSize + CELL_GAP)
                          }
                          width={cellSize}
                          height={cellSize}
                          rx={2}
                          fill={getSquareColor(cell.pnl, maxAbsPnl, isDark)}
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          stroke={
                            isSelected
                              ? "hsl(var(--heroui-primary))"
                              : isInRange
                                ? "hsl(var(--heroui-primary) / 0.5)"
                                : "none"
                          }
                          strokeWidth={isSelected ? 2 : isInRange ? 1.5 : 0}
                          onClick={() => handleCellClick(cell.date)}
                          onMouseEnter={(e) => handleMouseEnter(e, cell.date)}
                          onMouseLeave={handleMouseLeave}
                        />
                      );
                    })}
                  </svg>

                  {/* Tooltip */}
                  {tooltip && (
                    <div
                      className="absolute pointer-events-none z-10 rounded-lg border border-divider bg-content1 px-3 py-2 text-xs shadow-md"
                      style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: "translateX(-50%)",
                      }}
                    >
                      <p className="font-semibold">{tooltip.data.date}</p>
                      <p>
                        <span
                          className={
                            tooltip.data.totalPnl >= 0
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {tooltip.data.totalPnl >= 0 ? "+" : ""}$
                          {tooltip.data.totalPnl.toFixed(2)}
                        </span>
                        {" "}
                        ({tooltip.data.count}{" "}
                        {t("dashboard.sessionTrades")})
                      </p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-default-400">
                  <span>{t("dashboard.calendarLess")}</span>
                  {[0.25, 0.45, 0.7, 1.0].map((op) => (
                    <div
                      key={`loss-${op}`}
                      className="rounded-sm"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: `rgba(243, 18, 96, ${op})`,
                      }}
                    />
                  ))}
                  <div
                    className="rounded-sm mx-0.5"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.06)",
                    }}
                  />
                  {[0.25, 0.45, 0.7, 1.0].map((op) => (
                    <div
                      key={`win-${op}`}
                      className="rounded-sm"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: `rgba(23, 201, 100, ${op})`,
                      }}
                    />
                  ))}
                  <span>{t("dashboard.calendarMore")}</span>
                </div>
              </>
            );
          }}
        </ChartContainer>
      </CardBody>
    </Card>
  );
};
