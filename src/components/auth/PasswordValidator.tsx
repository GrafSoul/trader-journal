import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";

interface PasswordValidatorProps {
  password: string;
  show: boolean;
}

interface ValidationRule {
  id: string;
  labelKey: string;
  test: (password: string) => boolean;
}

export const PasswordValidator = ({
  password,
  show,
}: PasswordValidatorProps) => {
  const { t } = useTranslation();

  const rules: ValidationRule[] = [
    {
      id: "length",
      labelKey: "validation.passwordMin",
      test: (pwd) => pwd.length >= 8,
    },
    {
      id: "uppercase",
      labelKey: "validation.passwordUppercase",
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      id: "lowercase",
      labelKey: "validation.passwordLowercase",
      test: (pwd) => /[a-z]/.test(pwd),
    },
    {
      id: "number",
      labelKey: "validation.passwordNumber",
      test: (pwd) => /[0-9]/.test(pwd),
    },
    {
      id: "symbol",
      labelKey: "validation.passwordSymbol",
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    },
  ];

  if (!show) return null;

  const allValid = rules.every((rule) => rule.test(password));

  return (
    <div className="mt-2 rounded-lg border border-divider bg-content2 p-3">
      <p className="mb-2 text-sm font-medium text-foreground">
        {t("validation.passwordRequirements")}
      </p>
      <div className="flex flex-col gap-1">
        {rules.map((rule) => {
          const isValid = rule.test(password);
          return (
            <div key={rule.id} className="flex items-center gap-2">
              {isValid ? (
                <Check size={16} className="text-success" />
              ) : (
                <X size={16} className="text-danger" />
              )}
              <span
                className={`text-sm ${
                  isValid ? "text-success" : "text-default-500"
                }`}>
                {t(rule.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
      {allValid && (
        <p className="mt-2 text-sm text-success">
          ✓ {t("validation.passwordStrong")}
        </p>
      )}
    </div>
  );
};
