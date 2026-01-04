import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Divider } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signUp } from "@/services/authService";
import { clearAuthError, resetAuthStatus } from "@/store/slices/authSlice";
import { Statuses } from "@/store/statuses/statuses";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { useEffect, useState } from "react";
import { Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";
import { PasswordValidator } from "./PasswordValidator";

export const RegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error, user } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields, isValid, isDirty },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchDisplayName = watch("displayName");
  const watchPassword = watch("password");
  const watchEmail = watch("email");
  const watchConfirmPassword = watch("confirmPassword");

  useEffect(() => {
    dispatch(resetAuthStatus());
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  // Redirect to confirm page after successful registration
  useEffect(() => {
    if (status === Statuses.SUCCEEDED && user && !user.email_confirmed_at) {
      navigate("/auth/confirm");
    }
  }, [status, user, navigate]);

  const onSubmit = (data: RegisterFormData) => {
    dispatch(
      signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      })
    );
  };

  const isLoading = status === Statuses.LOADING;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {t(`errors.${error}`) !== `errors.${error}`
            ? t(`errors.${error}`)
            : error}
        </div>
      )}

      <Input
        {...register("displayName")}
        type="text"
        label={t("auth.displayName")}
        placeholder={t("auth.displayNamePlaceholder")}
        isInvalid={!!errors.displayName}
        errorMessage={
          errors.displayName && t(errors.displayName.message as string)
        }
        isDisabled={isLoading}
        autoComplete="name"
        endContent={
          <div className="flex items-center gap-1">
            {touchedFields.displayName &&
              watchDisplayName &&
              (errors.displayName ? (
                <AlertCircle size={18} className="text-danger" />
              ) : (
                <Check size={18} className="text-success" />
              ))}
            {watchDisplayName && (
              <button
                type="button"
                onClick={() => setValue("displayName", "")}
                className="p-1 hover:bg-default-100 rounded">
                <X size={16} className="text-default-400" />
              </button>
            )}
          </div>
        }
      />

      <Input
        {...register("email")}
        type="email"
        label={t("auth.email")}
        placeholder="email@example.com"
        isInvalid={!!errors.email}
        errorMessage={errors.email && t(errors.email.message as string)}
        isDisabled={isLoading}
        autoComplete="email"
        endContent={
          <div className="flex items-center gap-1">
            {touchedFields.email &&
              watchEmail &&
              (errors.email ? (
                <AlertCircle size={18} className="text-danger" />
              ) : (
                <Check size={18} className="text-success" />
              ))}
            {watchEmail && (
              <button
                type="button"
                onClick={() => setValue("email", "")}
                className="p-1 hover:bg-default-100 rounded">
                <X size={16} className="text-default-400" />
              </button>
            )}
          </div>
        }
      />

      <div>
        <Input
          {...register("password")}
          type={showPassword ? "text" : "password"}
          label={t("auth.password")}
          placeholder="••••••••"
          isInvalid={!!errors.password}
          isDisabled={isLoading}
          autoComplete="new-password"
          endContent={
            <div className="flex items-center gap-1">
              {touchedFields.password &&
                watchPassword &&
                (errors.password ? (
                  <AlertCircle size={18} className="text-danger" />
                ) : (
                  <Check size={18} className="text-success" />
                ))}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-default-100 rounded">
                {showPassword ? (
                  <EyeOff size={18} className="text-default-400" />
                ) : (
                  <Eye size={18} className="text-default-400" />
                )}
              </button>
              {watchPassword && (
                <button
                  type="button"
                  onClick={() => setValue("password", "")}
                  className="p-1 hover:bg-default-100 rounded">
                  <X size={16} className="text-default-400" />
                </button>
              )}
            </div>
          }
        />
        <PasswordValidator
          password={watchPassword}
          show={watchPassword.length > 0 || !!touchedFields.password}
        />
      </div>

      <Input
        {...register("confirmPassword")}
        type={showConfirmPassword ? "text" : "password"}
        label={t("auth.confirmPassword")}
        placeholder="••••••••"
        isInvalid={!!errors.confirmPassword}
        errorMessage={
          errors.confirmPassword && t(errors.confirmPassword.message as string)
        }
        isDisabled={isLoading}
        autoComplete="new-password"
        endContent={
          <div className="flex items-center gap-1">
            {touchedFields.confirmPassword &&
              watchConfirmPassword &&
              (errors.confirmPassword ? (
                <AlertCircle size={18} className="text-danger" />
              ) : (
                <Check size={18} className="text-success" />
              ))}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 hover:bg-default-100 rounded">
              {showConfirmPassword ? (
                <EyeOff size={18} className="text-default-400" />
              ) : (
                <Eye size={18} className="text-default-400" />
              )}
            </button>
            {watchConfirmPassword && (
              <button
                type="button"
                onClick={() => setValue("confirmPassword", "")}
                className="p-1 hover:bg-default-100 rounded">
                <X size={16} className="text-default-400" />
              </button>
            )}
          </div>
        }
      />

      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        isDisabled={!isValid || !isDirty || isLoading}
        className="w-full">
        {t("auth.signUp")}
      </Button>

      <Divider className="my-2" />

      <p className="text-center text-sm text-default-500">
        {t("auth.hasAccount")}{" "}
        <Link to="/auth/login" className="text-primary hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
};
