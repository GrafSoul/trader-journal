import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader className="flex-col items-start gap-2 pb-0 pt-4 px-4">
          <h1 className="text-2xl font-bold">{t("common.appName")}</h1>
          <p className="text-default-500">
            Vite + React + TypeScript + HeroUI + i18n
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          <Select
            label={t("settings.language")}
            selectedKeys={[i18n.language]}
            onChange={(e) => changeLanguage(e.target.value)}
            size="sm">
            <SelectItem key="ru">Русский</SelectItem>
            <SelectItem key="en">English</SelectItem>
          </Select>
          <div className="flex gap-2">
            <Button color="primary">{t("auth.signIn")}</Button>
            <Button color="secondary" variant="flat">
              {t("auth.signUp")}
            </Button>
          </div>
          <p className="text-sm text-default-500">
            {t("nav.dashboard")} • {t("nav.trades")} • {t("nav.analytics")}
          </p>
        </CardBody>
      </Card>
    </main>
  );
}

export default App;
