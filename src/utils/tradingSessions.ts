export type TradingSessionName =
  | "asian"
  | "london"
  | "newyork"
  | "overlap_asian_london"
  | "overlap_london_ny"
  | "off_hours";

export interface TradingSession {
  name: TradingSessionName;
  startHour: number; // UTC (fractional: 14.5 = 14:30)
  endHour: number;
  color: string;
}

export const TRADING_SESSIONS: TradingSession[] = [
  { name: "asian", startHour: 0, endHour: 9, color: "#f5a524" },
  { name: "london", startHour: 8, endHour: 16.5, color: "#006FEE" },
  { name: "newyork", startHour: 14.5, endHour: 21, color: "#7828c8" },
];

/** Session display order for charts */
export const SESSION_ORDER: TradingSessionName[] = [
  "asian",
  "overlap_asian_london",
  "london",
  "overlap_london_ny",
  "newyork",
  "off_hours",
];

/** Colors per session for chart bars */
export const SESSION_COLORS: Record<TradingSessionName, string> = {
  asian: "#f5a524",
  overlap_asian_london: "#17c964",
  london: "#006FEE",
  overlap_london_ny: "#338ef7",
  newyork: "#7828c8",
  off_hours: "#71717a",
};

/**
 * Detect trading session by close_time UTC hour.
 * Overlap zones are prioritized (more specific).
 */
export function detectTradingSession(
  closeTimeISO: string,
): TradingSessionName {
  const date = new Date(closeTimeISO);
  const h = date.getUTCHours() + date.getUTCMinutes() / 60;

  // Overlaps first
  if (h >= 8 && h < 9) return "overlap_asian_london";
  if (h >= 14.5 && h < 16.5) return "overlap_london_ny";

  // Non-overlap ranges
  if (h >= 0 && h < 8) return "asian";
  if (h >= 9 && h < 14.5) return "london";
  if (h >= 16.5 && h < 21) return "newyork";

  // 21:00-00:00 UTC gap
  return "off_hours";
}

/** Market clock session definitions */
export interface MarketClockSession {
  key: string;
  timezone: string; // IANA
  openHourUTC: number;
  closeHourUTC: number;
  crossesMidnight: boolean;
}

export const MARKET_CLOCK_SESSIONS: MarketClockSession[] = [
  {
    key: "tokyo",
    timezone: "Asia/Tokyo",
    openHourUTC: 0,
    closeHourUTC: 9,
    crossesMidnight: false,
  },
  {
    key: "sydney",
    timezone: "Australia/Sydney",
    openHourUTC: 22,
    closeHourUTC: 7,
    crossesMidnight: true,
  },
  {
    key: "london",
    timezone: "Europe/London",
    openHourUTC: 8,
    closeHourUTC: 16.5,
    crossesMidnight: false,
  },
  {
    key: "newyork",
    timezone: "America/New_York",
    openHourUTC: 14.5,
    closeHourUTC: 21,
    crossesMidnight: false,
  },
];

/** Check if a market session is currently open */
export function isMarketOpen(
  now: Date,
  session: MarketClockSession,
): boolean {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (session.crossesMidnight) {
    return h >= session.openHourUTC || h < session.closeHourUTC;
  }
  return h >= session.openHourUTC && h < session.closeHourUTC;
}
