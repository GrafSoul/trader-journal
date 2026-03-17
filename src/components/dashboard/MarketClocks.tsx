import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Chip } from "@heroui/react";
import { Globe } from "lucide-react";
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

  // Target is close time if open, open time if closed
  const targetHour = open ? session.closeHourUTC : session.openHourUTC;
  const targetSecs = Math.floor(targetHour) * 3600 + (targetHour % 1) * 3600;

  let diff = targetSecs - currentSecs;
  if (diff <= 0) diff += 86400; // next day
  return diff;
}

export const MarketClocks = () => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={18} className="text-default-500" />
        <h3 className="text-lg font-semibold">
          {t("dashboard.marketClocks")}
        </h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MARKET_CLOCK_SESSIONS.map((session) => {
          const open = isMarketOpen(now, session);
          const timeStr = now.toLocaleTimeString("en-GB", {
            timeZone: session.timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
          const countdown = getSecondsUntilChange(now, session, open);
          const countdownLabel = open
            ? t("dashboard.closesIn", { time: formatCountdown(countdown) })
            : t("dashboard.opensIn", { time: formatCountdown(countdown) });

          return (
            <Card key={session.key}>
              <CardBody className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-default-500">
                      {t(`dashboard.markets.${session.key}`)}
                    </p>
                    <p className="text-xl font-mono font-bold tabular-nums">
                      {timeStr}
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    color={open ? "success" : "danger"}
                    variant="flat"
                  >
                    {open
                      ? t("dashboard.sessionOpen")
                      : t("dashboard.sessionClosed")}
                  </Chip>
                </div>
                <p className="text-xs text-default-400 mt-1 tabular-nums">
                  {countdownLabel}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
