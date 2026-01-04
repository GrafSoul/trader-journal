import { useTranslation } from "react-i18next";

const NewTradePage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("trades.newTrade")}</h1>
      {/* TODO: Trade form */}
      <p className="text-default-500">{t("common.comingSoon")}</p>
    </div>
  );
};

export default NewTradePage;
