import { Button, Navbar, NavbarBrand, NavbarContent } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export const Header = () => {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const currentLang = i18n.language?.startsWith("ru") ? "ru" : "en";

  const toggleLanguage = () => {
    const newLang = currentLang === "ru" ? "en" : "ru";
    i18n.changeLanguage(newLang);
  };

  return (
    <Navbar maxWidth="full" className="border-b border-divider">
      <NavbarBrand>
        <p className="text-xl font-bold text-inherit">Trader Journal</p>
      </NavbarBrand>

      <NavbarContent justify="end">
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
      </NavbarContent>
    </Navbar>
  );
};
