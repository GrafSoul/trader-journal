import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Spinner,
  Select,
  SelectItem,
  Pagination,
  Tabs,
  Tab,
  Input,
  DateRangePicker,
  Chip,
} from "@heroui/react";
import type { RangeValue } from "@react-types/shared";
import { today, getLocalTimeZone, startOfWeek, startOfMonth, startOfYear, type DateValue } from "@internationalized/date";
import { useLocale } from "@react-aria/i18n";
import { Plus, X, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrades } from "@/services/tradeService";
import { Statuses } from "@/store/statuses/statuses";
import type { Trade, PnlFilter } from "@/types/trade";
import { TradeCard } from "@/components/trades/TradeCard";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEBOUNCE_MS = 400;

const columnHelper = createColumnHelper<Trade>();

// Pure format helpers
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
};

const formatPrice = (price: number | null) => {
  if (price === null) return "—";
  return price >= 1 ? price.toFixed(2) : price.toPrecision(5);
};

const formatPnl = (pnl: number | null) => {
  if (pnl === null) return "—";
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}$${pnl.toFixed(2)}`;
};

type DatePreset = "day" | "week" | "month" | "year" | null;

const TradesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { locale } = useLocale();
  const { trades, status, error } = useAppSelector((state) => state.trades);

  // Filters
  const [pnlFilter, setPnlFilter] = useState<PnlFilter>("all");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>(null);
  const [activePreset, setActivePreset] = useState<DatePreset>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // TanStack sorting
  const [sorting, setSorting] = useState<SortingState>([
    { id: "close_time", desc: true },
  ]);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  // Date presets
  const applyPreset = (preset: DatePreset) => {
    if (preset === activePreset) {
      setActivePreset(null);
      setDateRange(null);
      return;
    }
    setActivePreset(preset);
    const tz = getLocalTimeZone();
    const now = today(tz);
    let start: DateValue;
    switch (preset) {
      case "day":
        start = now;
        break;
      case "week":
        start = startOfWeek(now, locale);
        break;
      case "month":
        start = startOfMonth(now);
        break;
      case "year":
        start = startOfYear(now);
        break;
      default:
        return;
    }
    setDateRange({ start, end: now });
  };

  // Fetch all trades once
  useEffect(() => {
    dispatch(fetchTrades(undefined));
  }, [dispatch]);

  // Known symbols/markets from loaded trades
  const knownSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const trade of trades) if (trade.symbol) set.add(trade.symbol);
    return Array.from(set).sort();
  }, [trades]);

  const knownMarkets = useMemo(() => {
    const set = new Set<string>();
    for (const trade of trades) if (trade.market) set.add(trade.market);
    return Array.from(set).sort();
  }, [trades]);

  // Client-side filtering
  const filteredTrades = useMemo(() => {
    let result = trades;

    if (pnlFilter === "profit") result = result.filter((tr) => tr.pnl !== null && tr.pnl > 0);
    if (pnlFilter === "loss") result = result.filter((tr) => tr.pnl !== null && tr.pnl < 0);
    if (symbolFilter) result = result.filter((tr) => tr.symbol === symbolFilter);
    if (marketFilter) result = result.filter((tr) => tr.market === marketFilter);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (tr) =>
          tr.symbol?.toLowerCase().includes(q) ||
          tr.strategy?.toLowerCase().includes(q) ||
          tr.notes?.toLowerCase().includes(q)
      );
    }

    if (dateRange) {
      const start = dateRange.start.toString();
      const end = dateRange.end.toString() + "T23:59:59";
      result = result.filter((tr) => {
        const d = tr.close_time || tr.open_time;
        if (!d) return false;
        return d >= start && d <= end;
      });
    }

    return result;
  }, [trades, pnlFilter, symbolFilter, marketFilter, debouncedSearch, dateRange]);

  // TanStack Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor("symbol", {
        header: t("trades.fields.symbol"),
        cell: (info) => (
          <div>
            <span className="font-semibold">{info.getValue()}</span>
            <span className="block text-xs text-default-400">
              {t(`trades.market.${info.row.original.market}`)}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("side", {
        header: t("trades.fields.side"),
        cell: (info) => {
          const side = info.getValue();
          if (!side) return "—";
          return (
            <Chip size="sm" color={side === "long" ? "success" : "danger"} variant="flat">
              {t(`trades.side.${side}`)}
            </Chip>
          );
        },
      }),
      columnHelper.accessor("close_time", {
        header: t("trades.fields.closeTime"),
        cell: (info) => <span className="text-sm whitespace-nowrap">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor("entry", {
        header: t("trades.fields.entry"),
        cell: (info) => <span className="text-sm tabular-nums">{formatPrice(info.getValue())}</span>,
      }),
      columnHelper.accessor("exit_price", {
        header: t("trades.fields.exitPrice"),
        cell: (info) => <span className="text-sm tabular-nums">{formatPrice(info.getValue())}</span>,
      }),
      columnHelper.accessor("volume", {
        header: t("trades.fields.volume"),
        cell: (info) => {
          const v = info.getValue();
          if (v === null) return "—";
          return (
            <span className="text-sm tabular-nums">
              {v}
            </span>
          );
        },
      }),
      columnHelper.accessor("pnl", {
        header: t("trades.fields.pnl"),
        cell: (info) => {
          const pnl = info.getValue();
          const isProfit = pnl !== null && pnl > 0;
          const isLoss = pnl !== null && pnl < 0;
          return (
            <span
              className={`font-semibold tabular-nums whitespace-nowrap ${
                isProfit ? "text-success" : isLoss ? "text-danger" : "text-default-500"
              }`}>
              {formatPnl(pnl)}
            </span>
          );
        },
      }),
      columnHelper.accessor("strategy", {
        header: t("trades.fields.strategy"),
        cell: (info) => {
          const v = info.getValue();
          if (!v) return "—";
          return (
            <span className="text-sm text-default-400 truncate max-w-[150px] block">{v}</span>
          );
        },
      }),
    ],
    [t]
  );

  // TanStack Table instance
  const table = useReactTable({
    data: filteredTrades,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  const isLoading = status === Statuses.LOADING;

  const hasActiveFilters =
    pnlFilter !== "all" ||
    symbolFilter !== "" ||
    marketFilter !== "" ||
    dateRange !== null ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setPnlFilter("all");
    setSymbolFilter("");
    setMarketFilter("");
    setDateRange(null);
    setActivePreset(null);
    setSearchQuery("");
    setDebouncedSearch("");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t("trades.title")}</h1>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={() => navigate("/trades/new")}>
          {t("trades.create")}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
      )}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            size="sm"
            placeholder={t("trades.filter.searchPlaceholder")}
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search size={16} className="text-default-400" />}
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full sm:w-48"
          />

          <Select
            size="sm"
            placeholder={t("trades.fields.symbol")}
            aria-label={t("trades.fields.symbol")}
            selectedKeys={symbolFilter ? [symbolFilter] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              setSymbolFilter(val || "");
            }}
            className="w-full sm:w-40">
            {knownSymbols.map((s) => (
              <SelectItem key={s}>{s}</SelectItem>
            ))}
          </Select>

          <Select
            size="sm"
            placeholder={t("trades.fields.market")}
            aria-label={t("trades.fields.market")}
            selectedKeys={marketFilter ? [marketFilter] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              setMarketFilter(val || "");
            }}
            className="w-full sm:w-36">
            {knownMarkets.map((m) => (
              <SelectItem key={m}>{t(`trades.market.${m}`)}</SelectItem>
            ))}
          </Select>

          <DateRangePicker
            size="sm"
            aria-label={t("trades.filter.dateRange")}
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              setActivePreset(null);
            }}
            className="w-full sm:w-64"
            granularity="day"
          />

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="flat"
              color="danger"
              startContent={<X size={14} />}
              onPress={clearFilters}>
              {t("common.reset")}
            </Button>
          )}
        </div>

        <div className="flex justify-center gap-1">
          {(["day", "week", "month", "year"] as const).map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={activePreset === preset ? "solid" : "flat"}
              color={activePreset === preset ? "primary" : "default"}
              onPress={() => applyPreset(preset)}>
              {t(`trades.filter.${preset}`)}
            </Button>
          ))}
        </div>

        <Tabs
          selectedKey={pnlFilter}
          onSelectionChange={(key) => setPnlFilter(key as PnlFilter)}
          size="sm"
          variant="bordered"
          fullWidth
          classNames={{ tabList: "gap-0" }}>
          <Tab key="all" title={t("trades.filter.all")} />
          <Tab key="profit" title={t("trades.filter.profitable")} />
          <Tab key="loss" title={t("trades.filter.unprofitable")} />
        </Tabs>

        <p className="text-xs text-default-400">
          {t("trades.filter.showing", {
            shown: table.getRowModel().rows.length,
            total: filteredTrades.length,
          })}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && trades.length === 0 && !hasActiveFilters && (
        <div className="text-center py-12">
          <p className="text-default-500 mb-4">{t("trades.empty")}</p>
          <Button
            color="primary"
            variant="flat"
            startContent={<Plus size={18} />}
            onPress={() => navigate("/trades/new")}>
            {t("trades.createFirst")}
          </Button>
        </div>
      )}

      {/* Empty filtered */}
      {!isLoading && filteredTrades.length === 0 && hasActiveFilters && (
        <div className="text-center py-12">
          <p className="text-default-500 mb-4">{t("trades.filter.noResults")}</p>
          <Button variant="flat" size="sm" onPress={clearFilters}>
            {t("common.reset")}
          </Button>
        </div>
      )}

      {/* Table (desktop) + Cards (mobile) */}
      {!isLoading && filteredTrades.length > 0 && (
        <>
          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-default-200">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-default-200 bg-default-50">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2.5 text-left font-medium text-default-600 cursor-pointer select-none hover:bg-default-100 transition-colors whitespace-nowrap"
                        onClick={header.column.getToggleSortingHandler()}>
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp size={14} />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="text-default-300" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-default-100 hover:bg-default-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/trades/${row.original.id}`)}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {table.getRowModel().rows.map((row) => (
              <TradeCard key={row.id} trade={row.original} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            {table.getPageCount() > 1 && (
              <Pagination
                total={table.getPageCount()}
                page={table.getState().pagination.pageIndex + 1}
                onChange={(p) => table.setPageIndex(p - 1)}
                showControls
                size="sm"
                color="primary"
              />
            )}
            <Select
              size="sm"
              selectedKeys={[String(table.getState().pagination.pageSize)]}
              onSelectionChange={(keys) => {
                const val = Number(Array.from(keys)[0]);
                if (val) table.setPageSize(val);
              }}
              className="w-20"
              aria-label={t("trades.filter.pageSize")}>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={String(n)}>{String(n)}</SelectItem>
              ))}
            </Select>
          </div>
        </>
      )}
    </div>
  );
};

export default TradesPage;
