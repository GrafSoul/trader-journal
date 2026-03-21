import { Button, Card, CardBody, CardFooter } from "@heroui/react";
import { Bot, ExternalLink, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NewsItem } from "@/types/news";
import type { AiDiscussContext } from "@/types/ai";

// ==================== PROPS ====================
interface NewsCardProps {
  item: NewsItem;
  onDiscuss?: (context: AiDiscussContext) => void;
}

// ==================== TIME AGO HELPER ====================
function formatTimeAgo(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  const isRu = locale.startsWith("ru");

  if (diffMins < 1) return isRu ? "только что" : "just now";
  if (diffMins < 60)
    return isRu ? `${diffMins} мин. назад` : `${diffMins}m ago`;
  if (diffHours < 24)
    return isRu ? `${diffHours} ч. назад` : `${diffHours}h ago`;
  return isRu ? `${diffDays} дн. назад` : `${diffDays}d ago`;
}

// ==================== OPEN LINK HELPER ====================
function openLink(url: string): void {
  if (!url) return;

  const isElectron =
    typeof window !== "undefined" && !!window.electronAPI?.openExternal;

  if (isElectron) {
    void window.electronAPI!.openExternal(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// ==================== COMPONENT ====================
export const NewsCard = ({ item, onDiscuss }: NewsCardProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language ?? "en";

  const timeAgo = formatTimeAgo(item.pubDate, locale);

  return (
    <Card
      className="w-full text-left transition-all hover:shadow-md"
      aria-label={item.title}>
      {/* Clickable area for opening article — uses <a> not <button> */}
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (window.electronAPI?.openExternal) {
            e.preventDefault();
            openLink(item.link);
          }
        }}
        className="cursor-pointer">
        {/* Image */}
        {item.imageUrl && (
          <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
            <img
              src={item.imageUrl}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.parentElement?.classList.add("hidden");
              }}
            />
          </div>
        )}

        <CardBody className="gap-2 pb-2">
          {/* Source + Time row */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-primary">
              {item.source}
            </span>
            <div className="flex shrink-0 items-center gap-1 text-xs text-default-400">
              <Clock size={12} />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {item.title}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="line-clamp-3 text-xs text-default-500 leading-relaxed">
              {item.description}
            </p>
          )}
        </CardBody>
      </a>

      {/* Footer: AI discuss + external link — outside clickable <a> */}
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        {onDiscuss && (
          <Button
            size="sm"
            variant="flat"
            startContent={<Bot size={14} />}
            onPress={() =>
              onDiscuss({
                title: item.title,
                description: item.description,
                source: item.source,
                url: item.link,
                type: "news",
              })
            }
            className="text-xs">
            {t("ai.discuss")}
          </Button>
        )}
        {item.link && (
          <ExternalLink
            size={14}
            className="shrink-0 text-default-400"
            aria-hidden="true"
          />
        )}
      </CardFooter>
    </Card>
  );
};
