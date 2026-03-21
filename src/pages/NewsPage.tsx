import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  Newspaper,
  RefreshCw,
  Clock,
  Plus,
  Trash2,
  Settings,
  Pencil,
  ExternalLink,
  FlaskConical,
  Check,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllNews } from "@/services/newsService";
import { fetchFeeds, addFeed, deleteFeed, updateFeed } from "@/services/feedService";
import { Statuses } from "@/store/statuses/statuses";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsFilters } from "@/components/news/NewsFilters";
import type { NewsItem, NewsFeed } from "@/types/news";

// ==================== PAGE SIZE OPTIONS ====================
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ==================== FILTER LOGIC ====================
function applyFilters(
  items: NewsItem[],
  filters: { search: string; sources: string[] },
  feedIdToName: Record<string, string>
): NewsItem[] {
  return items.filter((item) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (filters.sources.length > 0) {
      const selectedNames = filters.sources.map(
        (id) => feedIdToName[id]?.toLowerCase() ?? id.toLowerCase()
      );
      if (!selectedNames.some((name) => item.source.toLowerCase() === name)) {
        return false;
      }
    }

    return true;
  });
}

// ==================== LAST UPDATED FORMATTER ====================
function formatLastUpdated(iso: string | null, locale: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(
    locale.startsWith("ru") ? "ru-RU" : "en-US",
    { hour: "2-digit", minute: "2-digit" }
  );
}

// ==================== TEST FEED HELPER ====================
async function testFeedUrl(url: string): Promise<boolean> {
  try {
    const isElectron =
      typeof window !== "undefined" && !!window.electronAPI?.fetchRss;

    let text: string;
    if (isElectron) {
      const result = await window.electronAPI!.fetchRss(url);
      if (!result.ok || !result.data) return false;
      text = result.data;
    } else {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return false;
      text = await response.text();
    }

    // Check if it contains RSS or Atom markers
    return (
      text.includes("<rss") ||
      text.includes("<feed") ||
      text.includes("<channel") ||
      text.includes("<entry")
    );
  } catch {
    return false;
  }
}

// ==================== PAGE COMPONENT ====================
const NewsPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { items, filters, status, error, lastFetchedAt, feeds, feedsStatus } =
    useAppSelector((state) => state.news);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add/Edit feed modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingFeed, setEditingFeed] = useState<NewsFeed | null>(null);
  const [feedName, setFeedName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Feed test results: feedId -> "testing" | "valid" | "invalid"
  const [testResults, setTestResults] = useState<
    Record<string, "testing" | "valid" | "invalid">
  >({});

  // Manage feeds panel
  const [showManage, setShowManage] = useState(false);

  // Feed id -> name map for filtering
  const feedIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const feed of feeds) {
      map[feed.id] = feed.name;
    }
    return map;
  }, [feeds]);

  // Load feeds on mount, then fetch news when feeds are loaded
  useEffect(() => {
    void dispatch(fetchFeeds());
  }, [dispatch]);

  useEffect(() => {
    if (feedsStatus === Statuses.SUCCEEDED && feeds.length > 0) {
      void dispatch(fetchAllNews());
    }
  }, [dispatch, feedsStatus, feeds.length]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filteredItems = useMemo(
    () => applyFilters(items, filters, feedIdToName),
    [items, filters, feedIdToName]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const displayedItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const isLoading = status === Statuses.LOADING;
  const isFeedsLoading = feedsStatus === Statuses.LOADING;
  const lastUpdatedStr = formatLastUpdated(
    lastFetchedAt,
    i18n.language ?? "en"
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await dispatch(fetchAllNews());
    setIsRefreshing(false);
  }, [dispatch]);

  const handlePageSizeChange = (keys: Set<string> | string) => {
    const val =
      typeof keys === "string" ? keys : Array.from(keys)[0] ?? "20";
    setPageSize(Number(val));
    setPage(1);
  };

  // Open modal for adding new feed
  const handleOpenAdd = () => {
    setEditingFeed(null);
    setFeedName("");
    setFeedUrl("");
    onOpen();
  };

  // Open modal for editing existing feed
  const handleOpenEdit = (feed: NewsFeed) => {
    setEditingFeed(feed);
    setFeedName(feed.name);
    setFeedUrl(feed.url);
    onOpen();
  };

  // Save (add or update)
  const handleSave = async () => {
    if (!feedName.trim() || !feedUrl.trim()) return;
    setIsSaving(true);

    if (editingFeed) {
      await dispatch(
        updateFeed({
          id: editingFeed.id,
          name: feedName.trim(),
          url: feedUrl.trim(),
        })
      );
    } else {
      await dispatch(
        addFeed({ name: feedName.trim(), url: feedUrl.trim() })
      );
    }

    setIsSaving(false);
    setEditingFeed(null);
    setFeedName("");
    setFeedUrl("");
    onClose();
  };

  const handleDeleteFeed = async (feedId: string) => {
    await dispatch(deleteFeed(feedId));
  };

  // Test a single feed URL
  const handleTestFeed = async (feed: NewsFeed) => {
    setTestResults((prev) => ({ ...prev, [feed.id]: "testing" }));
    const isValid = await testFeedUrl(feed.url);
    setTestResults((prev) => ({
      ...prev,
      [feed.id]: isValid ? "valid" : "invalid",
    }));
  };

  // Open feed URL in new tab
  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — fixed */}
      <div className="shrink-0 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Newspaper size={24} className="text-primary" />
          <h1 className="text-2xl font-bold">{t("news.title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastFetchedAt && (
            <span className="flex items-center gap-1 text-xs text-default-400">
              <Clock size={12} />
              {t("news.lastUpdated", { time: lastUpdatedStr })}
            </span>
          )}
          <Button
            size="sm"
            variant="flat"
            color="default"
            startContent={<Settings size={14} />}
            onPress={() => setShowManage((v) => !v)}>
            {t("news.manageSources")}
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin" : ""}
              />
            }
            onPress={() => void handleRefresh()}
            isDisabled={isLoading || isRefreshing}>
            {t("news.refresh")}
          </Button>
        </div>
      </div>

      {/* Manage feeds panel — fixed */}
      {showManage && (
        <div className="shrink-0 mb-4 rounded-xl border border-default-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("news.sources")}</h2>
            <Button
              size="sm"
              color="primary"
              startContent={<Plus size={14} />}
              onPress={handleOpenAdd}>
              {t("news.addSource")}
            </Button>
          </div>
          {isFeedsLoading ? (
            <Spinner size="sm" />
          ) : feeds.length === 0 ? (
            <p className="text-sm text-default-400">{t("news.noSources")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {feeds.map((feed) => {
                const testStatus = testResults[feed.id];
                return (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-default-50 px-3 py-2">
                    {/* Feed info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {feed.name}
                      </p>
                      <p className="truncate text-xs text-default-400">
                        {feed.url}
                      </p>
                    </div>

                    {/* Test result chip */}
                    {testStatus === "testing" && (
                      <Spinner size="sm" />
                    )}
                    {testStatus === "valid" && (
                      <Chip
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<Check size={12} />}>
                        {t("news.validFeed")}
                      </Chip>
                    )}
                    {testStatus === "invalid" && (
                      <Chip
                        size="sm"
                        color="danger"
                        variant="flat"
                        startContent={<X size={12} />}>
                        {t("news.invalidFeed")}
                      </Chip>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Tooltip content={t("news.testFeed")}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="secondary"
                          isDisabled={testStatus === "testing"}
                          onPress={() => void handleTestFeed(feed)}>
                          <FlaskConical size={14} />
                        </Button>
                      </Tooltip>
                      <Tooltip content={t("news.openUrl")}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => handleOpenUrl(feed.url)}>
                          <ExternalLink size={14} />
                        </Button>
                      </Tooltip>
                      <Tooltip content={t("common.edit")}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="default"
                          onPress={() => handleOpenEdit(feed)}>
                          <Pencil size={14} />
                        </Button>
                      </Tooltip>
                      <Tooltip content={t("common.delete")}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => void handleDeleteFeed(feed.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters — fixed */}
      <div className="shrink-0 mb-4">
        <NewsFilters />
      </div>

      {/* Scrollable content area — ONLY this scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Loading state (initial) */}
        {(isLoading || isFeedsLoading) && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-default-500 text-sm">{t("news.loading")}</p>
          </div>
        )}

        {/* Error state */}
        {error && items.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-danger">{t("news.error")}</p>
            <Button
              size="sm"
              color="primary"
              onPress={() => void handleRefresh()}>
              {t("news.retry")}
            </Button>
          </div>
        )}

        {/* Empty state — filters matched nothing */}
        {!isLoading && items.length > 0 && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Newspaper size={48} className="text-default-300" />
            <p className="text-default-500">{t("news.noResults")}</p>
          </div>
        )}

        {/* Empty — no items fetched at all */}
        {!isLoading &&
          !isFeedsLoading &&
          status === Statuses.SUCCEEDED &&
          items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Newspaper size={48} className="text-default-300" />
              <p className="text-default-500">{t("news.empty")}</p>
            </div>
          )}

        {/* News grid */}
        {displayedItems.length > 0 && (
          <>
            {/* Results count + page size selector */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-default-400">
                {t("news.showing", {
                  shown: displayedItems.length,
                  total: filteredItems.length,
                })}
              </p>
              <Select
                aria-label={t("news.pageSize")}
                selectedKeys={new Set([String(pageSize)])}
                onSelectionChange={(keys) =>
                  handlePageSizeChange(keys as Set<string>)
                }
                size="sm"
                className="w-24">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={String(size)}>{String(size)}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedItems.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 pb-4 flex justify-center">
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={setPage}
                  showControls
                  size="sm"
                  color="primary"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit feed modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingFeed ? t("news.editSource") : t("news.addSource")}
          </ModalHeader>
          <ModalBody>
            <Input
              label={t("news.feedName")}
              placeholder="e.g. Reuters"
              value={feedName}
              onValueChange={setFeedName}
            />
            <Input
              label={t("news.feedUrl")}
              placeholder="https://example.com/rss"
              value={feedUrl}
              onValueChange={setFeedUrl}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              onPress={() => void handleSave()}
              isLoading={isSaving}
              isDisabled={!feedName.trim() || !feedUrl.trim()}>
              {editingFeed ? t("common.save") : t("common.create")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default NewsPage;
