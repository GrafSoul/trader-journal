export type MarketType = 'forex' | 'crypto' | 'stocks' | 'futures' | 'options' | 'other';

export interface MarketFieldConfig {
  // Common fields (always shown)
  symbol: boolean;
  side: boolean;
  status: boolean;
  openTime: boolean;
  closeTime: boolean;
  entry: boolean;
  exitPrice: boolean;
  stopLoss: boolean;
  takeProfit: boolean;
  pnl: boolean;
  pnlPercent: boolean;
  rMultiple: boolean;
  commission: boolean;
  strategy: boolean;
  setup: boolean;
  entryReason: boolean;
  exitReason: boolean;
  notes: boolean;
  emotions: boolean;
  riskPercent: boolean;
  riskAmount: boolean;
  
  // Forex-specific
  volumeLots: boolean;
  swap: boolean;
  pipValue: boolean;
  
  // Crypto-specific
  volumeUnits: boolean;
  fee: boolean;
  leverage: boolean;
  fundingRate: boolean;
  
  // Stocks-specific
  shares: boolean;
  dividend: boolean;
  
  // Futures-specific
  contracts: boolean;
  expirationDate: boolean;
  margin: boolean;
  
  // Options-specific
  optionType: boolean;
  strikePrice: boolean;
  premium: boolean;
}

const commonFields: Partial<MarketFieldConfig> = {
  symbol: true,
  status: true,
  openTime: true,
  closeTime: true,
  entry: true,
  exitPrice: true,
  pnl: true,
  pnlPercent: true,
  rMultiple: true,
  commission: true,
  strategy: true,
  setup: true,
  entryReason: true,
  exitReason: true,
  notes: true,
  emotions: true,
  riskPercent: true,
  riskAmount: true,
};

export const MARKET_FIELDS: Record<MarketType, MarketFieldConfig> = {
  forex: {
    ...commonFields,
    symbol: true,
    side: true,
    status: true,
    openTime: true,
    closeTime: true,
    entry: true,
    exitPrice: true,
    stopLoss: true,
    takeProfit: true,
    pnl: true,
    pnlPercent: true,
    rMultiple: true,
    commission: true,
    strategy: true,
    setup: true,
    entryReason: true,
    exitReason: true,
    notes: true,
    emotions: true,
    riskPercent: true,
    riskAmount: true,
    // Forex-specific
    volumeLots: true,
    swap: true,
    pipValue: true,
    // Not used
    volumeUnits: false,
    fee: false,
    leverage: false,
    fundingRate: false,
    shares: false,
    dividend: false,
    contracts: false,
    expirationDate: false,
    margin: false,
    optionType: false,
    strikePrice: false,
    premium: false,
  },
  
  crypto: {
    ...commonFields,
    symbol: true,
    side: true,
    status: true,
    openTime: true,
    closeTime: true,
    entry: true,
    exitPrice: true,
    stopLoss: true,
    takeProfit: true,
    pnl: true,
    pnlPercent: true,
    rMultiple: true,
    commission: true,
    strategy: true,
    setup: true,
    entryReason: true,
    exitReason: true,
    notes: true,
    emotions: true,
    riskPercent: true,
    riskAmount: true,
    // Crypto-specific
    volumeUnits: true,
    fee: true,
    leverage: true,
    fundingRate: true,
    // Not used
    volumeLots: false,
    swap: false,
    pipValue: false,
    shares: false,
    dividend: false,
    contracts: false,
    expirationDate: false,
    margin: false,
    optionType: false,
    strikePrice: false,
    premium: false,
  },
  
  stocks: {
    ...commonFields,
    symbol: true,
    side: true,
    status: true,
    openTime: true,
    closeTime: true,
    entry: true,
    exitPrice: true,
    stopLoss: true,
    takeProfit: true,
    pnl: true,
    pnlPercent: true,
    rMultiple: true,
    commission: true,
    strategy: true,
    setup: true,
    entryReason: true,
    exitReason: true,
    notes: true,
    emotions: true,
    riskPercent: true,
    riskAmount: true,
    // Stocks-specific
    shares: true,
    dividend: true,
    // Not used
    volumeLots: false,
    swap: false,
    pipValue: false,
    volumeUnits: false,
    fee: false,
    leverage: false,
    fundingRate: false,
    contracts: false,
    expirationDate: false,
    margin: false,
    optionType: false,
    strikePrice: false,
    premium: false,
  },
  
  futures: {
    ...commonFields,
    symbol: true,
    side: true,
    status: true,
    openTime: true,
    closeTime: true,
    entry: true,
    exitPrice: true,
    stopLoss: true,
    takeProfit: true,
    pnl: true,
    pnlPercent: true,
    rMultiple: true,
    commission: true,
    strategy: true,
    setup: true,
    entryReason: true,
    exitReason: true,
    notes: true,
    emotions: true,
    riskPercent: true,
    riskAmount: true,
    // Futures-specific
    contracts: true,
    expirationDate: true,
    margin: true,
    leverage: true,
    // Not used
    volumeLots: false,
    swap: false,
    pipValue: false,
    volumeUnits: false,
    fee: false,
    fundingRate: false,
    shares: false,
    dividend: false,
    optionType: false,
    strikePrice: false,
    premium: false,
  },
  
  options: {
    ...commonFields,
    symbol: true,
    side: false,
    status: true,
    openTime: true,
    closeTime: true,
    entry: true,
    exitPrice: true,
    stopLoss: false,
    takeProfit: false,
    pnl: true,
    pnlPercent: true,
    rMultiple: true,
    commission: true,
    strategy: true,
    setup: true,
    entryReason: true,
    exitReason: true,
    notes: true,
    emotions: true,
    riskPercent: true,
    riskAmount: true,
    // Options-specific
    optionType: true,
    strikePrice: true,
    premium: true,
    contracts: true,
    expirationDate: true,
    // Not used
    volumeLots: false,
    swap: false,
    pipValue: false,
    volumeUnits: false,
    fee: false,
    leverage: false,
    fundingRate: false,
    shares: false,
    dividend: false,
    margin: false,
  },
  
  other: {
    ...commonFields,
    symbol: true,
    side: true,
    status: true,
    openTime: true,
    closeTime: true,
    entry: true,
    exitPrice: true,
    stopLoss: true,
    takeProfit: true,
    pnl: true,
    pnlPercent: true,
    rMultiple: true,
    commission: true,
    strategy: true,
    setup: true,
    entryReason: true,
    exitReason: true,
    notes: true,
    emotions: true,
    riskPercent: true,
    riskAmount: true,
    volumeLots: true,
    volumeUnits: true,
    swap: true,
    pipValue: false,
    fee: true,
    leverage: true,
    fundingRate: false,
    shares: false,
    dividend: false,
    contracts: true,
    expirationDate: false,
    margin: false,
    optionType: false,
    strikePrice: false,
    premium: false,
  },
};

export const getFieldsForMarket = (market: MarketType): MarketFieldConfig => {
  return MARKET_FIELDS[market] || MARKET_FIELDS.other;
};
