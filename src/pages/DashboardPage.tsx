import { useTranslation } from "react-i18next";

const DashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("dashboard.title")}</h1>
      {/* TODO: Dashboard stats and widgets */}
      <p className="text-default-500">{t("common.comingSoon")}</p>
    </div>
  );
};

export default DashboardPage;
