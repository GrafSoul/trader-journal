import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const EditTradePage = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        {t("trades.editTrade")} #{id}
      </h1>
      {/* TODO: Trade edit form */}
      <p className="text-default-500">{t("common.comingSoon")}</p>
    </div>
  );
};

export default EditTradePage;
