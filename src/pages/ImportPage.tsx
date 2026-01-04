import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Chip,
  addToast,
} from "@heroui/react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { bulkImportTrades } from "@/services/tradeService";
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

  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setParseError(null);
      setParsedTrades([]);
      setFileName(file.name);

      try {
        let trades: ParsedTrade[] = [];
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
          const text = await file.text();
          trades = parseMetaTraderHTML(text);
        } else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
          const text = await file.text();
          trades = parseMetaTraderCSV(text);
        } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
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

  const handleImport = async () => {
    if (parsedTrades.length === 0) return;

    setIsImporting(true);
    try {
      const tradesToImport = parsedTrades.map((trade) => ({
        symbol: trade.symbol,
        market: "forex" as MarketType,
        side: trade.side,
        status: trade.status,
        open_time: trade.open_time,
        close_time: trade.close_time,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        volume: trade.volume,
        pnl: trade.pnl,
        commission: trade.commission,
        notes: trade.notes,
      }));

      const result = await dispatch(bulkImportTrades(tradesToImport)).unwrap();

      addToast({
        title: t("import.success", {
          imported: result.imported.length,
          skipped: result.skipped,
        }),
        color: "success",
      });

      setParsedTrades([]);
      setFileName(null);
    } catch {
      addToast({
        title: t("import.error"),
        color: "danger",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    setParsedTrades([]);
    setFileName(null);
    setParseError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 text-2xl font-bold">{t("import.title")}</h1>

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

              {/* Preview Table */}
              <div className="max-h-64 overflow-auto border border-divider rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-default-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        {t("trades.symbol")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.side")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.volume")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.openTime")}
                      </th>
                      <th className="px-3 py-2 text-left">
                        {t("trades.entryPrice")}
                      </th>
                      <th className="px-3 py-2 text-right">
                        {t("trades.pnl")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTrades.slice(0, 10).map((trade, index) => (
                      <tr key={index} className="border-t border-divider">
                        <td className="px-3 py-2 font-medium">
                          {trade.symbol}
                        </td>
                        <td className="px-3 py-2">
                          <Chip
                            size="sm"
                            color={trade.side === "long" ? "success" : "danger"}
                            variant="flat">
                            {trade.side.toUpperCase()}
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
                {parsedTrades.length > 10 && (
                  <div className="p-2 text-center text-default-500 text-sm bg-default-50">
                    {t("import.andMore", { count: parsedTrades.length - 10 })}
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
    </div>
  );
};

export default ImportPage;
