import { useTranslation } from "react-i18next";

const SettingsPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("settings.title")}</h1>
      {/* TODO: Settings forms */}
      <p className="text-default-500">{t("common.comingSoon")}</p>
    </div>
  );
};

export default SettingsPage;
