import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Chip,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Upload, FileText, AlertCircle, CheckCircle2, Trash2, Database, TrendingUp, TrendingDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { bulkImportTrades, deleteAllTrades, fetchTrades } from "@/services/tradeService";
import type { MarketType } from "@/types/trade";
import {
  parseMetaTraderHTML,
  parseMetaTraderCSV,
  parseMetaTraderExcel,
  type ParsedTrade,
} from "@/utils/mt4Parser";

const ImportPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { trades } = useAppSelector((state) => state.trades);

  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ type: "import" | "delete"; imported?: number; skipped?: number } | null>(null);

  useEffect(() => {
    dispatch(fetchTrades(undefined));
  }, [dispatch]);

  const handleFile = useCallback(
    async (file: File) => {
      setParseError(null);
      setParsedTrades([]);
      setFileName(file.name);

      try {
        let trades: ParsedTrade[] = [];
        const name = file.name.toLowerCase();

        if (name.endsWith(".html") || name.endsWith(".htm")) {
          const text = await file.text();
          trades = parseMetaTraderHTML(text);
        } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
          const text = await file.text();
          trades = parseMetaTraderCSV(text);
        } else if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
          const buffer = await file.arrayBuffer();
          trades = parseMetaTraderExcel(buffer);
        } else {
          setParseError(t("import.unsupportedFormat"));
          return;
        }

        if (trades.length === 0) {
          setParseError(t("import.noTradesFound"));
          return;
        }

        setParsedTrades(trades);
      } catch {
        setParseError(t("import.parseError"));
      }
    },
    [t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      e.target.value = "";
    },
    [handleFile]
  );

  const detectMarket = (symbol: string): MarketType => {
    const s = symbol.toUpperCase();
    if (s.includes("USDT") || s.includes("BTC") || s.includes("ETH")) return "crypto";
    return "forex";
  };

  const handleImport = async () => {
    if (parsedTrades.length === 0) return;

    setIsImporting(true);
    try {
      const tradesToImport = parsedTrades.map((trade) => ({
        symbol: trade.symbol,
        market: detectMarket(trade.symbol),
        side: trade.side,
        status: trade.status,
        open_time: trade.open_time,
        close_time: trade.close_time,
        entry: trade.entry_price,
        exit_price: trade.exit_price,
        volume: trade.volume,
        pnl: trade.pnl,
        commission: trade.commission,
        swap: trade.swap,
        notes: trade.notes,
        external_id: trade.external_id,
        import_source: "metatrader",
      }));

      const result = await dispatch(bulkImportTrades(tradesToImport)).unwrap();

      setLastAction({ type: "import", imported: result.imported.length, skipped: result.skipped });

      addToast({
        title: t("import.success", {
          imported: result.imported.length,
          skipped: result.skipped,
        }),
        color: "success",
      });

      setParsedTrades([]);
      setFileName(null);
      dispatch(fetchTrades(undefined));
    } catch {
      addToast({
        title: t("import.error"),
        color: "danger",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteAll = async (onClose: () => void) => {
    setIsDeleting(true);
    try {
      await dispatch(deleteAllTrades()).unwrap();
      setLastAction({ type: "delete" });
      addToast({
        title: t("import.allDeleted"),
        color: "success",
      });
      onClose();
    } catch {
      addToast({
        title: t("import.deleteError"),
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClear = () => {
    setParsedTrades([]);
    setFileName(null);
    setParseError(null);
  };

  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("import.title")}</h1>
        <Button
          color="danger"
          variant="flat"
          startContent={<Trash2 size={18} />}
          onPress={onOpen}
          isDisabled={trades.length === 0}>
          {t("import.deleteAll")}
        </Button>
      </div>

      {/* Trade stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Card shadow="sm">
          <CardBody className="flex flex-row items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-default-500">{t("import.totalInDb")}</p>
              <p className="text-xl font-bold">{trades.length}</p>
            </div>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="flex flex-row items-center gap-3 py-3">
            <div className={`p-2 rounded-lg ${totalPnl >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
              {totalPnl >= 0 ? (
                <TrendingUp size={20} className="text-success" />
              ) : (
                <TrendingDown size={20} className="text-danger" />
              )}
            </div>
            <div>
              <p className="text-xs text-default-500">{t("dashboard.totalPnl")}</p>
              <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-success" : "text-danger"}`}>
                {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card shadow="sm" className="col-span-2 sm:col-span-1">
          <CardBody className="flex flex-row items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <CheckCircle2 size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-xs text-default-500">{t("dashboard.winRate")}</p>
              <p className="text-xl font-bold">
                {trades.length > 0
                  ? `${((trades.filter((t) => (t.pnl || 0) > 0).length / trades.length) * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Last action result */}
      {lastAction && (
        <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg ${
          lastAction.type === "delete"
            ? "bg-danger-50 dark:bg-danger-900/20"
            : "bg-success-50 dark:bg-success-900/20"
        }`}>
          <CheckCircle2 size={18} className={lastAction.type === "delete" ? "text-danger" : "text-success"} />
          <span className={lastAction.type === "delete" ? "text-danger" : "text-success"}>
            {lastAction.type === "delete"
              ? t("import.allDeletedResult", { count: 0 })
              : t("import.importResult", {
                  imported: lastAction.imported || 0,
                  skipped: lastAction.skipped || 0,
                  total: trades.length,
                })}
          </span>
          <Button
            size="sm"
            variant="light"
            className="ml-auto min-w-0 px-2"
            onPress={() => setLastAction(null)}>
            ✕
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">{t("import.metatrader")}</h3>
          <p className="text-sm text-default-500">
            {t("import.metatraderDescription")}
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-default-300 hover:border-primary"
              }
            `}
            onClick={() => document.getElementById("file-input")?.click()}>
            <input
              id="file-input"
              type="file"
              accept=".html,.htm,.csv,.txt,.xls,.xlsx"
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload size={48} className="mx-auto mb-4 text-default-400" />
            <p className="text-lg font-medium">{t("import.dropzone")}</p>
            <p className="text-sm text-default-500 mt-1">
              {t("import.supportedFormats")}
            </p>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="flex items-center gap-2 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
              <AlertCircle size={20} className="text-danger" />
              <span className="text-danger">{parseError}</span>
            </div>
          )}

          {/* Parsed Trades Preview */}
          {parsedTrades.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-success" />
                  <span className="font-medium">{fileName}</span>
                  <Chip size="sm" color="success" variant="flat">
                    {t("import.tradesFound", { count: parsedTrades.length })}
                  </Chip>
                </div>
                <Button size="sm" variant="light" onPress={handleClear}>
                  {t("common.clear")}
                </Button>
              </div>

              {/* Dedup info */}
              <p className="text-sm text-default-500">
                {t("import.dedupInfo")}
              </p>

              {/* Preview Table */}
              <div className="max-h-80 overflow-auto border border-divider rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-default-100 dark:bg-default-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.fields.symbol")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.fields.side")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.fields.volume")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.fields.openTime")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.fields.entry")}
                      </th>
                      <th className="px-3 py-2 text-right">
                        {t("trades.fields.pnl")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTrades.slice(0, 20).map((trade, index) => (
                      <tr key={index} className="border-t border-divider">
                        <td className="px-3 py-2 text-default-400 text-xs font-mono">
                          {trade.external_id || "—"}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {trade.symbol}
                        </td>
                        <td className="px-3 py-2">
                          <Chip
                            size="sm"
                            color={trade.side === "long" ? "success" : "danger"}
                            variant="flat">
                            {trade.side === "long" ? "BUY" : "SELL"}
                          </Chip>
                        </td>
                        <td className="px-3 py-2">{trade.volume}</td>
                        <td className="px-3 py-2">
                          {trade.open_time?.slice(0, 16).replace("T", " ")}
                        </td>
                        <td className="px-3 py-2">{trade.entry_price}</td>
                        <td
                          className={`px-3 py-2 text-right ${
                            (trade.pnl || 0) >= 0
                              ? "text-success"
                              : "text-danger"
                          }`}>
                          {(trade.pnl || 0) >= 0 ? "+" : ""}
                          {trade.pnl?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedTrades.length > 20 && (
                  <div className="p-2 text-center text-default-500 text-sm bg-default-50">
                    {t("import.andMore", { count: parsedTrades.length - 20 })}
                  </div>
                )}
              </div>

              {/* Import Button */}
              <div className="flex justify-end gap-2">
                <Button variant="light" onPress={handleClear}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  startContent={<CheckCircle2 size={18} />}
                  onPress={handleImport}
                  isLoading={isImporting}>
                  {t("import.importTrades", { count: parsedTrades.length })}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete All Confirmation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t("import.deleteAllTitle")}</ModalHeader>
              <ModalBody>
                <p>{t("import.deleteAllConfirm")}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={() => handleDeleteAll(onClose)}
                  isLoading={isDeleting}>
                  {t("import.deleteAll")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ImportPage;
