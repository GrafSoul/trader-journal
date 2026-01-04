import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
  addToast,
} from "@heroui/react";
import {
  User,
  Palette,
  Lock,
  Globe,
  Sun,
  Moon,
  Download,
  Upload,
  Save,
  Check,
  Eye,
  EyeOff,
  X,
  AlertCircle,
} from "lucide-react";
import { PasswordValidator } from "@/components/auth/PasswordValidator";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updatePassword } from "@/services/authService";
import { fetchProfile, updateProfile } from "@/services/profileService";
import { fetchTrades, bulkImportTrades } from "@/services/tradeService";
import { useTheme } from "@/hooks/useTheme";
import { Statuses } from "@/store/statuses/statuses";

type ThemeType = "light" | "dark";

const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "ru", label: "Русский" },
];

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { user, status: authStatus } = useAppSelector((state) => state.auth);
  const { profile, status: profileStatus } = useAppSelector(
    (state) => state.profile
  );
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLoading =
    authStatus === Statuses.LOADING || profileStatus === Statuses.LOADING;

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleLanguageChange = (keys: Set<string> | "all") => {
    if (keys !== "all") {
      const lang = Array.from(keys)[0];
      if (lang) {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
      }
    }
  };

  const handleThemeChange = (keys: Set<string> | "all") => {
    if (keys !== "all") {
      const selectedTheme = Array.from(keys)[0] as ThemeType;
      if (selectedTheme) {
        setTheme(selectedTheme);
      }
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordError("");
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError(t("validation.passwordMin"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("validation.passwordsNotMatch"));
      return;
    }

    try {
      await dispatch(updatePassword({ currentPassword, newPassword })).unwrap();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      addToast({
        title: t("settings.passwordUpdated"),
        color: "success",
      });
    } catch {
      addToast({
        title: t("common.error"),
        color: "danger",
      });
    }
  };

  const handleProfileUpdate = async () => {
    setProfileSaved(false);
    try {
      await dispatch(updateProfile({ display_name: displayName })).unwrap();
      setProfileSaved(true);
      addToast({
        title: t("settings.profileUpdated"),
        color: "success",
      });
    } catch {
      addToast({
        title: t("common.error"),
        color: "danger",
      });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const allTrades = await dispatch(fetchTrades({})).unwrap();

      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        settings: {
          theme: theme,
          language: i18n.language,
        },
        profile: profile,
        trades: allTrades,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trader-journal-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        title: t("settings.exportSuccess"),
        color: "success",
      });
    } catch {
      addToast({
        title: t("common.error"),
        color: "danger",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.trades || !Array.isArray(importData.trades)) {
        throw new Error("Invalid file format");
      }

      let importedCount = 0;

      // Restore settings if present
      if (importData.settings) {
        if (importData.settings.theme) {
          setTheme(importData.settings.theme as ThemeType);
        }
        if (importData.settings.language) {
          i18n.changeLanguage(importData.settings.language);
        }
      }

      // Restore profile if present
      if (importData.profile?.display_name) {
        await dispatch(
          updateProfile({ display_name: importData.profile.display_name })
        ).unwrap();
        setDisplayName(importData.profile.display_name);
      }

      // Import trades if any
      if (importData.trades.length > 0) {
        const tradesToImport = importData.trades.map(
          (trade: Record<string, unknown>) => {
            const { id, user_id, created_at, updated_at, ...tradeData } = trade;
            void id;
            void user_id;
            void created_at;
            void updated_at;
            return tradeData;
          }
        );

        await dispatch(bulkImportTrades(tradesToImport)).unwrap();
        importedCount = tradesToImport.length;
      }

      addToast({
        title: t("settings.importSuccess", { count: importedCount }),
        color: "success",
      });

      // Reset file input
      event.target.value = "";
    } catch {
      addToast({
        title: t("settings.importError"),
        color: "danger",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 text-2xl font-bold">{t("settings.title")}</h1>

      <Tabs aria-label="Settings tabs" color="primary" variant="underlined">
        {/* Profile Tab */}
        <Tab
          key="profile"
          title={
            <div className="flex items-center gap-2">
              <User size={18} />
              <span>{t("settings.profile")}</span>
            </div>
          }>
          <Card className="mt-4">
            <CardHeader className="flex flex-col items-start gap-1">
              <h3 className="text-lg font-semibold">{t("settings.profile")}</h3>
              <p className="text-sm text-default-500">
                {t("settings.profileDescription")}
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <Input
                label={t("settings.email")}
                value={user?.email || ""}
                isReadOnly
                variant="bordered"
                description={t("settings.changeEmail")}
              />
              <Input
                label={t("settings.displayName")}
                placeholder={t("settings.displayName")}
                value={displayName}
                onValueChange={setDisplayName}
                variant="bordered"
              />
              <div className="flex items-center gap-3">
                <Button
                  color="primary"
                  startContent={<Save size={18} />}
                  onPress={handleProfileUpdate}
                  isLoading={isLoading}
                  isDisabled={displayName === (profile?.display_name || "")}>
                  {t("settings.updateProfile")}
                </Button>
                {profileSaved && (
                  <span className="flex items-center gap-1 text-success">
                    <Check size={18} />
                    {t("settings.profileUpdated")}
                  </span>
                )}
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Appearance Tab */}
        <Tab
          key="appearance"
          title={
            <div className="flex items-center gap-2">
              <Palette size={18} />
              <span>{t("settings.appearance")}</span>
            </div>
          }>
          <Card className="mt-4">
            <CardHeader className="flex flex-col items-start gap-1">
              <h3 className="text-lg font-semibold">
                {t("settings.appearance")}
              </h3>
              <p className="text-sm text-default-500">
                {t("settings.appearanceDescription")}
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="gap-6">
              {/* Theme Selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                  <div>
                    <p className="font-medium">{t("settings.theme")}</p>
                    <p className="text-sm text-default-500">
                      {theme === "dark"
                        ? t("settings.dark")
                        : t("settings.light")}
                    </p>
                  </div>
                </div>
                <Select
                  className="max-w-[150px]"
                  selectedKeys={new Set([theme])}
                  onSelectionChange={(keys) =>
                    handleThemeChange(keys as Set<string>)
                  }
                  aria-label={t("settings.theme")}>
                  <SelectItem key="light" startContent={<Sun size={16} />}>
                    {t("settings.light")}
                  </SelectItem>
                  <SelectItem key="dark" startContent={<Moon size={16} />}>
                    {t("settings.dark")}
                  </SelectItem>
                </Select>
              </div>

              <Divider />

              {/* Language Selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe size={20} />
                  <div>
                    <p className="font-medium">{t("settings.language")}</p>
                    <p className="text-sm text-default-500">
                      {LANGUAGES.find((l) => l.key === i18n.language)?.label}
                    </p>
                  </div>
                </div>
                <Select
                  className="max-w-[150px]"
                  selectedKeys={new Set([i18n.language])}
                  onSelectionChange={(keys) =>
                    handleLanguageChange(keys as Set<string>)
                  }
                  aria-label={t("settings.language")}>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.key}>{lang.label}</SelectItem>
                  ))}
                </Select>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Security Tab */}
        <Tab
          key="security"
          title={
            <div className="flex items-center gap-2">
              <Lock size={18} />
              <span>{t("settings.security")}</span>
            </div>
          }>
          <Card className="mt-4">
            <CardHeader className="flex flex-col items-start gap-1">
              <h3 className="text-lg font-semibold">
                {t("settings.changePassword")}
              </h3>
              <p className="text-sm text-default-500">
                {t("settings.securityDescription")}
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                label={t("settings.currentPassword")}
                placeholder={t("settings.currentPassword")}
                value={currentPassword}
                onValueChange={setCurrentPassword}
                variant="bordered"
                endContent={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="p-1 hover:bg-default-100 rounded">
                      {showCurrentPassword ? (
                        <EyeOff size={18} className="text-default-400" />
                      ) : (
                        <Eye size={18} className="text-default-400" />
                      )}
                    </button>
                    {currentPassword && (
                      <button
                        type="button"
                        onClick={() => setCurrentPassword("")}
                        className="p-1 hover:bg-default-100 rounded">
                        <X size={16} className="text-default-400" />
                      </button>
                    )}
                  </div>
                }
              />
              <div>
                <Input
                  type={showNewPassword ? "text" : "password"}
                  label={t("settings.newPassword")}
                  placeholder={t("settings.newPassword")}
                  value={newPassword}
                  onValueChange={setNewPassword}
                  variant="bordered"
                  isInvalid={!!passwordError}
                  endContent={
                    <div className="flex items-center gap-1">
                      {newPassword &&
                        (passwordError ? (
                          <AlertCircle size={18} className="text-danger" />
                        ) : newPassword.length >= 8 ? (
                          <Check size={18} className="text-success" />
                        ) : null)}
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="p-1 hover:bg-default-100 rounded">
                        {showNewPassword ? (
                          <EyeOff size={18} className="text-default-400" />
                        ) : (
                          <Eye size={18} className="text-default-400" />
                        )}
                      </button>
                      {newPassword && (
                        <button
                          type="button"
                          onClick={() => setNewPassword("")}
                          className="p-1 hover:bg-default-100 rounded">
                          <X size={16} className="text-default-400" />
                        </button>
                      )}
                    </div>
                  }
                />
                <PasswordValidator
                  password={newPassword}
                  show={newPassword.length > 0}
                />
              </div>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                label={t("settings.confirmPassword")}
                placeholder={t("settings.confirmPassword")}
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                variant="bordered"
                isInvalid={
                  !!passwordError ||
                  (confirmPassword.length > 0 &&
                    newPassword !== confirmPassword)
                }
                errorMessage={
                  confirmPassword.length > 0 && newPassword !== confirmPassword
                    ? t("validation.passwordsNotMatch")
                    : passwordError
                }
                endContent={
                  <div className="flex items-center gap-1">
                    {confirmPassword &&
                      (newPassword !== confirmPassword ? (
                        <AlertCircle size={18} className="text-danger" />
                      ) : (
                        <Check size={18} className="text-success" />
                      ))}
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="p-1 hover:bg-default-100 rounded">
                      {showConfirmPassword ? (
                        <EyeOff size={18} className="text-default-400" />
                      ) : (
                        <Eye size={18} className="text-default-400" />
                      )}
                    </button>
                    {confirmPassword && (
                      <button
                        type="button"
                        onClick={() => setConfirmPassword("")}
                        className="p-1 hover:bg-default-100 rounded">
                        <X size={16} className="text-default-400" />
                      </button>
                    )}
                  </div>
                }
              />
              <div className="flex items-center gap-3">
                <Button
                  color="primary"
                  onPress={handlePasswordUpdate}
                  isLoading={isLoading}
                  isDisabled={
                    !currentPassword || !newPassword || !confirmPassword
                  }>
                  {t("settings.updatePassword")}
                </Button>
                {passwordSaved && (
                  <span className="flex items-center gap-1 text-success">
                    <Check size={18} />
                    {t("settings.passwordUpdated")}
                  </span>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Export/Import Data */}
          <Card className="mt-4">
            <CardHeader className="flex flex-col items-start gap-1">
              <h3 className="text-lg font-semibold">
                {t("settings.dataManagement")}
              </h3>
              <p className="text-sm text-default-500">
                {t("settings.dataManagementDescription")}
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  {t("settings.exportData")}
                </p>
                <p className="text-xs text-default-500">
                  {t("settings.exportDataDescription")}
                </p>
                <Button
                  variant="bordered"
                  startContent={<Download size={18} />}
                  onPress={handleExportData}
                  isLoading={isExporting}
                  className="w-fit">
                  {t("settings.exportData")}
                </Button>
              </div>
              <Divider />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  {t("settings.importData")}
                </p>
                <p className="text-xs text-default-500">
                  {t("settings.importDataDescription")}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button
                    as="label"
                    htmlFor="import-file"
                    variant="bordered"
                    startContent={<Upload size={18} />}
                    isLoading={isImporting}
                    className="cursor-pointer">
                    {t("settings.importData")}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
