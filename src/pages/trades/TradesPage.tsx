import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Spinner } from "@heroui/react";
import { Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrades } from "@/services/tradeService";
import { Statuses } from "@/store/statuses/statuses";
import { TradeCard } from "@/components/trades/TradeCard";

const TradesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { trades, status, error } = useAppSelector((state) => state.trades);

  useEffect(() => {
    dispatch(fetchTrades(undefined));
  }, [dispatch]);

  const isLoading = status === Statuses.LOADING;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("trades.title")}</h1>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={() => navigate("/trades/new")}>
          {t("trades.create")}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && trades.length === 0 && (
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

      {!isLoading && trades.length > 0 && (
        <div className="flex flex-col gap-3">
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TradesPage;
