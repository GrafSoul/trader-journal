import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTrade } from "@/services/tradeService";
import { resetTradeStatus } from "@/store/slices/tradeSlice";
import { Statuses } from "@/store/statuses/statuses";
import { TradeForm } from "@/components/trades/TradeForm";
import type { TradeFormData } from "@/lib/validations/trade";

const NewTradePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.trades);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    dispatch(resetTradeStatus());
    return () => {
      dispatch(resetTradeStatus());
    };
  }, [dispatch]);

  useEffect(() => {
    if (status === Statuses.SUCCEEDED && isSubmittedRef.current) {
      navigate("/trades");
    }
  }, [status, navigate]);

  const handleSubmit = (data: TradeFormData) => {
    isSubmittedRef.current = true;
    dispatch(createTrade(data));
  };

  const handleCancel = () => {
    navigate("/trades");
  };

  const isLoading = status === Statuses.LOADING;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("trades.newTrade")}</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="p-6">
          <TradeForm
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default NewTradePage;
