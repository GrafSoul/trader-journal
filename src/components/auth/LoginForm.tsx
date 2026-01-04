import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button, Input, Divider } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signIn } from "@/services/authService";
import { clearAuthError, resetAuthStatus } from "@/store/slices/authSlice";
import { Statuses } from "@/store/statuses/statuses";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useEffect, useState } from "react";
import { Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";

export const LoginForm = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields, isValid, isDirty },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const watchEmail = watch("email");
  const watchPassword = watch("password");

  useEffect(() => {
    dispatch(resetAuthStatus());
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const onSubmit = (data: LoginFormData) => {
    dispatch(signIn(data));
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

      <Input
        {...register("password")}
        type={showPassword ? "text" : "password"}
        label={t("auth.password")}
        placeholder="••••••••"
        isInvalid={!!errors.password}
        errorMessage={errors.password && t(errors.password.message as string)}
        isDisabled={isLoading}
        autoComplete="current-password"
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

      <div className="flex justify-end">
        <Link
          to="/auth/forgot-password"
          className="text-sm text-primary hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </div>

      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        isDisabled={!isValid || !isDirty || isLoading}
        className="w-full">
        {t("auth.signIn")}
      </Button>

      <Divider className="my-2" />

      <p className="text-center text-sm text-default-500">
        {t("auth.noAccount")}{" "}
        <Link to="/auth/register" className="text-primary hover:underline">
          {t("auth.signUp")}
        </Link>
      </p>
    </form>
  );
};
