import * as XLSX from "xlsx";

export interface ParsedTrade {
  external_id: string | null;
  symbol: string;
  side: "long" | "short";
  status: "closed";
  open_time: string;
  close_time: string | null;
  entry_price: number;
  exit_price: number | null;
  volume: number;
  pnl: number | null;
  commission: number | null;
  swap: number | null;
  notes: string | null;
}

/**
 * Parse MT4/MT5 HTML report
 */
export function parseMetaTraderHTML(html: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const tables = doc.querySelectorAll("table");

  for (const table of tables) {
    const rows = table.querySelectorAll("tr");

    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 10) continue;

      const trade = parseHTMLRow(cells);
      if (trade) {
        trades.push(trade);
      }
    }
  }

  return trades;
}

function parseHTMLRow(cells: NodeListOf<HTMLTableCellElement>): ParsedTrade | null {
  try {
    if (cells.length < 13) return null;

    const typeCell = cells[3]?.textContent?.trim().toLowerCase() || "";

    if (typeCell !== "buy" && typeCell !== "sell") {
      return null;
    }

    const positionId = cells[1]?.textContent?.trim() || null;
    const symbol = cells[2]?.textContent?.trim() || "";
    if (!symbol) return null;

    const side: "long" | "short" = typeCell === "buy" ? "long" : "short";
    const volume = parseVolume(cells[4]?.textContent?.trim() || "0");
    const openTime = parseMetaTraderDate(cells[0]?.textContent?.trim() || "");
    const entryPrice = parseFloat(cells[5]?.textContent?.trim() || "0");
    const closeTime = parseMetaTraderDate(cells[8]?.textContent?.trim() || "");
    const exitPrice = parseFloat(cells[9]?.textContent?.trim() || "0");
    const commission = parseFloat(cells[10]?.textContent?.trim() || "0");
    const swap = parseFloat(cells[11]?.textContent?.trim() || "0");
    const profit = parseFloat(cells[12]?.textContent?.trim() || "0");

    if (!symbol || !openTime || isNaN(entryPrice) || isNaN(volume) || volume <= 0) {
      return null;
    }

    return {
      external_id: positionId,
      symbol,
      side,
      status: "closed",
      open_time: openTime,
      close_time: closeTime || null,
      entry_price: entryPrice,
      exit_price: exitPrice || null,
      volume,
      pnl: profit + swap,
      commission: commission || null,
      swap: swap || null,
      notes: null,
    };
  } catch {
    return null;
  }
}

/**
 * Parse MT4/MT5 CSV file
 */
export function parseMetaTraderCSV(csv: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const lines = csv.trim().split(/\r?\n/);

  if (lines.length < 2) return trades;

  const headerLine = lines[0].toLowerCase();
  const hasHeader = headerLine.includes("symbol") || headerLine.includes("type") ||
                    headerLine.includes("ticket") || headerLine.includes("символ") ||
                    headerLine.includes("тип") || headerLine.includes("позиция");
  const startIndex = hasHeader ? 1 : 0;

  const delimiter = csv.includes("\t") ? "\t" : (csv.includes(";") ? ";" : ",");

  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
  const columnMap = detectColumns(headers);

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line, delimiter);
    const trade = parseCSVRow(values, columnMap);

    if (trade) {
      trades.push(trade);
    }
  }

  return trades;
}

interface ColumnMap {
  positionId: number;
  symbol: number;
  type: number;
  volume: number;
  openTime: number;
  openPrice: number;
  closeTime: number;
  closePrice: number;
  commission: number;
  swap: number;
  profit: number;
  comment: number;
}

function detectColumns(headers: string[]): ColumnMap {
  const findIndex = (keywords: string[]): number => {
    for (const keyword of keywords) {
      const idx = headers.findIndex(h => h.includes(keyword));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  return {
    positionId: findIndex(["position", "ticket", "позиция", "order", "ордер"]),
    symbol: findIndex(["symbol", "item", "instrument", "символ"]),
    type: findIndex(["type", "side", "direction", "тип"]),
    volume: findIndex(["volume", "size", "lots", "lot", "объем", "объём"]),
    openTime: findIndex(["open time", "opentime", "open date", "время"]),
    openPrice: findIndex(["open price", "openprice", "entry", "цена"]),
    closeTime: findIndex(["close time", "closetime", "close date"]),
    closePrice: findIndex(["close price", "closeprice", "exit"]),
    commission: findIndex(["commission", "comm", "комиссия"]),
    swap: findIndex(["swap", "своп"]),
    profit: findIndex(["profit", "pnl", "p/l", "result", "прибыль"]),
    comment: findIndex(["comment", "comments", "note", "notes", "комментарий"]),
  };
}

function parseCSVRow(values: string[], columnMap: ColumnMap): ParsedTrade | null {
  try {
    const getValue = (idx: number): string => (idx >= 0 && idx < values.length ? values[idx].trim() : "");

    const typeStr = getValue(columnMap.type).toLowerCase();
    if (typeStr !== "buy" && typeStr !== "sell") {
      return null;
    }

    const symbol = getValue(columnMap.symbol);
    if (!symbol) return null;

    const side: "long" | "short" = typeStr === "buy" ? "long" : "short";
    const volume = parseVolume(getValue(columnMap.volume));
    const openTime = parseMetaTraderDate(getValue(columnMap.openTime));
    const entryPrice = parseFloat(getValue(columnMap.openPrice)) || 0;

    // closeTime and closePrice may use same column index as openTime/openPrice
    // In MT5 format, closeTime is the second "Время" column (index 8), closePrice is second "Цена" (index 9)
    let closeTimeIdx = columnMap.closeTime;
    let closePriceIdx = columnMap.closePrice;
    // If close columns not found, they might be at fixed positions after openPrice
    if (closeTimeIdx < 0 && columnMap.openTime >= 0) {
      // Try the second occurrence
      closeTimeIdx = -1;
    }
    const closeTime = closeTimeIdx >= 0 ? parseMetaTraderDate(getValue(closeTimeIdx)) : null;
    const exitPrice = closePriceIdx >= 0 ? (parseFloat(getValue(closePriceIdx)) || 0) : 0;

    const commission = parseFloat(getValue(columnMap.commission)) || 0;
    const swap = parseFloat(getValue(columnMap.swap)) || 0;
    const profit = parseFloat(getValue(columnMap.profit)) || 0;
    const comment = getValue(columnMap.comment) || null;
    const positionId = getValue(columnMap.positionId) || null;

    if (!symbol || !openTime || volume <= 0) {
      return null;
    }

    return {
      external_id: positionId,
      symbol,
      side,
      status: "closed",
      open_time: openTime,
      close_time: closeTime || null,
      entry_price: entryPrice,
      exit_price: exitPrice || null,
      volume,
      pnl: profit + swap,
      commission: commission || null,
      swap: swap || null,
      notes: comment,
    };
  } catch {
    return null;
  }
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse MetaTrader date format: YYYY.MM.DD HH:MM or YYYY.MM.DD HH:MM:SS
 */
function parseMetaTraderDate(dateStr: string): string {
  if (!dateStr) return "";

  // MT4/MT5 format: 2024.01.15 14:30:00 or 2024.01.15 14:30
  const mtMatch = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (mtMatch) {
    const [, year, month, day, hour, minute, second = "00"] = mtMatch;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  // ISO format
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})(?:T|\s)(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    const [, year, month, day, hour, minute, second = "00"] = isoMatch;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  // Try parsing as Date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 19);
  }

  return "";
}

/**
 * Parse volume string that may contain fractions like "1.01" or plain "1"
 */
function parseVolume(volumeStr: string): number {
  if (!volumeStr) return 0;
  // Remove spaces and replace comma with dot
  const cleaned = volumeStr.replace(/\s/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

/**
 * Check if a row is a MT5 position header row (Russian or English)
 */
function isPositionHeaderRow(row: unknown[]): boolean {
  if (!row || row.length < 10) return false;
  const first = String(row[0] || "").toLowerCase().trim();
  const third = String(row[2] || "").toLowerCase().trim();
  return (
    (first === "время" || first === "time") &&
    (third === "символ" || third === "symbol")
  );
}

/**
 * Check if a row marks a section boundary (Ордера, Сделки, Orders, Deals, summary rows)
 */
function isSectionBoundary(row: unknown[]): boolean {
  if (!row || row.length === 0) return false;
  const first = String(row[0] || "").toLowerCase().trim();
  return (
    first === "ордера" || first === "orders" ||
    first === "сделки" || first === "deals" ||
    first === "рабочие ордера" || first === "working orders" ||
    first === "" // empty first cell often means summary/footer
  );
}

/**
 * Parse Excel file (XLS/XLSX) - handles MT5 Exness format with Russian headers
 *
 * MT5 Position format (13 columns):
 * [0] Время откр | [1] Позиция (ID) | [2] Символ | [3] Тип | [4] Объем
 * [5] Цена откр | [6] S/L | [7] T/P | [8] Время закр | [9] Цена закр
 * [10] Комиссия | [11] Своп | [12] Прибыль
 */
export function parseMetaTraderExcel(buffer: ArrayBuffer): ParsedTrade[] {
  const trades: ParsedTrade[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) return trades;

    // Find the "Позиции" / "Positions" section and its header row
    let headerRowIdx = -1;
    let dataStartIdx = -1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      // Check for section label "Позиции" or "Positions"
      const firstCell = String(row[0] || "").trim().toLowerCase();
      if (firstCell === "позиции" || firstCell === "positions") {
        // Next row should be the header
        if (i + 1 < rows.length && isPositionHeaderRow(rows[i + 1])) {
          headerRowIdx = i + 1;
          dataStartIdx = i + 2;
          break;
        }
      }

      // Also check if this row itself is the header (no section label)
      if (headerRowIdx < 0 && isPositionHeaderRow(row)) {
        headerRowIdx = i;
        dataStartIdx = i + 1;
        break;
      }
    }

    // Fallback: try generic header detection
    if (headerRowIdx < 0) {
      const headerRow = rows[0] || [];
      const headers = headerRow.map(h => String(h || "").toLowerCase().trim());
      const columnMap = detectColumns(headers);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const values = row.map(cell => {
          if (cell === null || cell === undefined) return "";
          if (cell instanceof Date) return cell.toISOString().slice(0, 19);
          return String(cell);
        });

        const trade = parseCSVRow(values, columnMap);
        if (trade) trades.push(trade);
      }
      return trades;
    }

    // Parse MT5 position rows with known column layout
    for (let i = dataStartIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 10) continue;

      // Stop at next section
      if (isSectionBoundary(row)) break;

      const typeStr = String(row[3] || "").toLowerCase().trim();
      if (typeStr !== "buy" && typeStr !== "sell") continue;

      const openTimeStr = String(row[0] || "");
      const positionId = row[1] != null ? String(row[1]) : null;
      const symbol = String(row[2] || "").trim();
      const volumeStr = String(row[4] || "0");
      const entryPrice = parseFloat(String(row[5] || "0"));
      const closeTimeStr = String(row[8] || "");
      const exitPrice = parseFloat(String(row[9] || "0"));
      const commission = parseFloat(String(row[10] || "0"));
      const swap = parseFloat(String(row[11] || "0"));
      const profit = parseFloat(String(row[12] || "0"));

      const openTime = parseMetaTraderDate(openTimeStr);
      const closeTime = parseMetaTraderDate(closeTimeStr);
      const volume = parseVolume(volumeStr);

      if (!symbol || !openTime || isNaN(entryPrice) || volume <= 0) continue;

      trades.push({
        external_id: positionId,
        symbol,
        side: typeStr === "buy" ? "long" : "short",
        status: "closed",
        open_time: openTime,
        close_time: closeTime || null,
        entry_price: entryPrice,
        exit_price: exitPrice || null,
        volume,
        pnl: profit + swap,
        commission: commission || null,
        swap: swap || null,
        notes: null,
      });
    }
  } catch (error) {
    console.warn("Error parsing Excel file:", error);
  }

  return trades;
}
