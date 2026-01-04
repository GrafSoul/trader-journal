import { useState, useEffect, useMemo } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import type { MarketType } from "@/config/marketFields";

interface Symbol {
  symbol: string;
  display_name: string | null;
}

interface SymbolAutocompleteProps {
  market: MarketType;
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
}

const DEFAULT_SYMBOLS: Record<MarketType, Symbol[]> = {
  forex: [
    { symbol: "EURUSD", display_name: "EUR/USD" },
    { symbol: "GBPUSD", display_name: "GBP/USD" },
    { symbol: "USDJPY", display_name: "USD/JPY" },
    { symbol: "USDCHF", display_name: "USD/CHF" },
    { symbol: "AUDUSD", display_name: "AUD/USD" },
    { symbol: "USDCAD", display_name: "USD/CAD" },
    { symbol: "NZDUSD", display_name: "NZD/USD" },
    { symbol: "EURGBP", display_name: "EUR/GBP" },
    { symbol: "EURJPY", display_name: "EUR/JPY" },
    { symbol: "GBPJPY", display_name: "GBP/JPY" },
    { symbol: "XAUUSD", display_name: "Gold" },
    { symbol: "XAGUSD", display_name: "Silver" },
  ],
  crypto: [
    { symbol: "BTCUSDT", display_name: "BTC/USDT" },
    { symbol: "ETHUSDT", display_name: "ETH/USDT" },
    { symbol: "BNBUSDT", display_name: "BNB/USDT" },
    { symbol: "SOLUSDT", display_name: "SOL/USDT" },
    { symbol: "XRPUSDT", display_name: "XRP/USDT" },
    { symbol: "ADAUSDT", display_name: "ADA/USDT" },
    { symbol: "DOGEUSDT", display_name: "DOGE/USDT" },
    { symbol: "DOTUSDT", display_name: "DOT/USDT" },
    { symbol: "MATICUSDT", display_name: "MATIC/USDT" },
    { symbol: "LINKUSDT", display_name: "LINK/USDT" },
  ],
  stocks: [
    { symbol: "AAPL", display_name: "Apple Inc." },
    { symbol: "MSFT", display_name: "Microsoft" },
    { symbol: "GOOGL", display_name: "Alphabet" },
    { symbol: "AMZN", display_name: "Amazon" },
    { symbol: "TSLA", display_name: "Tesla" },
    { symbol: "NVDA", display_name: "NVIDIA" },
    { symbol: "META", display_name: "Meta" },
    { symbol: "AMD", display_name: "AMD" },
    { symbol: "NFLX", display_name: "Netflix" },
    { symbol: "JPM", display_name: "JPMorgan" },
  ],
  futures: [
    { symbol: "ES", display_name: "E-mini S&P 500" },
    { symbol: "NQ", display_name: "E-mini Nasdaq" },
    { symbol: "YM", display_name: "E-mini Dow" },
    { symbol: "RTY", display_name: "E-mini Russell" },
    { symbol: "CL", display_name: "Crude Oil" },
    { symbol: "GC", display_name: "Gold Futures" },
    { symbol: "SI", display_name: "Silver Futures" },
    { symbol: "ZB", display_name: "30Y T-Bond" },
    { symbol: "ZN", display_name: "10Y T-Note" },
    { symbol: "6E", display_name: "Euro FX" },
  ],
  options: [
    { symbol: "SPY", display_name: "SPDR S&P 500" },
    { symbol: "QQQ", display_name: "Invesco QQQ" },
    { symbol: "IWM", display_name: "iShares Russell" },
    { symbol: "AAPL", display_name: "Apple Options" },
    { symbol: "TSLA", display_name: "Tesla Options" },
    { symbol: "NVDA", display_name: "NVIDIA Options" },
    { symbol: "AMD", display_name: "AMD Options" },
    { symbol: "AMZN", display_name: "Amazon Options" },
    { symbol: "META", display_name: "Meta Options" },
    { symbol: "MSFT", display_name: "Microsoft Options" },
  ],
  other: [],
};

export const SymbolAutocomplete = ({
  market,
  value,
  onChange,
  isDisabled,
  isInvalid,
  errorMessage,
}: SymbolAutocompleteProps) => {
  const { t } = useTranslation();
  const [userSymbols, setUserSymbols] = useState<Symbol[]>([]);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const fetchUserSymbols = async () => {
      const { data } = await supabase
        .from("user_symbols")
        .select("symbol, display_name")
        .eq("market", market)
        .order("last_used_at", { ascending: false })
        .limit(20);

      if (data) {
        setUserSymbols(data);
      }
    };

    fetchUserSymbols();
  }, [market]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const allSymbols = useMemo(() => {
    const defaults = DEFAULT_SYMBOLS[market] || [];
    const userSet = new Set(userSymbols.map((s) => s.symbol));
    const combined = [
      ...userSymbols,
      ...defaults.filter((d) => !userSet.has(d.symbol)),
    ];
    return combined;
  }, [market, userSymbols]);

  const handleSelectionChange = (key: React.Key | null) => {
    if (key) {
      const selected = String(key);
      onChange(selected);
      setInputValue(selected);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onChange(val.toUpperCase());
  };

  return (
    <Autocomplete
      label={t("trades.fields.symbol")}
      placeholder={t("trades.fields.symbolPlaceholder")}
      selectedKey={value}
      inputValue={inputValue}
      onSelectionChange={handleSelectionChange}
      onInputChange={handleInputChange}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      allowsCustomValue
      defaultItems={allSymbols}>
      {(item) => (
        <AutocompleteItem key={item.symbol} textValue={item.symbol}>
          <div className="flex justify-between items-center">
            <span className="font-medium">{item.symbol}</span>
            {item.display_name && (
              <span className="text-small text-default-400">
                {item.display_name}
              </span>
            )}
          </div>
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
};
