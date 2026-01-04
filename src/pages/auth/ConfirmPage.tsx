import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const ConfirmPage = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex-col items-center gap-2 pb-0 pt-6 px-4">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">{t("auth.checkEmail")}</h1>
      </CardHeader>
      <CardBody className="text-center">
        <p className="text-default-500">{t("auth.checkEmailDescription")}</p>

        <Divider className="my-4" />

        <p className="text-sm text-default-500">
          {t("auth.alreadyConfirmed")}{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
};

export default ConfirmPage;
