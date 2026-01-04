import { Outlet } from "react-router-dom";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/store/hooks";
import { signOut } from "@/services/authService";
import { useTheme } from "@/hooks/useTheme";
import { LogOut, Sun, Moon } from "lucide-react";

export const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();

  const currentLang = i18n.language?.startsWith("ru") ? "ru" : "en";

  const toggleLanguage = () => {
    const newLang = currentLang === "ru" ? "en" : "ru";
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    dispatch(signOut());
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - TODO: implement */}
      <aside className="hidden w-64 border-r border-divider bg-content1 lg:block">
        <div className="p-4">
          <h2 className="text-xl font-bold">Trader Journal</h2>
        </div>
        {/* Navigation - TODO: implement */}
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-divider bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>

            <div className="flex items-center gap-2">
              <Button
                variant="flat"
                size="sm"
                onPress={toggleLanguage}
                className="min-w-[70px] font-medium">
                {currentLang === "ru" ? "EN" : "RU"}
              </Button>

              <Button
                variant="flat"
                size="sm"
                isIconOnly
                onPress={toggleTheme}
                aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </Button>

              <Button
                variant="flat"
                size="sm"
                onPress={handleLogout}
                startContent={<LogOut size={16} />}>
                {t("auth.logout")}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
