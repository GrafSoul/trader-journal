import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signOut } from "@/services/authService";
import { fetchProfile } from "@/services/profileService";
import { useTheme } from "@/hooks/useTheme";
import {
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
  TrendingUp,
  Upload,
  Settings,
  CandlestickChart,
  Menu,
  X,
  Newspaper,
} from "lucide-react";

export const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.profile);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    { to: "/news", icon: Newspaper, label: t("nav.news") },
    { to: "/import", icon: Upload, label: t("nav.import") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  const sidebarContent = (
    <>
      <div className="shrink-0 flex h-[65px] items-center justify-between gap-2 px-4 border-b border-divider">
        <div className="flex items-center gap-2">
          <CandlestickChart size={28} className="text-success" />
          <h2 className="text-xl font-bold">{t("common.appName")}</h2>
        </div>
        {/* Close button - mobile only */}
        <Button
          variant="light"
          size="sm"
          isIconOnly
          className="lg:hidden"
          onPress={() => setSidebarOpen(false)}
          aria-label="Close menu">
          <X size={20} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-4">
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

      {/* Sidebar Footer — always pinned to bottom */}
      <div className="shrink-0 p-4 border-t border-divider">
        <Button
          variant="flat"
          className="w-full justify-start"
          onPress={handleLogout}
          startContent={<LogOut size={18} />}>
          {t("auth.logout")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop Sidebar — fixed, never scrolls */}
      <aside className="hidden w-64 h-full shrink-0 overflow-hidden border-r border-divider bg-content1 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Sidebar Panel */}
          <aside
            className="relative z-10 flex h-full w-72 flex-col bg-content1 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Header — fixed, never scrolls */}
        <header className="shrink-0 z-40 border-b border-divider bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4">
            {/* Left: hamburger menu (mobile) */}
            <Button
              variant="light"
              size="sm"
              isIconOnly
              className="lg:hidden"
              onPress={() => setSidebarOpen(true)}
              aria-label="Open menu">
              <Menu size={22} />
            </Button>

            {/* Right: controls */}
            <div className="flex items-center gap-4 ml-auto">
              {profile?.display_name && (
                <span className="text-default-600 hidden sm:inline">
                  {t("dashboard.greeting", { name: profile.display_name })}
                </span>
              )}
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

        {/* Page content — only this area scrolls */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
