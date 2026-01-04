import { useTranslation } from "react-i18next";

const TradesPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("trades.title")}</h1>
      {/* TODO: Trades list */}
      <p className="text-default-500">{t("common.comingSoon")}</p>
    </div>
  );
};

export default TradesPage;
