import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Spinner, Button } from "@heroui/react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Percent,
  Trophy,
  AlertTriangle,
  DollarSign,
  Plus,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboardStats } from "@/services/statsService";
import { fetchTrades } from "@/services/tradeService";
import { Statuses } from "@/store/statuses/statuses";
import { TradeCard } from "@/components/trades/TradeCard";

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { dashboard, status: statsStatus } = useAppSelector(
    (state) => state.stats
  );
  const { trades, status: tradesStatus } = useAppSelector(
    (state) => state.trades
  );

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchTrades(undefined));
  }, [dispatch]);

  const isLoading =
    statsStatus === Statuses.LOADING || tradesStatus === Statuses.LOADING;

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    const sign = value >= 0 ? "+" : "";
    return `${sign}$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    return `${value.toFixed(1)}%`;
  };

  const recentTrades = trades.slice(0, 5);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("dashboard.title")}</h1>

      {isLoading && !dashboard && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && !dashboard && (
        <div className="text-center py-12">
          <p className="text-default-500 mb-4">{t("trades.empty")}</p>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            onPress={() => navigate("/trades/new")}>
            {t("trades.createFirst")}
          </Button>
        </div>
      )}

      {dashboard && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total P&L */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    dashboard.net_pnl >= 0 ? "bg-success/10" : "bg-danger/10"
                  }`}>
                  {dashboard.net_pnl >= 0 ? (
                    <TrendingUp size={24} className="text-success" />
                  ) : (
                    <TrendingDown size={24} className="text-danger" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-default-500">
                    {t("dashboard.totalPnl")}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      dashboard.net_pnl >= 0 ? "text-success" : "text-danger"
                    }`}>
                    {formatCurrency(dashboard.net_pnl)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Win Rate */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Target size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">
                    {t("dashboard.winRate")}
                  </p>
                  <p className="text-xl font-bold">
                    {formatPercent(dashboard.win_rate)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Total Trades */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <BarChart3 size={24} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">
                    {t("dashboard.totalTrades")}
                  </p>
                  <p className="text-xl font-bold">{dashboard.total_trades}</p>
                </div>
              </CardBody>
            </Card>

            {/* Profit Factor */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Percent size={24} className="text-warning" />
                </div>
                <div>
                  <p className="text-sm text-default-500">
                    {t("dashboard.profitFactor")}
                  </p>
                  <p className="text-xl font-bold">
                    {dashboard.profit_factor?.toFixed(2) || "-"}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Best Trade */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Trophy size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-xs text-default-500">
                    {t("dashboard.bestTrade")}
                  </p>
                  <p className="text-lg font-semibold text-success">
                    {formatCurrency(dashboard.best_trade)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Worst Trade */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                  <AlertTriangle size={20} className="text-danger" />
                </div>
                <div>
                  <p className="text-xs text-default-500">
                    {t("dashboard.worstTrade")}
                  </p>
                  <p className="text-lg font-semibold text-danger">
                    {formatCurrency(dashboard.worst_trade)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Average Win */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <DollarSign size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-xs text-default-500">
                    {t("dashboard.avgWin")}
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(dashboard.avg_win)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Average Loss */}
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                  <DollarSign size={20} className="text-danger" />
                </div>
                <div>
                  <p className="text-xs text-default-500">
                    {t("dashboard.avgLoss")}
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(dashboard.avg_loss)}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* Recent Trades */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("dashboard.recentTrades")}</h2>
        {trades.length > 0 && (
          <Button variant="light" size="sm" onPress={() => navigate("/trades")}>
            {t("common.viewAll")}
          </Button>
        )}
      </div>

      {recentTrades.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-default-500 mb-4">{t("trades.empty")}</p>
            <Button
              color="primary"
              variant="flat"
              startContent={<Plus size={18} />}
              onPress={() => navigate("/trades/new")}>
              {t("trades.createFirst")}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {recentTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
