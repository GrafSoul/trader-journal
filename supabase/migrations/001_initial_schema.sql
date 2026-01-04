-- =====================================================
-- Trader Journal - Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- =====================================================

-- =====================================================
-- 1. TYPES (ENUMS)
-- =====================================================

CREATE TYPE market_type AS ENUM ('forex', 'crypto', 'stocks', 'futures', 'options', 'other');
CREATE TYPE trade_side AS ENUM ('long', 'short');
CREATE TYPE trade_status AS ENUM ('planned', 'opened', 'closed', 'canceled');
CREATE TYPE volume_type AS ENUM ('lots', 'units', 'contracts');

-- =====================================================
-- 2. PROFILES TABLE
-- =====================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  risk_default_percent DECIMAL(5,2) DEFAULT 1.00,
  risk_default_amount DECIMAL(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. TRADES TABLE
-- =====================================================

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Instrument
  market market_type NOT NULL DEFAULT 'forex',
  symbol TEXT NOT NULL,
  side trade_side NOT NULL,
  status trade_status NOT NULL DEFAULT 'planned',
  
  -- Timing
  open_time TIMESTAMPTZ,
  close_time TIMESTAMPTZ,
  
  -- Prices
  entry DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  
  -- Volume
  volume DECIMAL(15,8) NOT NULL,
  volume_type volume_type NOT NULL DEFAULT 'lots',
  
  -- Costs
  commission DECIMAL(15,2) DEFAULT 0,
  swap DECIMAL(15,2) DEFAULT 0,
  
  -- Risk
  risk_percent DECIMAL(5,2),
  risk_amount DECIMAL(15,2),
  
  -- Results
  pnl DECIMAL(15,2),
  pnl_percent DECIMAL(10,4),
  r_multiple DECIMAL(10,4),
  
  -- Analysis
  strategy TEXT,
  setup TEXT,
  entry_reason TEXT,
  exit_reason TEXT,
  notes TEXT,
  emotions TEXT,
  
  -- External import (MetaTrader)
  external_id TEXT,
  import_source TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for trades
CREATE INDEX trades_user_id_idx ON public.trades(user_id);
CREATE INDEX trades_symbol_idx ON public.trades(symbol);
CREATE INDEX trades_status_idx ON public.trades(status);
CREATE INDEX trades_open_time_idx ON public.trades(open_time);
CREATE INDEX trades_created_at_idx ON public.trades(created_at);
CREATE INDEX trades_external_id_idx ON public.trades(external_id);

-- Unique constraint for import deduplication
CREATE UNIQUE INDEX trades_user_external_id_idx 
  ON public.trades(user_id, external_id) 
  WHERE external_id IS NOT NULL;

-- RLS for trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own trades"
  ON public.trades FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. TRADE_TAGS TABLE
-- =====================================================

CREATE TABLE public.trade_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(trade_id, tag)
);

CREATE INDEX trade_tags_trade_id_idx ON public.trade_tags(trade_id);
CREATE INDEX trade_tags_tag_idx ON public.trade_tags(tag);

-- RLS for trade_tags
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tags of own trades"
  ON public.trade_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trades
      WHERE trades.id = trade_tags.trade_id
      AND trades.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. TRADE_ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE public.trade_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  filename TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX trade_attachments_trade_id_idx ON public.trade_attachments(trade_id);

-- RLS for trade_attachments
ALTER TABLE public.trade_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attachments of own trades"
  ON public.trade_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trades
      WHERE trades.id = trade_attachments.trade_id
      AND trades.user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 7. DASHBOARD STATS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_market market_type DEFAULT NULL,
  p_symbol TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_trades', COUNT(*),
    'closed_trades', COUNT(*) FILTER (WHERE status = 'closed'),
    'winning_trades', COUNT(*) FILTER (WHERE status = 'closed' AND pnl > 0),
    'losing_trades', COUNT(*) FILTER (WHERE status = 'closed' AND pnl < 0),
    'net_pnl', COALESCE(SUM(pnl) FILTER (WHERE status = 'closed'), 0),
    'win_rate', CASE 
      WHEN COUNT(*) FILTER (WHERE status = 'closed') > 0 
      THEN ROUND(COUNT(*) FILTER (WHERE status = 'closed' AND pnl > 0)::DECIMAL / 
           COUNT(*) FILTER (WHERE status = 'closed') * 100, 2)
      ELSE 0 
    END,
    'avg_r', COALESCE(AVG(r_multiple) FILTER (WHERE status = 'closed'), 0),
    'profit_factor', CASE 
      WHEN COALESCE(ABS(SUM(pnl) FILTER (WHERE status = 'closed' AND pnl < 0)), 0) > 0
      THEN ROUND(COALESCE(SUM(pnl) FILTER (WHERE status = 'closed' AND pnl > 0), 0) / 
           ABS(SUM(pnl) FILTER (WHERE status = 'closed' AND pnl < 0)), 2)
      ELSE 0
    END,
    'best_trade', MAX(pnl) FILTER (WHERE status = 'closed'),
    'worst_trade', MIN(pnl) FILTER (WHERE status = 'closed'),
    'avg_win', AVG(pnl) FILTER (WHERE status = 'closed' AND pnl > 0),
    'avg_loss', AVG(pnl) FILTER (WHERE status = 'closed' AND pnl < 0)
  ) INTO result
  FROM public.trades
  WHERE user_id = auth.uid()
    AND (open_time >= p_start_date OR p_start_date IS NULL)
    AND (open_time <= p_end_date OR p_end_date IS NULL)
    AND (market = p_market OR p_market IS NULL)
    AND (symbol = p_symbol OR p_symbol IS NULL);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. STORAGE BUCKET FOR SCREENSHOTS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', false);

-- Storage RLS policies
CREATE POLICY "Users can upload own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trade-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'trade-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trade-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- DONE! Schema created successfully.
-- =====================================================
