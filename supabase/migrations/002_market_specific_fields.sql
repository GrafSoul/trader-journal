-- =====================================================
-- Trader Journal - Market-Specific Fields Migration
-- =====================================================

-- Add new market-specific fields to trades table
ALTER TABLE public.trades 
  -- Crypto-specific
  ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leverage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS funding_rate DECIMAL(10,6),
  
  -- Stocks-specific
  ADD COLUMN IF NOT EXISTS shares DECIMAL(15,4),
  ADD COLUMN IF NOT EXISTS dividend DECIMAL(15,2),
  
  -- Futures-specific
  ADD COLUMN IF NOT EXISTS contracts DECIMAL(15,4),
  ADD COLUMN IF NOT EXISTS expiration_date DATE,
  ADD COLUMN IF NOT EXISTS margin DECIMAL(15,2),
  
  -- Options-specific
  ADD COLUMN IF NOT EXISTS option_type TEXT CHECK (option_type IN ('call', 'put')),
  ADD COLUMN IF NOT EXISTS strike_price DECIMAL(20,8),
  ADD COLUMN IF NOT EXISTS premium DECIMAL(15,2),
  
  -- Forex-specific (already have swap, adding pip_value)
  ADD COLUMN IF NOT EXISTS pip_value DECIMAL(15,6);

-- =====================================================
-- User Symbols Table (for autocomplete with custom symbols)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  market market_type NOT NULL,
  symbol TEXT NOT NULL,
  display_name TEXT,
  is_favorite BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, market, symbol)
);

CREATE INDEX user_symbols_user_id_idx ON public.user_symbols(user_id);
CREATE INDEX user_symbols_market_idx ON public.user_symbols(market);
CREATE INDEX user_symbols_last_used_idx ON public.user_symbols(last_used_at DESC);

-- RLS for user_symbols
ALTER TABLE public.user_symbols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own symbols"
  ON public.user_symbols FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- Default Symbols (popular instruments per market)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.default_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market market_type NOT NULL,
  symbol TEXT NOT NULL,
  display_name TEXT,
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(market, symbol)
);

-- Insert default Forex symbols
INSERT INTO public.default_symbols (market, symbol, display_name, sort_order) VALUES
  ('forex', 'EURUSD', 'EUR/USD', 1),
  ('forex', 'GBPUSD', 'GBP/USD', 2),
  ('forex', 'USDJPY', 'USD/JPY', 3),
  ('forex', 'USDCHF', 'USD/CHF', 4),
  ('forex', 'AUDUSD', 'AUD/USD', 5),
  ('forex', 'USDCAD', 'USD/CAD', 6),
  ('forex', 'NZDUSD', 'NZD/USD', 7),
  ('forex', 'EURGBP', 'EUR/GBP', 8),
  ('forex', 'EURJPY', 'EUR/JPY', 9),
  ('forex', 'GBPJPY', 'GBP/JPY', 10),
  ('forex', 'XAUUSD', 'Gold', 11),
  ('forex', 'XAGUSD', 'Silver', 12)
ON CONFLICT (market, symbol) DO NOTHING;

-- Insert default Crypto symbols
INSERT INTO public.default_symbols (market, symbol, display_name, sort_order) VALUES
  ('crypto', 'BTCUSDT', 'BTC/USDT', 1),
  ('crypto', 'ETHUSDT', 'ETH/USDT', 2),
  ('crypto', 'BNBUSDT', 'BNB/USDT', 3),
  ('crypto', 'SOLUSDT', 'SOL/USDT', 4),
  ('crypto', 'XRPUSDT', 'XRP/USDT', 5),
  ('crypto', 'ADAUSDT', 'ADA/USDT', 6),
  ('crypto', 'DOGEUSDT', 'DOGE/USDT', 7),
  ('crypto', 'DOTUSDT', 'DOT/USDT', 8),
  ('crypto', 'MATICUSDT', 'MATIC/USDT', 9),
  ('crypto', 'LINKUSDT', 'LINK/USDT', 10)
ON CONFLICT (market, symbol) DO NOTHING;

-- Insert default Stock symbols
INSERT INTO public.default_symbols (market, symbol, display_name, sort_order) VALUES
  ('stocks', 'AAPL', 'Apple Inc.', 1),
  ('stocks', 'MSFT', 'Microsoft', 2),
  ('stocks', 'GOOGL', 'Alphabet', 3),
  ('stocks', 'AMZN', 'Amazon', 4),
  ('stocks', 'TSLA', 'Tesla', 5),
  ('stocks', 'NVDA', 'NVIDIA', 6),
  ('stocks', 'META', 'Meta', 7),
  ('stocks', 'AMD', 'AMD', 8),
  ('stocks', 'NFLX', 'Netflix', 9),
  ('stocks', 'JPM', 'JPMorgan', 10)
ON CONFLICT (market, symbol) DO NOTHING;

-- Insert default Futures symbols
INSERT INTO public.default_symbols (market, symbol, display_name, sort_order) VALUES
  ('futures', 'ES', 'E-mini S&P 500', 1),
  ('futures', 'NQ', 'E-mini Nasdaq', 2),
  ('futures', 'YM', 'E-mini Dow', 3),
  ('futures', 'RTY', 'E-mini Russell', 4),
  ('futures', 'CL', 'Crude Oil', 5),
  ('futures', 'GC', 'Gold Futures', 6),
  ('futures', 'SI', 'Silver Futures', 7),
  ('futures', 'ZB', '30Y T-Bond', 8),
  ('futures', 'ZN', '10Y T-Note', 9),
  ('futures', '6E', 'Euro FX', 10)
ON CONFLICT (market, symbol) DO NOTHING;

-- Insert default Options symbols (based on underlying)
INSERT INTO public.default_symbols (market, symbol, display_name, sort_order) VALUES
  ('options', 'SPY', 'SPDR S&P 500', 1),
  ('options', 'QQQ', 'Invesco QQQ', 2),
  ('options', 'IWM', 'iShares Russell', 3),
  ('options', 'AAPL', 'Apple Options', 4),
  ('options', 'TSLA', 'Tesla Options', 5),
  ('options', 'NVDA', 'NVIDIA Options', 6),
  ('options', 'AMD', 'AMD Options', 7),
  ('options', 'AMZN', 'Amazon Options', 8),
  ('options', 'META', 'Meta Options', 9),
  ('options', 'MSFT', 'Microsoft Options', 10)
ON CONFLICT (market, symbol) DO NOTHING;

-- Allow public read access to default_symbols
ALTER TABLE public.default_symbols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read default symbols"
  ON public.default_symbols FOR SELECT
  USING (true);

-- =====================================================
-- DONE! Migration complete.
-- =====================================================
