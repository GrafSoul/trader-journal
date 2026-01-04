import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Spinner } from "@heroui/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrade, updateTrade } from "@/services/tradeService";
import {
  resetTradeStatus,
  clearSelectedTrade,
} from "@/store/slices/tradeSlice";
import { Statuses } from "@/store/statuses/statuses";
import { TradeForm } from "@/components/trades/TradeForm";
import type { TradeFormData } from "@/lib/validations/trade";

const EditTradePage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTrade, status, error } = useAppSelector(
    (state) => state.trades
  );
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTrade(id));
    }
    return () => {
      dispatch(clearSelectedTrade());
      dispatch(resetTradeStatus());
    };
  }, [dispatch, id]);

  const handleSubmit = (data: TradeFormData) => {
    if (id) {
      isSubmittedRef.current = true;
      dispatch(updateTrade({ id, ...data }));
    }
  };

  const handleCancel = () => {
    navigate(`/trades/${id}`);
  };

  useEffect(() => {
    if (status === Statuses.SUCCEEDED && isSubmittedRef.current) {
      navigate(`/trades/${id}`);
    }
  }, [status, navigate, id]);

  const isLoading = status === Statuses.LOADING;

  if (isLoading && !selectedTrade) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("trades.editTrade")}</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="p-6">
          <TradeForm
            trade={selectedTrade}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default EditTradePage;
