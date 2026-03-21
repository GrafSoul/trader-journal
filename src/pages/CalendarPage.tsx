import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Switch,
} from "@heroui/react";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCalendarEvents } from "@/services/calendarService";
import { Statuses } from "@/store/statuses/statuses";
import type { CalendarEvent, CalendarImpact, CalendarRangeKey } from "@/types/calendar";

const PERIODS: CalendarRangeKey[] = ["today", "tomorrow", "thisWeek", "nextWeek"];
const IMPACTS: CalendarImpact[] = ["High", "Medium", "Low", "Holiday"];
const TIMEZONE_OPTIONS = [
  "UTC",
  "Europe/London",
  "Europe/Moscow",
  "America/New_York",
  "Asia/Tokyo",
  "Asia/Tashkent",
];
const STORAGE_KEY = "trader-journal-calendar-prefs";
const DEFAULT_RANGE: CalendarRangeKey = "today";
const DEFAULT_IMPACTS: CalendarImpact[] = ["High", "Medium", "Low", "Holiday"];
const DEFAULT_TICK_MS = 30_000;
const LIVE_WINDOW_BEFORE_MS = 5 * 60 * 1000;
const LIVE_WINDOW_AFTER_MS = 10 * 60 * 1000;
const SOON_WINDOW_MS = 60 * 60 * 1000;
const REFRESH_DEFAULT_MS = 15 * 60 * 1000;
const REFRESH_NEAR_EVENT_MS = 2 * 60 * 1000;
const NOTIFICATION_OPTIONS = [5, 15, 30, 60];

type CalendarStoredPrefs = {
  range?: CalendarRangeKey;
  search?: string;
  timezone?: string;
  currencies?: string[];
  impacts?: CalendarImpact[];
  showPast?: boolean;
  showFilters?: boolean;
  trackedIds?: string[];
  notificationsEnabled?: boolean;
  notificationMinutes?: number;
  notificationsImportantOnly?: boolean;
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getCurrentWeekRange(now: Date) {
  const start = startOfDay(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = endOfDay(new Date(start));
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function getRangeBounds(range: CalendarRangeKey, now: Date) {
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(new Date(now));
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = endOfDay(new Date(tomorrowStart));
  const currentWeek = getCurrentWeekRange(now);
  const nextWeekStart = startOfDay(new Date(currentWeek.start));
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextWeekEnd = endOfDay(new Date(nextWeekStart));
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

  switch (range) {
    case "today":
      return { start: todayStart, end: endOfDay(todayStart) };
    case "tomorrow":
      return { start: tomorrowStart, end: tomorrowEnd };
    case "nextWeek":
      return { start: nextWeekStart, end: nextWeekEnd };
    case "thisWeek":
    default:
      return currentWeek;
  }
}

function formatInTimeZone(
  iso: string,
  timeZone: string,
  mode: "date" | "time" | "datetime"
) {
  const date = new Date(iso);
  const formats: Record<typeof mode, Intl.DateTimeFormatOptions> = {
    date: { timeZone, day: "2-digit", month: "short" },
    time: { timeZone, hour: "2-digit", minute: "2-digit" },
    datetime: {
      timeZone,
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  };
  return new Intl.DateTimeFormat(undefined, formats[mode]).format(date);
}

function getEventStatus(event: CalendarEvent, now: Date) {
  const diff = new Date(event.timestamp).getTime() - now.getTime();
  if (diff < -LIVE_WINDOW_AFTER_MS) return "past";
  if (diff <= LIVE_WINDOW_AFTER_MS && diff >= -LIVE_WINDOW_BEFORE_MS) return "live";
  if (diff <= SOON_WINDOW_MS) return "soon";
  return "upcoming";
}

function getStatusColor(
  status: string
): "default" | "warning" | "success" | "danger" {
  if (status === "past") return "default";
  if (status === "live") return "danger";
  if (status === "soon") return "warning";
  return "success";
}

function getImpactColor(
  impact: CalendarImpact
): "danger" | "warning" | "primary" | "default" {
  if (impact === "High") return "danger";
  if (impact === "Medium") return "warning";
  if (impact === "Low") return "primary";
  return "default";
}

function formatCountdown(targetIso: string, nowTimestamp: number) {
  const diff = new Date(targetIso).getTime() - nowTimestamp;
  if (diff <= 0) return "00:00";

  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  return `${minutes.toString().padStart(2, "0")}m`;
}

function formatRelativeEventTimeKey(targetIso: string, nowTimestamp: number) {
  const diff = new Date(targetIso).getTime() - nowTimestamp;
  const absMinutes = Math.floor(Math.abs(diff) / 60_000);

  if (diff > SOON_WINDOW_MS) {
    return null;
  }

  if (diff > 0) {
    if (absMinutes < 1) return { key: "calendar.relative.lessThanMinute" };
    return {
      key: "calendar.relative.in",
      value: formatCountdown(targetIso, nowTimestamp),
    };
  }

  if (diff >= -LIVE_WINDOW_AFTER_MS) {
    if (absMinutes < 1) return { key: "calendar.relative.justNow" };
    return {
      key: "calendar.relative.ago",
      value: absMinutes,
    };
  }

  return null;
}

const CalendarPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { items, status, error, lastFetchedAt } = useAppSelector(
    (state) => state.calendar
  );

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [range, setRange] = useState<CalendarRangeKey>(DEFAULT_RANGE);
  const [search, setSearch] = useState("");
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [impacts, setImpacts] = useState<CalendarImpact[]>(DEFAULT_IMPACTS);
  const [showPast, setShowPast] = useState(true);
  const [timezone, setTimezone] = useState(browserTimezone);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMinutes, setNotificationMinutes] = useState(15);
  const [notificationsImportantOnly, setNotificationsImportantOnly] = useState(true);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setPrefsHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as CalendarStoredPrefs;
      if (parsed.range) setRange(parsed.range);
      if (typeof parsed.search === "string") setSearch(parsed.search);
      if (parsed.timezone) setTimezone(parsed.timezone);
      if (parsed.currencies) setCurrencies(parsed.currencies);
      if (parsed.impacts?.length) setImpacts(parsed.impacts);
      if (typeof parsed.showPast === "boolean") setShowPast(parsed.showPast);
      if (typeof parsed.showFilters === "boolean") setShowFilters(parsed.showFilters);
      if (parsed.trackedIds) setTrackedIds(parsed.trackedIds);
      if (typeof parsed.notificationsEnabled === "boolean") {
        setNotificationsEnabled(parsed.notificationsEnabled);
      }
      if (typeof parsed.notificationMinutes === "number") {
        setNotificationMinutes(parsed.notificationMinutes);
      }
      if (typeof parsed.notificationsImportantOnly === "boolean") {
        setNotificationsImportantOnly(parsed.notificationsImportantOnly);
      }
    } catch {
      // ignore invalid saved state
    } finally {
      setPrefsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!prefsHydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        range,
        search,
        timezone,
        currencies,
        impacts,
        showPast,
        showFilters,
        trackedIds,
        notificationsEnabled,
        notificationMinutes,
        notificationsImportantOnly,
      } satisfies CalendarStoredPrefs)
    );
  }, [
    prefsHydrated,
    range,
    search,
    timezone,
    currencies,
    impacts,
    showPast,
    showFilters,
    trackedIds,
    notificationsEnabled,
    notificationMinutes,
    notificationsImportantOnly,
  ]);

  useEffect(() => {
    if (status === Statuses.IDLE) {
      void dispatch(fetchCalendarEvents());
    }
  }, [dispatch, status]);

  const now = new Date(nowTimestamp);
  const nextUp = useMemo(
    () =>
      items.find((event) => new Date(event.timestamp).getTime() >= nowTimestamp) ?? null,
    [items, nowTimestamp]
  );
  const bounds = getRangeBounds(range, now);

  useEffect(() => {
    const nextDiff = nextUp
      ? new Date(nextUp.timestamp).getTime() - nowTimestamp
      : Number.POSITIVE_INFINITY;
    const tickMs = nextDiff <= SOON_WINDOW_MS ? 5_000 : DEFAULT_TICK_MS;

    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, tickMs);

    return () => window.clearInterval(intervalId);
  }, [nextUp, nowTimestamp]);

  useEffect(() => {
    const nextDiff = nextUp
      ? new Date(nextUp.timestamp).getTime() - nowTimestamp
      : Number.POSITIVE_INFINITY;
    const refreshMs = nextDiff <= SOON_WINDOW_MS ? REFRESH_NEAR_EVENT_MS : REFRESH_DEFAULT_MS;

    const intervalId = window.setInterval(() => {
      void dispatch(fetchCalendarEvents({ force: true }));
    }, refreshMs);

    return () => window.clearInterval(intervalId);
  }, [dispatch, nextUp, nowTimestamp]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setNowTimestamp(Date.now());
        void dispatch(fetchCalendarEvents({ force: true }));
      }
    };

    const handleFocus = () => {
      setNowTimestamp(Date.now());
      void dispatch(fetchCalendarEvents({ force: true }));
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    items.forEach((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      const diff = eventTime - nowTimestamp;
      const notifyWindowStart = notificationMinutes * 60 * 1000;
      const shouldNotify =
        diff <= notifyWindowStart &&
        diff > Math.max(notifyWindowStart - 60_000, 0) &&
        (!notificationsImportantOnly || event.impact === "High");

      if (!shouldNotify) return;

      const notificationKey = `${event.id}-${notificationMinutes}`;
      if (notifiedEventsRef.current.has(notificationKey)) return;

      const body = `${event.currency} · ${t("calendar.startsIn", {
        value: formatCountdown(event.timestamp, nowTimestamp),
      })}`;

      new Notification(event.title, {
        body,
        tag: notificationKey,
      });

      notifiedEventsRef.current.add(notificationKey);
    });
  }, [
    items,
    nowTimestamp,
    notificationMinutes,
    notificationsEnabled,
    notificationsImportantOnly,
    t,
  ]);

  const availableCurrencies = useMemo(
    () => Array.from(new Set(items.map((item) => item.currency))).sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((event) => {
      const eventDate = new Date(event.timestamp);
      if (eventDate < bounds.start || eventDate > bounds.end) return false;
      if (!showPast && eventDate.getTime() < nowTimestamp) return false;
      if (currencies.length > 0 && !currencies.includes(event.currency)) return false;
      if (impacts.length > 0 && !impacts.includes(event.impact)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${event.title} ${event.currency} ${event.actual} ${event.forecast} ${event.previous}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    items,
    bounds.start,
    bounds.end,
    showPast,
    nowTimestamp,
    currencies,
    impacts,
    search,
  ]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    filteredItems.forEach((event) => {
      const key = formatInTimeZone(event.timestamp, timezone, "date");
      const itemsForDay = groups.get(key) ?? [];
      itemsForDay.push(event);
      groups.set(key, itemsForDay);
    });
    return Array.from(groups.entries());
  }, [filteredItems, timezone]);

  const liveNowItems = useMemo(
    () =>
      filteredItems
        .filter((event) => getEventStatus(event, new Date(nowTimestamp)) === "live")
        .slice(0, 5),
    [filteredItems, nowTimestamp]
  );

  const toggleTracked = (id: string) => {
    setTrackedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    const nextPrefs: CalendarStoredPrefs = {
      trackedIds,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPrefs));
    setRange(DEFAULT_RANGE);
    setSearch("");
    setCurrencies([]);
    setImpacts(DEFAULT_IMPACTS);
    setShowPast(true);
    setTimezone(browserTimezone);
    setShowFilters(false);
    setNotificationsEnabled(false);
    setNotificationMinutes(15);
    setNotificationsImportantOnly(true);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabled(false);
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays size={24} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
            <p className="text-sm text-default-500">{t("calendar.description")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastFetchedAt && (
            <div className="rounded-full border border-success-200 bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
              {t("calendar.lastUpdated", {
                time: formatInTimeZone(lastFetchedAt, timezone, "datetime"),
              })}
            </div>
          )}
          <Button
            size="sm"
            variant="flat"
            startContent={<Filter size={14} />}
            onPress={() => setShowFilters((prev) => !prev)}>
            {t("calendar.filters")}
          </Button>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={
              <RefreshCw
                size={14}
                className={status === Statuses.LOADING ? "animate-spin" : ""}
              />
            }
            onPress={() => void dispatch(fetchCalendarEvents({ force: true }))}>
            {t("calendar.refresh")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((period) => (
              <Button
                key={period}
                size="sm"
                variant={range === period ? "solid" : "flat"}
                color={range === period ? "primary" : "default"}
                onPress={() => setRange(period)}>
                {t(`calendar.period.${period}`)}
              </Button>
            ))}
          </div>

          {showFilters && (
            <div className="grid gap-3 rounded-xl border border-default-200 p-4 lg:grid-cols-4">
              <Input
                value={search}
                onValueChange={setSearch}
                placeholder={t("calendar.searchPlaceholder")}
                startContent={<Search size={16} className="text-default-400" />}
              />

              <Select
                label={t("calendar.timezone")}
                selectedKeys={[timezone]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string | undefined;
                  if (selected) setTimezone(selected);
                }}>
                {[timezone, ...TIMEZONE_OPTIONS]
                  .filter((value, index, array) => array.indexOf(value) === index)
                  .map((value) => (
                    <SelectItem key={value}>{value}</SelectItem>
                  ))}
              </Select>

              <Select
                label={t("calendar.currency")}
                selectionMode="multiple"
                selectedKeys={new Set(currencies)}
                onSelectionChange={(keys) => {
                  setCurrencies(Array.from(keys).map(String));
                }}>
                {availableCurrencies.map((value) => (
                  <SelectItem key={value}>{value}</SelectItem>
                ))}
              </Select>

              <Select
                label={t("calendar.impact")}
                selectionMode="multiple"
                selectedKeys={new Set(impacts)}
                onSelectionChange={(keys) => {
                  setImpacts(Array.from(keys).map(String) as CalendarImpact[]);
                }}>
                {IMPACTS.map((value) => (
                  <SelectItem key={value}>
                    {t(`calendar.impactLabel.${value}`)}
                  </SelectItem>
                ))}
              </Select>

              <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-4">
                <Switch isSelected={showPast} onValueChange={setShowPast}>
                  {t("calendar.showPast")}
                </Switch>
                <Button size="sm" variant="light" onPress={resetFilters}>
                  {t("common.reset")}
                </Button>
              </div>

              <div className="rounded-xl bg-default-50 p-4 lg:col-span-4">
                <div className="mb-3 text-sm font-semibold">
                  {t("calendar.notifications.title")}
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <Switch
                    isSelected={notificationsEnabled}
                    onValueChange={(value) => void handleNotificationToggle(value)}>
                    {t("calendar.notifications.enable")}
                  </Switch>

                  <Select
                    label={t("calendar.notifications.before")}
                    selectedKeys={[String(notificationMinutes)]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      if (selected) setNotificationMinutes(Number(selected));
                    }}>
                    {NOTIFICATION_OPTIONS.map((value) => (
                      <SelectItem key={String(value)}>
                        {t("calendar.notifications.minutes", { value })}
                      </SelectItem>
                    ))}
                  </Select>

                  <Switch
                    isSelected={notificationsImportantOnly}
                    onValueChange={setNotificationsImportantOnly}>
                    {t("calendar.notifications.importantOnly")}
                  </Switch>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {status === Statuses.LOADING && items.length === 0 && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {status !== Statuses.LOADING && filteredItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-default-300 p-8 text-center text-default-500">
              {t("calendar.empty")}
            </div>
          )}

          {liveNowItems.length > 0 && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 size={18} className="text-danger" />
                <h2 className="font-semibold text-danger">
                  {t("calendar.liveNow")}
                </h2>
              </div>
              <div className="grid gap-3">
                {liveNowItems.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-4 py-3 text-left hover:bg-white"
                    onClick={() => setSelectedEvent(event)}>
                    <div>
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-sm text-default-500">
                        {event.currency} · {t(`calendar.impactLabel.${event.impact}`)}
                      </div>
                    </div>
                    <Chip color="danger" variant="flat">
                      {t("calendar.status.live")}
                    </Chip>
                  </button>
                ))}
              </div>
            </div>
          )}

          {groupedItems.map(([group, events]) => (
            <div
              key={group}
              className="overflow-hidden rounded-xl border border-default-200">
              <div className="border-b border-default-200 bg-default-50 px-4 py-3 text-sm font-semibold">
                {group}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-default-200 bg-content1">
                      <th className="px-4 py-3 text-left">{t("calendar.table.time")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.status")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.countdown")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.currency")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.impact")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.event")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.actual")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.forecast")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.previous")}</th>
                      <th className="px-4 py-3 text-left">{t("calendar.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const statusKey = getEventStatus(event, now);
                      const tracked = trackedIds.includes(event.id);

                      return (
                        <tr
                          key={event.id}
                          className={`border-b border-default-100 align-top transition-colors ${
                            statusKey === "past"
                              ? "opacity-60"
                              : statusKey === "live"
                                ? "bg-danger-50"
                                : statusKey === "soon"
                                  ? "bg-warning-50"
                                  : ""
                          }`}>
                          <td className="whitespace-nowrap px-4 py-3">
                            {event.isAllDay
                              ? t("calendar.allDay")
                              : event.isTentative
                                ? t("calendar.tentative")
                                : formatInTimeZone(event.timestamp, timezone, "time")}
                          </td>
                          <td className="px-4 py-3">
                            <Chip size="sm" color={getStatusColor(statusKey)} variant="flat">
                              {t(`calendar.status.${statusKey}`)}
                            </Chip>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex flex-col">
                              <span
                                className={`text-base font-semibold ${
                                  statusKey === "live"
                                    ? "text-danger"
                                    : statusKey === "soon"
                                      ? "text-warning-700"
                                      : "text-primary"
                                }`}>
                                {statusKey === "past"
                                  ? "—"
                                  : formatCountdown(event.timestamp, nowTimestamp)}
                              </span>
                              {(() => {
                                const relative = formatRelativeEventTimeKey(
                                  event.timestamp,
                                  nowTimestamp
                                );
                                if (!relative) return null;

                                return (
                                  <span className="text-xs text-default-400">
                                    {t(relative.key, "value" in relative ? { value: relative.value } : undefined)}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold">{event.currency}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Chip
                              size="sm"
                              color={getImpactColor(event.impact)}
                              variant="flat">
                              {t(`calendar.impactLabel.${event.impact}`)}
                            </Chip>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-left hover:text-primary"
                              onClick={() => setSelectedEvent(event)}>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-xs text-default-400">
                                {event.week === "next"
                                  ? t("calendar.nextWeek")
                                  : t("calendar.thisWeek")}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3">{event.actual || "—"}</td>
                          <td className="px-4 py-3">{event.forecast || "—"}</td>
                          <td className="px-4 py-3">{event.previous || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={tracked ? "solid" : "flat"}
                                color={tracked ? "primary" : "default"}
                                onPress={() => toggleTracked(event.id)}>
                                {tracked ? t("calendar.untrack") : t("calendar.track")}
                              </Button>
                              {event.url && (
                                <Button
                                  as="a"
                                  href={event.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  size="sm"
                                  variant="light"
                                  isIconOnly>
                                  <ExternalLink size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="rounded-xl border border-default-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 size={18} className="text-primary" />
              <h2 className="font-semibold">{t("calendar.upNext")}</h2>
            </div>
            {!nextUp ? (
              <p className="text-sm text-default-500">{t("calendar.noUpcoming")}</p>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-default-400">
                  {formatInTimeZone(nextUp.timestamp, timezone, "datetime")}
                </div>
                <div className="text-sm font-medium text-primary">
                  {t("calendar.startsIn", {
                    value: formatCountdown(nextUp.timestamp, nowTimestamp),
                  })}
                </div>
                <div className="font-semibold">{nextUp.title}</div>
                <div className="flex flex-wrap gap-2">
                  <Chip size="sm" variant="flat">
                    {nextUp.currency}
                  </Chip>
                  <Chip
                    size="sm"
                    color={getImpactColor(nextUp.impact)}
                    variant="flat">
                    {t(`calendar.impactLabel.${nextUp.impact}`)}
                  </Chip>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => setSelectedEvent(nextUp)}>
                  {t("calendar.viewDetails")}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-default-200 p-4">
            <h2 className="mb-3 font-semibold">{t("calendar.legend")}</h2>
            <div className="flex flex-col gap-2">
              {IMPACTS.map((impact) => (
                <Chip
                  key={impact}
                  size="sm"
                  color={getImpactColor(impact)}
                  variant="flat">
                  {t(`calendar.impactLabel.${impact}`)}
                </Chip>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)}>
        <ModalContent>
          {selectedEvent && (
            <>
              <ModalHeader>{selectedEvent.title}</ModalHeader>
              <ModalBody>
                <div className="space-y-4 pb-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="flat">
                      {selectedEvent.currency}
                    </Chip>
                    <Chip
                      size="sm"
                      color={getImpactColor(selectedEvent.impact)}
                      variant="flat">
                      {t(`calendar.impactLabel.${selectedEvent.impact}`)}
                    </Chip>
                    <Chip
                      size="sm"
                      color={getStatusColor(getEventStatus(selectedEvent, now))}
                      variant="flat">
                      {t(`calendar.status.${getEventStatus(selectedEvent, now)}`)}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {t("calendar.startsIn", {
                        value: formatCountdown(selectedEvent.timestamp, nowTimestamp),
                      })}
                    </Chip>
                  </div>

                  <div>
                    <div className="text-xs text-default-400">{t("calendar.table.time")}</div>
                    <div>{formatInTimeZone(selectedEvent.timestamp, timezone, "datetime")}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-default-400">{t("calendar.table.actual")}</div>
                      <div>{selectedEvent.actual || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-default-400">{t("calendar.table.forecast")}</div>
                      <div>{selectedEvent.forecast || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-default-400">{t("calendar.table.previous")}</div>
                      <div>{selectedEvent.previous || "—"}</div>
                    </div>
                  </div>

                  {selectedEvent.url && (
                    <Button
                      as="a"
                      href={selectedEvent.url}
                      target="_blank"
                      rel="noreferrer"
                      variant="flat"
                      color="primary"
                      startContent={<ExternalLink size={14} />}>
                      {t("calendar.openSource")}
                    </Button>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CalendarPage;
