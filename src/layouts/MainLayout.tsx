import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/store/hooks";
import { signOut } from "@/services/authService";
import { useTheme } from "@/hooks/useTheme";
import {
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
  TrendingUp,
  Upload,
  Settings,
} from "lucide-react";

export const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentLang = i18n.language?.startsWith("ru") ? "ru" : "en";

  const toggleLanguage = () => {
    const newLang = currentLang === "ru" ? "en" : "ru";
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    dispatch(signOut());
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/trades", icon: TrendingUp, label: t("nav.trades") },
    { to: "/import", icon: Upload, label: t("nav.import") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-divider bg-content1 lg:flex lg:flex-col">
        <div className="p-4 border-b border-divider">
          <h2 className="text-xl font-bold">{t("common.appName")}</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to !== "/dashboard" &&
                  location.pathname.startsWith(item.to));
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-default-100"
                    }`}>
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-divider">
          <Button
            variant="flat"
            className="w-full justify-start"
            onPress={handleLogout}
            startContent={<LogOut size={18} />}>
            {t("auth.logout")}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-divider bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-end px-4">
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
