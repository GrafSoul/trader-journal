import { Link } from "react-router-dom";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-default-500">{t("common.notFound")}</p>
      <Button as={Link} to="/" color="primary">
        {t("common.goHome")}
      </Button>
    </div>
  );
};

export default NotFoundPage;
