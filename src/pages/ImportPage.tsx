import { useTranslation } from "react-i18next";

const ImportPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("import.title")}</h1>
      {/* TODO: Import dropzone and preview */}
      <p className="text-default-500">{t("common.comingSoon")}</p>
    </div>
  );
};

export default ImportPage;
