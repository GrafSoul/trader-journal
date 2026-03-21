import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFilters, clearFilters } from "@/store/slices/newsSlice";

// ==================== COMPONENT ====================
export const NewsFilters = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.news.filters);
  const feeds = useAppSelector((state) => state.news.feeds);

  const sourceOptions = feeds.map((f) => ({ key: f.id, label: f.name }));

  const hasActiveFilters =
    filters.search !== "" || filters.sources.length > 0;

  const handleSearchChange = (value: string) => {
    dispatch(setFilters({ search: value }));
  };

  const handleSourcesChange = (keys: Set<string> | string) => {
    const arr = typeof keys === "string" ? [keys] : Array.from(keys);
    dispatch(setFilters({ sources: arr }));
  };

  const handleClear = () => {
    dispatch(clearFilters());
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className="max-w-xs"
        placeholder={t("news.filters.searchPlaceholder")}
        value={filters.search}
        onValueChange={handleSearchChange}
        startContent={<Search size={16} className="text-default-400" />}
        isClearable
        onClear={() => handleSearchChange("")}
        size="sm"
        aria-label={t("news.filters.searchPlaceholder")}
      />

      <Select
        aria-label={t("news.filters.sources")}
        placeholder={t("news.filters.sources")}
        selectionMode="multiple"
        selectedKeys={new Set(filters.sources)}
        onSelectionChange={(keys) =>
          handleSourcesChange(keys as Set<string>)
        }
        size="sm"
        className="max-w-[200px]">
        {sourceOptions.map(({ key, label }) => (
          <SelectItem key={key}>{label}</SelectItem>
        ))}
      </Select>

      {hasActiveFilters && (
        <Button
          size="sm"
          variant="light"
          color="danger"
          startContent={<X size={14} />}
          onPress={handleClear}>
          {t("common.reset")}
        </Button>
      )}
    </div>
  );
};
