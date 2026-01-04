import * as XLSX from "xlsx";

export interface ParsedTrade {
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
  notes: string | null;
}

/**
 * Parse MT4/MT5 HTML report
 */
export function parseMetaTraderHTML(html: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Find all tables in the document
  const tables = doc.querySelectorAll("table");

  for (const table of tables) {
    const rows = table.querySelectorAll("tr");

    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 10) continue;

      // Try to parse as trade row
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
    // MT4 HTML format: Order, Time, Type, Size, Symbol, Price, S/L, T/P, Time, Price, Commission, Taxes, Swap, Profit, Comments
    // Minimum cells check
    if (cells.length < 14) return null;

    const typeCell = cells[2]?.textContent?.trim().toLowerCase() || "";
    
    // Only process buy/sell trades
    if (typeCell !== "buy" && typeCell !== "sell") {
      return null;
    }

    const symbol = cells[4]?.textContent?.trim() || "";
    if (!symbol || symbol === "") return null;

    const side: "long" | "short" = typeCell === "buy" ? "long" : "short";
    const volume = parseFloat(cells[3]?.textContent?.trim() || "0");
    const openTime = parseMetaTraderDate(cells[1]?.textContent?.trim() || "");
    const entryPrice = parseFloat(cells[5]?.textContent?.trim() || "0");
    const closeTime = parseMetaTraderDate(cells[8]?.textContent?.trim() || "");
    const exitPrice = parseFloat(cells[9]?.textContent?.trim() || "0");
    const commission = parseFloat(cells[10]?.textContent?.trim() || "0");
    const swap = parseFloat(cells[12]?.textContent?.trim() || "0");
    const profit = parseFloat(cells[13]?.textContent?.trim() || "0");
    const comment = cells[14]?.textContent?.trim() || null;

    // Validate required fields
    if (!symbol || !openTime || isNaN(entryPrice) || isNaN(volume)) {
      return null;
    }

    return {
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
      notes: comment,
    };
  } catch {
    return null;
  }
}

/**
 * Parse MT4/MT5 CSV file
 * Expected format: Ticket,Symbol,Type,Volume,OpenTime,OpenPrice,CloseTime,ClosePrice,Commission,Swap,Profit,Comment
 */
export function parseMetaTraderCSV(csv: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const lines = csv.trim().split(/\r?\n/);

  if (lines.length < 2) return trades;

  // Try to detect header
  const headerLine = lines[0].toLowerCase();
  const hasHeader = headerLine.includes("symbol") || headerLine.includes("type") || headerLine.includes("ticket");
  const startIndex = hasHeader ? 1 : 0;

  // Detect delimiter
  const delimiter = csv.includes("\t") ? "\t" : (csv.includes(";") ? ";" : ",");

  // Parse header to get column indices
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
    symbol: findIndex(["symbol", "item", "instrument"]),
    type: findIndex(["type", "side", "direction"]),
    volume: findIndex(["volume", "size", "lots", "lot"]),
    openTime: findIndex(["open time", "opentime", "open date", "time"]),
    openPrice: findIndex(["open price", "openprice", "entry", "price"]),
    closeTime: findIndex(["close time", "closetime", "close date"]),
    closePrice: findIndex(["close price", "closeprice", "exit"]),
    commission: findIndex(["commission", "comm"]),
    swap: findIndex(["swap"]),
    profit: findIndex(["profit", "pnl", "p/l", "result"]),
    comment: findIndex(["comment", "comments", "note", "notes"]),
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
    const volume = parseFloat(getValue(columnMap.volume)) || 0;
    const openTime = parseMetaTraderDate(getValue(columnMap.openTime));
    const entryPrice = parseFloat(getValue(columnMap.openPrice)) || 0;
    const closeTime = parseMetaTraderDate(getValue(columnMap.closeTime));
    const exitPrice = parseFloat(getValue(columnMap.closePrice)) || 0;
    const commission = parseFloat(getValue(columnMap.commission)) || 0;
    const swap = parseFloat(getValue(columnMap.swap)) || 0;
    const profit = parseFloat(getValue(columnMap.profit)) || 0;
    const comment = getValue(columnMap.comment) || null;

    if (!symbol || !openTime || volume <= 0) {
      return null;
    }

    return {
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

  // Try parsing various formats
  // MT4/MT5 format: 2024.01.15 14:30:00 or 2024.01.15 14:30
  const mtMatch = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (mtMatch) {
    const [, year, month, day, hour, minute, second = "00"] = mtMatch;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  // Try ISO format
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
 * Check if two trades are duplicates
 */
export function isDuplicateTrade(
  newTrade: ParsedTrade,
  existingTrade: { symbol: string; open_time: string; close_time: string | null; volume: number }
): boolean {
  // Compare by symbol + open_time + close_time + volume
  const sameSymbol = newTrade.symbol.toLowerCase() === existingTrade.symbol.toLowerCase();
  const sameOpenTime = normalizeDateTime(newTrade.open_time) === normalizeDateTime(existingTrade.open_time);
  const sameCloseTime = normalizeDateTime(newTrade.close_time) === normalizeDateTime(existingTrade.close_time);
  const sameVolume = Math.abs(newTrade.volume - existingTrade.volume) < 0.0001;

  return sameSymbol && sameOpenTime && sameCloseTime && sameVolume;
}

function normalizeDateTime(dt: string | null): string {
  if (!dt) return "";
  // Remove milliseconds and timezone, keep only YYYY-MM-DDTHH:MM:SS
  return dt.slice(0, 19).replace(/\s/, "T");
}

/**
 * Parse Excel file (XLS/XLSX)
 */
export function parseMetaTraderExcel(buffer: ArrayBuffer): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (rows.length < 2) return trades;
    
    // Get headers from first row
    const headerRow = rows[0] || [];
    const headers = headerRow.map(h => String(h || "").toLowerCase().trim());
    const columnMap = detectColumns(headers);
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const values = row.map(cell => {
        if (cell === null || cell === undefined) return "";
        if (cell instanceof Date) {
          return cell.toISOString().slice(0, 19);
        }
        return String(cell);
      });
      
      const trade = parseCSVRow(values, columnMap);
      if (trade) {
        trades.push(trade);
      }
    }
  } catch (error) {
    console.warn("Error parsing Excel file:", error);
  }
  
  return trades;
}
