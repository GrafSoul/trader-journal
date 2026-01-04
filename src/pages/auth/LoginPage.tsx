import { Card, CardBody, CardHeader } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { LoginForm } from "@/components/auth/LoginForm";

const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <Card className="w-full">
      <CardHeader className="flex-col items-start gap-2 pb-0 pt-6 px-6">
        <h1 className="text-2xl font-bold">{t("auth.login")}</h1>
        <p className="text-default-500">{t("auth.loginDescription")}</p>
      </CardHeader>
      <CardBody className="px-6 py-6">
        <LoginForm />
      </CardBody>
    </Card>
  );
};

export default LoginPage;
