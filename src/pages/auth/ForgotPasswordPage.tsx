import { Card, CardBody, CardHeader } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();

  return (
    <Card className="w-full">
      <CardHeader className="flex-col items-start gap-2 pb-0 pt-6 px-6">
        <h1 className="text-2xl font-bold">{t("auth.forgotPassword")}</h1>
        <p className="text-default-500">
          {t("auth.forgotPasswordDescription")}
        </p>
      </CardHeader>
      <CardBody className="px-6 py-6">
        <ForgotPasswordForm />
      </CardBody>
    </Card>
  );
};

export default ForgotPasswordPage;
