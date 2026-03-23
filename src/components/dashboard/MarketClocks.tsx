import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Clock } from "lucide-react";
import {
  MARKET_CLOCK_SESSIONS,
  isMarketOpen,
  type MarketClockSession,
} from "@/utils/tradingSessions";

/** Format seconds into "Xh Ym" or "Ym Zs" */
function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.floor(totalSeconds % 60);
  return `${m}m ${s}s`;
}

/** Get seconds until session opens or closes */
function getSecondsUntilChange(
  now: Date,
  session: MarketClockSession,
  open: boolean,
): number {
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcS = now.getUTCSeconds();
  const currentSecs = utcH * 3600 + utcM * 60 + utcS;
  const targetHour = open ? session.closeHourUTC : session.openHourUTC;
  const targetSecs = Math.floor(targetHour) * 3600 + (targetHour % 1) * 3600;
  let diff = targetSecs - currentSecs;
  if (diff <= 0) diff += 86400;
  return diff;
}

/** Progress 0..1 of how far through the session we are */
function getSessionProgress(now: Date, session: MarketClockSession): number {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  let duration: number;
  let elapsed: number;

  if (session.crossesMidnight) {
    duration = (24 - session.openHourUTC) + session.closeHourUTC;
    elapsed = h >= session.openHourUTC ? h - session.openHourUTC : (24 - session.openHourUTC) + h;
  } else {
    duration = session.closeHourUTC - session.openHourUTC;
    elapsed = h - session.openHourUTC;
  }

  return Math.min(1, Math.max(0, elapsed / duration));
}

const SESSION_COLORS: Record<string, { accent: string; bg: string; border: string; bar: string }> = {
  tokyo:   { accent: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/50",   bar: "bg-amber-400" },
  sydney:  { accent: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/50",    bar: "bg-cyan-400" },
  london:  { accent: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/50",    bar: "bg-blue-400" },
  newyork: { accent: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/50",  bar: "bg-violet-400" },
};

const SESSION_FLAGS: Record<string, string> = {
  tokyo:   "🇯🇵",
  sydney:  "🇦🇺",
  london:  "🇬🇧",
  newyork: "🇺🇸",
};

export const MarketClocks = () => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeCount = MARKET_CLOCK_SESSIONS.filter((s) => isMarketOpen(now, s)).length;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-default-500" />
          <h3 className="text-lg font-semibold">{t("dashboard.marketClocks")}</h3>
        </div>
        {activeCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            {activeCount === 1
              ? t("dashboard.oneSessionActive")
              : t("dashboard.sessionsActive", { count: activeCount })}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MARKET_CLOCK_SESSIONS.map((session) => {
          const open = isMarketOpen(now, session);
          const countdown = getSecondsUntilChange(now, session, open);
          const progress = open ? getSessionProgress(now, session) : 0;
          const colors = SESSION_COLORS[session.key];
          const flag = SESSION_FLAGS[session.key];

          const timeStr = now.toLocaleTimeString("en-GB", {
            timeZone: session.timezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          return (
            <div
              key={session.key}
              className={`
                relative rounded-xl border p-4 transition-all duration-300 overflow-hidden
                ${open
                  ? `${colors.bg} ${colors.border} shadow-sm`
                  : "bg-default-50 border-default-200 dark:bg-default-100/50 opacity-70"
                }
              `}
            >
              {/* Top row: name + local time */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{flag}</span>
                  <span className="text-xs font-medium text-default-500 uppercase tracking-wide">
                    {t(`dashboard.markets.${session.key}`)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-default-400">
                  <Clock size={11} />
                  <span className="text-xs font-mono tabular-nums">{timeStr}</span>
                </div>
              </div>

              {/* HERO: countdown */}
              <div className="mb-3">
                <p className={`text-[11px] font-medium mb-0.5 ${open ? colors.accent : "text-default-400"}`}>
                  {open ? t("dashboard.closesIn2") : t("dashboard.opensIn2")}
                </p>
                <p className={`text-2xl font-mono font-bold tabular-nums leading-none ${open ? colors.accent : "text-default-600 dark:text-default-300"}`}>
                  {formatCountdown(countdown)}
                </p>
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`
                    inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                    ${open
                      ? "bg-success/15 text-success"
                      : "bg-default-200/80 text-default-500 dark:bg-default-200/30"
                    }
                  `}
                >
                  {open && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                    </span>
                  )}
                  {open ? t("dashboard.sessionOpen") : t("dashboard.sessionClosed")}
                </span>
              </div>

              {/* Progress bar (only for open sessions) */}
              {open && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-default-200/50 dark:bg-default-700/50">
                  <div
                    className={`h-full transition-all duration-1000 ${colors.bar}`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
