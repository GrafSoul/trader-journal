import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrade, deleteTrade } from "@/services/tradeService";
import {
  clearSelectedTrade,
  resetTradeStatus,
} from "@/store/slices/tradeSlice";
import { Statuses } from "@/store/statuses/statuses";

const TradeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    selectedTrade: trade,
    status,
    error,
  } = useAppSelector((state) => state.trades);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTrade(id));
    }
    return () => {
      dispatch(clearSelectedTrade());
      dispatch(resetTradeStatus());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (id) {
      setIsDeleting(true);
      await dispatch(deleteTrade(id));
      navigate("/trades");
    }
  };

  const isLoading = status === Statuses.LOADING;

  if (isLoading && !trade) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="text-center py-12">
        <p className="text-default-500">{t("trades.notFound")}</p>
        <Button
          variant="flat"
          onPress={() => navigate("/trades")}
          className="mt-4">
          {t("trades.backToList")}
        </Button>
      </div>
    );
  }

  const isProfit = trade.pnl !== null && trade.pnl > 0;
  const isLoss = trade.pnl !== null && trade.pnl < 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  const formatNumber = (num: number | null, decimals = 2) => {
    if (num === null) return "-";
    return num.toFixed(decimals);
  };

  const statusColors: Record<
    string,
    "default" | "primary" | "success" | "warning"
  > = {
    planned: "default",
    opened: "primary",
    closed: "success",
    canceled: "warning",
  };

  const sideColors: Record<string, "success" | "danger"> = {
    long: "success",
    short: "danger",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button isIconOnly variant="flat" onPress={() => navigate("/trades")}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold">{trade.symbol}</h1>
          {trade.side && (
            <Chip color={sideColors[trade.side]} variant="flat">
              {t(`trades.side.${trade.side}`)}
            </Chip>
          )}
          <Chip color={statusColors[trade.status]} variant="flat">
            {t(`trades.status.${trade.status}`)}
          </Chip>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => navigate(`/trades/${id}/edit`)}>
            {t("common.edit")}
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 size={16} />}
            onPress={onOpen}>
            {t("common.delete")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("trades.details")}</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.market")}
                </p>
                <p className="font-medium">
                  {t(`trades.market.${trade.market}`)}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.volume")}
                </p>
                <p className="font-medium">
                  {trade.volume} {t(`trades.volumeType.${trade.volume_type}`)}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.openTime")}
                </p>
                <p className="font-medium">{formatDate(trade.open_time)}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.closeTime")}
                </p>
                <p className="font-medium">{formatDate(trade.close_time)}</p>
              </div>
            </div>

            <Divider className="my-4" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.entry")}
                </p>
                <p className="font-medium">{formatNumber(trade.entry, 5)}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.stopLoss")}
                </p>
                <p className="font-medium">
                  {formatNumber(trade.stop_loss, 5)}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.takeProfit")}
                </p>
                <p className="font-medium">
                  {formatNumber(trade.take_profit, 5)}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.exitPrice")}
                </p>
                <p className="font-medium">
                  {formatNumber(trade.exit_price, 5)}
                </p>
              </div>
            </div>

            <Divider className="my-4" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.commission")}
                </p>
                <p className="font-medium">${formatNumber(trade.commission)}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.swap")}
                </p>
                <p className="font-medium">${formatNumber(trade.swap)}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.riskPercent")}
                </p>
                <p className="font-medium">
                  {formatNumber(trade.risk_percent)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">
                  {t("trades.fields.riskAmount")}
                </p>
                <p className="font-medium">
                  ${formatNumber(trade.risk_amount)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("trades.results")}</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="text-center mb-4">
              <div
                className={`flex items-center justify-center gap-2 text-3xl font-bold ${
                  isProfit
                    ? "text-success"
                    : isLoss
                    ? "text-danger"
                    : "text-default-500"
                }`}>
                {isProfit && <TrendingUp size={28} />}
                {isLoss && <TrendingDown size={28} />}
                <span>
                  {trade.pnl !== null
                    ? (trade.pnl >= 0 ? "+" : "") + `$${trade.pnl.toFixed(2)}`
                    : "-"}
                </span>
              </div>
              {trade.pnl_percent !== null && (
                <p
                  className={`text-lg ${
                    isProfit ? "text-success" : isLoss ? "text-danger" : ""
                  }`}>
                  {trade.pnl_percent >= 0 ? "+" : ""}
                  {trade.pnl_percent.toFixed(2)}%
                </p>
              )}
            </div>
            <Divider className="my-4" />
            <div className="text-center">
              <p className="text-sm text-default-500">
                {t("trades.fields.rMultiple")}
              </p>
              <p
                className={`text-2xl font-bold ${
                  isProfit ? "text-success" : isLoss ? "text-danger" : ""
                }`}>
                {trade.r_multiple !== null
                  ? (trade.r_multiple >= 0 ? "+" : "") +
                    trade.r_multiple.toFixed(2) +
                    "R"
                  : "-"}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Analysis */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("trades.analysis")}</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-default-500 mb-1">
                  {t("trades.fields.strategy")}
                </p>
                <p>{trade.strategy || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-default-500 mb-1">
                  {t("trades.fields.setup")}
                </p>
                <p>{trade.setup || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-default-500 mb-1">
                  {t("trades.fields.entryReason")}
                </p>
                <p>{trade.entry_reason || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-default-500 mb-1">
                  {t("trades.fields.exitReason")}
                </p>
                <p>{trade.exit_reason || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-default-500 mb-1">
                  {t("trades.fields.emotions")}
                </p>
                <p>{trade.emotions || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-default-500 mb-1">
                  {t("trades.fields.notes")}
                </p>
                <p>{trade.notes || "-"}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{t("trades.deleteConfirm")}</ModalHeader>
          <ModalBody>
            <p>{t("trades.deleteWarning")}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TradeDetailPage;
