# MetaTrader Import Specification

## Overview
Импорт истории сделок из MetaTrader 4/5 в Trader Journal.

## Supported Formats

### MT4/MT5 CSV Export (History Center)
Экспорт через: `Tools → History Center → Export`

**CSV Structure:**
```csv
Ticket,Open Time,Type,Size,Symbol,Price,S/L,T/P,Close Time,Close Price,Commission,Swap,Profit
12345678,2024.01.15 10:30:00,buy,0.10,EURUSD,1.08500,1.08000,1.09000,2024.01.15 14:45:00,1.08920,0.00,-0.50,42.00
```

### MT4/MT5 HTML Report
Экспорт через: `Account History → Save as Report`

**HTML структура парсится из таблицы с классами/id:**
- Closed Transactions table
- Open Trades table

## Field Mapping

| MT Field | Trader Journal Field | Type | Notes |
|----------|---------------------|------|-------|
| Ticket | external_id | string | Уникальный ID сделки в MT |
| Open Time | open_time | datetime | Формат: `YYYY.MM.DD HH:MM:SS` |
| Type | side | enum | `buy` → `long`, `sell` → `short` |
| Size | volume | decimal | Лоты |
| Symbol | symbol | string | Инструмент |
| Price | entry | decimal | Цена входа |
| S/L | stop_loss | decimal | Stop Loss |
| T/P | take_profit | decimal | Take Profit |
| Close Time | close_time | datetime | Время закрытия |
| Close Price | exit_price | decimal | Цена выхода |
| Commission | commission | decimal | Комиссия |
| Swap | swap | decimal | Своп |
| Profit | pnl | decimal | P&L в валюте депозита |

## Import Logic

### 1. File Detection
```typescript
function detectFormat(file: File): 'csv' | 'html' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  if (extension === 'html' || extension === 'htm') return 'html';
  return 'unknown';
}
```

### 2. CSV Parser
```typescript
interface MTTradeRow {
  ticket: string;
  openTime: string;
  type: string;
  size: string;
  symbol: string;
  price: string;
  sl: string;
  tp: string;
  closeTime: string;
  closePrice: string;
  commission: string;
  swap: string;
  profit: string;
}

function parseCSV(content: string): MTTradeRow[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      return {
        ticket: values[0],
        openTime: values[1],
        type: values[2],
        size: values[3],
        symbol: values[4],
        price: values[5],
        sl: values[6],
        tp: values[7],
        closeTime: values[8],
        closePrice: values[9],
        commission: values[10],
        swap: values[11],
        profit: values[12],
      };
    });
}
```

### 3. Data Transformation
```typescript
function transformMTTrade(row: MTTradeRow): TradeCreate {
  return {
    external_id: row.ticket,
    market: 'forex', // Default, может быть определен по symbol
    symbol: row.symbol.toUpperCase(),
    side: row.type.toLowerCase() === 'buy' ? 'long' : 'short',
    status: row.closeTime ? 'closed' : 'opened',
    open_time: parseMTDate(row.openTime),
    close_time: row.closeTime ? parseMTDate(row.closeTime) : null,
    entry: parseFloat(row.price),
    stop_loss: row.sl ? parseFloat(row.sl) : null,
    take_profit: row.tp ? parseFloat(row.tp) : null,
    exit_price: row.closePrice ? parseFloat(row.closePrice) : null,
    volume: parseFloat(row.size),
    volume_type: 'lots',
    commission: parseFloat(row.commission) || 0,
    swap: parseFloat(row.swap) || 0,
    pnl: parseFloat(row.profit),
  };
}

function parseMTDate(dateStr: string): string {
  // MT format: "2024.01.15 10:30:00"
  // ISO format: "2024-01-15T10:30:00"
  return dateStr.replace(/\./g, '-').replace(' ', 'T');
}
```

### 4. Market Detection
```typescript
function detectMarket(symbol: string): MarketType {
  const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA'];
  const forexPairs = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD'];
  const indices = ['US30', 'US500', 'NAS100', 'GER40', 'UK100'];
  const commodities = ['XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL'];
  
  if (cryptoSymbols.some(c => symbol.includes(c))) return 'crypto';
  if (indices.some(i => symbol.includes(i))) return 'futures';
  if (commodities.includes(symbol)) return 'forex'; // Commodities часто на Forex
  
  return 'forex'; // Default
}
```

## Import UI Flow

### Step 1: File Upload
```
┌─────────────────────────────────────────────────────┐
│ Import Trades from MetaTrader                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │     📁 Drop CSV or HTML file here           │   │
│  │        or click to browse                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Supported: MT4/MT5 History Export (CSV, HTML)     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Step 2: Preview & Validation
```
┌─────────────────────────────────────────────────────┐
│ Preview Import                                       │
├─────────────────────────────────────────────────────┤
│ Found 47 trades in file                             │
│ ✓ 45 valid trades                                   │
│ ⚠ 2 trades with warnings (missing SL/TP)           │
│                                                     │
│ ┌───────┬────────┬──────┬───────┬───────┬────────┐│
│ │Symbol │Side    │Entry │Exit   │PnL    │Status  ││
│ ├───────┼────────┼──────┼───────┼───────┼────────┤│
│ │EURUSD │Long    │1.0850│1.0920 │+$42   │✓       ││
│ │GBPUSD │Short   │1.2650│1.2700 │-$50   │⚠ No SL ││
│ └───────┴────────┴──────┴───────┴───────┴────────┘│
│                                                     │
│ [Cancel]                    [Import 45 trades]      │
└─────────────────────────────────────────────────────┘
```

### Step 3: Import Progress
```
┌─────────────────────────────────────────────────────┐
│ Importing...                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ████████████████████░░░░░░░░░░  45/47              │
│                                                     │
│ Imported: 45                                        │
│ Skipped: 2 (duplicates)                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Duplicate Detection

Проверка дубликатов по `external_id` (MT ticket number):
```typescript
async function checkDuplicates(tickets: string[]): Promise<string[]> {
  const { data } = await supabase
    .from('trades')
    .select('external_id')
    .in('external_id', tickets);
  
  return data?.map(t => t.external_id) || [];
}
```

## Database Schema Addition

```sql
-- Добавить поле external_id для связи с внешними системами
ALTER TABLE public.trades
ADD COLUMN external_id TEXT;

CREATE INDEX trades_external_id_idx ON public.trades(external_id);

-- Уникальность external_id в рамках пользователя
CREATE UNIQUE INDEX trades_user_external_id_idx 
ON public.trades(user_id, external_id) 
WHERE external_id IS NOT NULL;
```

---
*Last updated: 2026-01-01*
