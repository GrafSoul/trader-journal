import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { tradeSchema, type TradeFormData } from "@/lib/validations/trade";
import type { Trade } from "@/types/trade";
import { getFieldsForMarket, type MarketType } from "@/config/marketFields";
import { SymbolAutocomplete } from "./SymbolAutocomplete";

interface TradeFormProps {
  trade?: Trade | null;
  isLoading?: boolean;
  onSubmit: (data: TradeFormData) => void;
  onCancel: () => void;
}

const MARKETS = [
  "forex",
  "crypto",
  "stocks",
  "futures",
  "options",
  "other",
] as const;
const SIDES = ["long", "short"] as const;
const STATUSES = ["planned", "opened", "closed", "canceled"] as const;
const VOLUME_TYPES = ["lots", "units", "contracts"] as const;

export const TradeForm = ({
  trade,
  isLoading,
  onSubmit,
  onCancel,
}: TradeFormProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    mode: "onChange",
    defaultValues: {
      market: trade?.market ?? "forex",
      symbol: trade?.symbol ?? "",
      side: trade?.side ?? "long",
      status: trade?.status ?? "planned",
      open_time: trade?.open_time ?? null,
      close_time: trade?.close_time ?? null,
      entry: trade?.entry ?? null,
      stop_loss: trade?.stop_loss ?? null,
      take_profit: trade?.take_profit ?? null,
      exit_price: trade?.exit_price ?? null,
      volume: trade?.volume ?? 0.01,
      volume_type: trade?.volume_type ?? "lots",
      commission: trade?.commission ?? null,
      swap: trade?.swap ?? null,
      risk_percent: trade?.risk_percent ?? null,
      risk_amount: trade?.risk_amount ?? null,
      pnl: trade?.pnl ?? null,
      pnl_percent: trade?.pnl_percent ?? null,
      r_multiple: trade?.r_multiple ?? null,
      strategy: trade?.strategy ?? null,
      setup: trade?.setup ?? null,
      entry_reason: trade?.entry_reason ?? null,
      exit_reason: trade?.exit_reason ?? null,
      notes: trade?.notes ?? null,
      emotions: trade?.emotions ?? null,
    },
  });

  useEffect(() => {
    if (trade) {
      reset({
        market: trade.market,
        symbol: trade.symbol,
        side: trade.side,
        status: trade.status,
        open_time: trade.open_time,
        close_time: trade.close_time,
        entry: trade.entry,
        stop_loss: trade.stop_loss,
        take_profit: trade.take_profit,
        exit_price: trade.exit_price,
        volume: trade.volume,
        volume_type: trade.volume_type,
        commission: trade.commission,
        swap: trade.swap,
        risk_percent: trade.risk_percent,
        risk_amount: trade.risk_amount,
        pnl: trade.pnl,
        pnl_percent: trade.pnl_percent,
        r_multiple: trade.r_multiple,
        strategy: trade.strategy,
        setup: trade.setup,
        entry_reason: trade.entry_reason,
        exit_reason: trade.exit_reason,
        notes: trade.notes,
        emotions: trade.emotions,
      });
    }
  }, [trade, reset]);

  const selectedMarket = watch("market") as MarketType;
  const fields = getFieldsForMarket(selectedMarket);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Controller
          name="market"
          control={control}
          render={({ field }) => (
            <Select
              label={t("trades.fields.market")}
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                field.onChange(value);
              }}
              isDisabled={isLoading}>
              {MARKETS.map((market) => (
                <SelectItem key={market}>
                  {t(`trades.market.${market}`)}
                </SelectItem>
              ))}
            </Select>
          )}
        />

        <Controller
          name="symbol"
          control={control}
          render={({ field }) => (
            <SymbolAutocomplete
              market={selectedMarket}
              value={field.value}
              onChange={field.onChange}
              isDisabled={isLoading}
              isInvalid={!!errors.symbol}
              errorMessage={
                errors.symbol ? t(errors.symbol.message as string) : undefined
              }
            />
          )}
        />

        {fields.side && (
          <Controller
            name="side"
            control={control}
            render={({ field }) => (
              <Select
                label={t("trades.fields.side")}
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  field.onChange(value);
                }}
                isDisabled={isLoading}>
                {SIDES.map((side) => (
                  <SelectItem key={side}>{t(`trades.side.${side}`)}</SelectItem>
                ))}
              </Select>
            )}
          />
        )}

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              label={t("trades.fields.status")}
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                field.onChange(value);
              }}
              isDisabled={isLoading}>
              {STATUSES.map((status) => (
                <SelectItem key={status}>
                  {t(`trades.status.${status}`)}
                </SelectItem>
              ))}
            </Select>
          )}
        />
      </div>

      {/* Timing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register("open_time")}
          type="datetime-local"
          label={t("trades.fields.openTime")}
          placeholder=" "
          isDisabled={isLoading}
          classNames={{
            input: "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          }}
        />
        <Input
          {...register("close_time")}
          type="datetime-local"
          label={t("trades.fields.closeTime")}
          placeholder=" "
          isDisabled={isLoading}
          classNames={{
            input: "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          }}
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.entry && (
          <Input
            {...register("entry", { valueAsNumber: true })}
            type="number"
            step="any"
            label={t("trades.fields.entry")}
            isDisabled={isLoading}
          />
        )}
        {fields.stopLoss && (
          <Input
            {...register("stop_loss", { valueAsNumber: true })}
            type="number"
            step="any"
            label={t("trades.fields.stopLoss")}
            isDisabled={isLoading}
          />
        )}
        {fields.takeProfit && (
          <Input
            {...register("take_profit", { valueAsNumber: true })}
            type="number"
            step="any"
            label={t("trades.fields.takeProfit")}
            isDisabled={isLoading}
          />
        )}
        {fields.exitPrice && (
          <Input
            {...register("exit_price", { valueAsNumber: true })}
            type="number"
            step="any"
            label={t("trades.fields.exitPrice")}
            isDisabled={isLoading}
          />
        )}
      </div>

      {/* Volume - Market Specific */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.volumeLots && (
          <>
            <Input
              {...register("volume", { valueAsNumber: true })}
              type="number"
              step="0.01"
              label={t("trades.fields.volumeLots")}
              isDisabled={isLoading}
            />
            <Controller
              name="volume_type"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("trades.fields.volumeType")}
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    field.onChange(value);
                  }}
                  isDisabled={isLoading}>
                  {VOLUME_TYPES.map((type) => (
                    <SelectItem key={type}>
                      {t(`trades.volumeType.${type}`)}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />
          </>
        )}
        {fields.volumeUnits && (
          <Input
            {...register("volume", { valueAsNumber: true })}
            type="number"
            step="0.00000001"
            label={t("trades.fields.volumeUnits")}
            isDisabled={isLoading}
          />
        )}
        {fields.shares && (
          <Input
            {...register("shares", { valueAsNumber: true })}
            type="number"
            step="1"
            label={t("trades.fields.shares")}
            isDisabled={isLoading}
          />
        )}
        {fields.contracts && (
          <Input
            {...register("contracts", { valueAsNumber: true })}
            type="number"
            step="1"
            label={t("trades.fields.contracts")}
            isDisabled={isLoading}
          />
        )}
      </div>

      {/* Costs - Market Specific */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.commission && (
          <Input
            {...register("commission", { valueAsNumber: true })}
            type="number"
            step="0.01"
            label={t("trades.fields.commission")}
            isDisabled={isLoading}
          />
        )}
        {fields.swap && (
          <Input
            {...register("swap", { valueAsNumber: true })}
            type="number"
            step="0.01"
            label={t("trades.fields.swap")}
            isDisabled={isLoading}
          />
        )}
        {fields.fee && (
          <Input
            {...register("fee", { valueAsNumber: true })}
            type="number"
            step="0.01"
            label={t("trades.fields.fee")}
            isDisabled={isLoading}
          />
        )}
        {fields.leverage && (
          <Input
            {...register("leverage", { valueAsNumber: true })}
            type="number"
            step="1"
            label={t("trades.fields.leverage")}
            placeholder="10"
            isDisabled={isLoading}
          />
        )}
        {fields.margin && (
          <Input
            {...register("margin", { valueAsNumber: true })}
            type="number"
            step="0.01"
            label={t("trades.fields.margin")}
            isDisabled={isLoading}
          />
        )}
        {fields.fundingRate && (
          <Input
            {...register("funding_rate", { valueAsNumber: true })}
            type="number"
            step="0.000001"
            label={t("trades.fields.fundingRate")}
            isDisabled={isLoading}
          />
        )}
        {fields.dividend && (
          <Input
            {...register("dividend", { valueAsNumber: true })}
            type="number"
            step="0.01"
            label={t("trades.fields.dividend")}
            isDisabled={isLoading}
          />
        )}
      </div>

      {/* Options-specific fields */}
      {(fields.optionType ||
        fields.strikePrice ||
        fields.premium ||
        fields.expirationDate) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.optionType && (
            <Controller
              name="option_type"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("trades.fields.optionType")}
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    field.onChange(value);
                  }}
                  isDisabled={isLoading}>
                  <SelectItem key="call">
                    {t("trades.optionType.call")}
                  </SelectItem>
                  <SelectItem key="put">
                    {t("trades.optionType.put")}
                  </SelectItem>
                </Select>
              )}
            />
          )}
          {fields.strikePrice && (
            <Input
              {...register("strike_price", { valueAsNumber: true })}
              type="number"
              step="any"
              label={t("trades.fields.strikePrice")}
              isDisabled={isLoading}
            />
          )}
          {fields.premium && (
            <Input
              {...register("premium", { valueAsNumber: true })}
              type="number"
              step="0.01"
              label={t("trades.fields.premium")}
              isDisabled={isLoading}
            />
          )}
          {fields.expirationDate && (
            <Input
              {...register("expiration_date")}
              type="date"
              label={t("trades.fields.expirationDate")}
              isDisabled={isLoading}
            />
          )}
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          {...register("pnl", { valueAsNumber: true })}
          type="number"
          step="0.01"
          label={t("trades.fields.pnl")}
          isDisabled={isLoading}
        />
        <Input
          {...register("pnl_percent", { valueAsNumber: true })}
          type="number"
          step="0.01"
          label={t("trades.fields.pnlPercent")}
          isDisabled={isLoading}
        />
        <Input
          {...register("r_multiple", { valueAsNumber: true })}
          type="number"
          step="0.01"
          label={t("trades.fields.rMultiple")}
          isDisabled={isLoading}
        />
      </div>

      {/* Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register("strategy")}
          label={t("trades.fields.strategy")}
          isDisabled={isLoading}
        />
        <Input
          {...register("setup")}
          label={t("trades.fields.setup")}
          isDisabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Textarea
          {...register("entry_reason")}
          label={t("trades.fields.entryReason")}
          isDisabled={isLoading}
        />
        <Textarea
          {...register("exit_reason")}
          label={t("trades.fields.exitReason")}
          isDisabled={isLoading}
        />
      </div>

      <Textarea
        {...register("notes")}
        label={t("trades.fields.notes")}
        isDisabled={isLoading}
      />

      <Input
        {...register("emotions")}
        label={t("trades.fields.emotions")}
        isDisabled={isLoading}
      />

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="flat" onPress={onCancel} isDisabled={isLoading}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          isDisabled={!isValid || !isDirty || isLoading}>
          {trade ? t("common.save") : t("trades.create")}
        </Button>
      </div>
    </form>
  );
};
