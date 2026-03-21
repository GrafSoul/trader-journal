import { createAsyncThunk } from "@reduxjs/toolkit";
import type { CalendarEvent, CalendarImpact } from "@/types/calendar";
import * as types from "@/store/constants/actionTypes";

const FF_THIS_WEEK_REMOTE_JSON_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const FF_THIS_WEEK_REMOTE_XML_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";
const FF_THIS_WEEK_PROXY_JSON_URL = "/api/ff-calendar/thisweek.json";
const FF_THIS_WEEK_PROXY_XML_URL = "/api/ff-calendar/thisweek.xml";
const CALENDAR_CACHE_KEY = "trader-journal-calendar-cache-v1";
const CALENDAR_CACHE_TTL_MS = 30 * 60 * 1000;
const CALENDAR_RATE_LIMIT_KEY = "trader-journal-calendar-rate-limit-until";
const CALENDAR_RATE_LIMIT_MS = 10 * 60 * 1000;

type RawCalendarEvent = Record<string, unknown>;
type CachePayload = { fetchedAt: string; items: CalendarEvent[] };
type FetchCalendarOptions = { force?: boolean };

let inFlightCalendarRequest: Promise<CalendarEvent[]> | null = null;

async function fetchText(url: string): Promise<string> {
  const isElectron =
    typeof window !== "undefined" && !!window.electronAPI?.fetchRss;

  if (isElectron) {
    const result = await window.electronAPI!.fetchRss(url);
    if (!result.ok || !result.data) {
      throw new Error(result.error ?? "Failed to fetch calendar feed");
    }
    return result.data;
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

function getFeedUrl(kind: "json" | "xml") {
  const isElectron =
    typeof window !== "undefined" && !!window.electronAPI?.fetchRss;

  if (isElectron) {
    return kind === "json" ? FF_THIS_WEEK_REMOTE_JSON_URL : FF_THIS_WEEK_REMOTE_XML_URL;
  }

  return kind === "json" ? FF_THIS_WEEK_PROXY_JSON_URL : FF_THIS_WEEK_PROXY_XML_URL;
}

function isRateLimited(error: unknown) {
  return error instanceof Error && error.message.includes("HTTP 429");
}

function getCalendarRateLimitUntil() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(CALENDAR_RATE_LIMIT_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

function setCalendarRateLimitCooldown() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CALENDAR_RATE_LIMIT_KEY,
    String(Date.now() + CALENDAR_RATE_LIMIT_MS)
  );
}

function clearCalendarRateLimitCooldown() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CALENDAR_RATE_LIMIT_KEY);
}

function readCalendarCache(maxAgeMs?: number): CalendarEvent[] | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(CALENDAR_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed.fetchedAt || !Array.isArray(parsed.items)) return null;

    if (maxAgeMs) {
      const age = Date.now() - new Date(parsed.fetchedAt).getTime();
      if (Number.isNaN(age) || age > maxAgeMs) return null;
    }

    return parsed.items;
  } catch {
    return null;
  }
}

function writeCalendarCache(items: CalendarEvent[]) {
  if (typeof window === "undefined") return;

  const payload: CachePayload = {
    fetchedAt: new Date().toISOString(),
    items,
  };
  window.localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(payload));
}

async function fetchCalendarJson(url: string): Promise<RawCalendarEvent[]> {
  return JSON.parse(await fetchText(url)) as RawCalendarEvent[];
}

function parseXmlFeed(xml: string): RawCalendarEvent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");

  if (parserError) {
    throw new Error("Failed to parse calendar XML feed");
  }

  return Array.from(doc.querySelectorAll("event")).map((eventNode) => {
    const raw: RawCalendarEvent = {};

    Array.from(eventNode.children).forEach((child) => {
      raw[child.tagName] = child.textContent?.trim() ?? "";
    });

    return raw;
  });
}

function normalizeImpact(value: unknown): CalendarImpact {
  const raw = String(value ?? "").trim();
  if (raw === "High" || raw === "Medium" || raw === "Low" || raw === "Holiday") {
    return raw;
  }
  return "Unknown";
}

function pickString(raw: RawCalendarEvent, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function parseEvent(
  raw: RawCalendarEvent,
  index: number
): CalendarEvent | null {
  const title = pickString(raw, ["title", "event", "name"]);
  const currency = pickString(raw, ["currency", "code", "country"]).toUpperCase();
  const dateRaw = pickString(raw, ["date", "datetime", "timestamp"]);
  const timeLabel = pickString(raw, ["time"]);

  if (!title || !currency || !dateRaw) {
    return null;
  }

  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const actual = pickString(raw, ["actual"]);
  const forecast = pickString(raw, ["forecast", "consensus"]);
  const previous = pickString(raw, ["previous"]);
  const url = pickString(raw, ["url", "link"]);
  const id =
    pickString(raw, ["id"]) ||
    `this-${date.toISOString()}-${currency}-${title}-${index}`;
  const timeValue = timeLabel.toLowerCase();

  return {
    id,
    title,
    currency,
    impact: normalizeImpact(raw.impact),
    timestamp: date.toISOString(),
    dateLabel: dateRaw,
    timeLabel: timeLabel || date.toLocaleTimeString(),
    actual,
    forecast,
    previous,
    source: "forexFactory",
    week: "this",
    isAllDay: timeValue === "all day",
    isTentative: timeValue === "tentative",
    country: pickString(raw, ["country"]) || null,
    url: url || null,
  };
}

async function fetchThisWeekCalendar(): Promise<RawCalendarEvent[]> {
  try {
    return await fetchCalendarJson(getFeedUrl("json"));
  } catch (error) {
    if (isRateLimited(error)) {
      throw error;
    }
    const xml = await fetchText(getFeedUrl("xml"));
    return parseXmlFeed(xml);
  }
}

async function loadCalendarEvents(
  options: FetchCalendarOptions = {}
): Promise<CalendarEvent[]> {
  const freshCache = options.force ? null : readCalendarCache(CALENDAR_CACHE_TTL_MS);
  if (freshCache) {
    return freshCache;
  }

  if (!options.force && Date.now() < getCalendarRateLimitUntil()) {
    const staleCache = readCalendarCache();
    if (staleCache?.length) {
      return staleCache;
    }
    throw new Error("Calendar feed temporarily rate-limited");
  }

  if (inFlightCalendarRequest) {
    return inFlightCalendarRequest;
  }

  inFlightCalendarRequest = (async () => {
    try {
      const thisWeek = await fetchThisWeekCalendar();

      const parsed = thisWeek
        .map((item, index) => parseEvent(item, index))
        .filter((item): item is CalendarEvent => !!item);

      parsed.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      writeCalendarCache(parsed);
      clearCalendarRateLimitCooldown();
      return parsed;
    } catch (error) {
      if (isRateLimited(error)) {
        setCalendarRateLimitCooldown();
      }
      const staleCache = readCalendarCache();
      if (staleCache?.length) {
        return staleCache;
      }
      throw error;
    } finally {
      inFlightCalendarRequest = null;
    }
  })();

  return inFlightCalendarRequest;
}

export const fetchCalendarEvents = createAsyncThunk<
  CalendarEvent[],
  FetchCalendarOptions | undefined
>(
  types.CALENDAR_FETCH,
  async (options: FetchCalendarOptions | undefined, { rejectWithValue }) => {
    try {
      return await loadCalendarEvents(options);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch calendar"
      );
    }
  },
  {
    condition: (options, { getState }) => {
      const state = getState() as {
        calendar?: { status?: string };
      };
      if (options?.force) {
        return true;
      }
      return state.calendar?.status !== "loading";
    },
  }
);
