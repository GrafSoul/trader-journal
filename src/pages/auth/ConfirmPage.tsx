import { Card, CardBody, CardHeader } from "@heroui/react";
import { useTranslation } from "react-i18next";

const ConfirmPage = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex-col items-center gap-2 pb-0 pt-6 px-4">
        <div className="mb-2 text-5xl">📧</div>
        <h1 className="text-2xl font-bold">{t("auth.checkEmail")}</h1>
      </CardHeader>
      <CardBody className="text-center">
        <p className="text-default-500">{t("auth.checkEmailDescription")}</p>
      </CardBody>
    </Card>
  );
};

export default ConfirmPage;
