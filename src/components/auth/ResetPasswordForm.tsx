import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePassword, signOut } from "@/services/authService";
import { clearAuthError, resetAuthStatus } from "@/store/slices/authSlice";
import { Statuses } from "@/store/statuses/statuses";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";
import { Eye, EyeOff, X, Check, AlertCircle, CheckCircle } from "lucide-react";
import { PasswordValidator } from "./PasswordValidator";

export const ResetPasswordForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields, isValid, isDirty },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const watchPassword = watch("password");
  const watchConfirmPassword = watch("confirmPassword");

  useEffect(() => {
    dispatch(resetAuthStatus());
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isSubmitted && status === Statuses.SUCCEEDED && !error) {
      setPasswordUpdated(true);
      // Sign out and redirect to login after 2 seconds
      setTimeout(async () => {
        await dispatch(signOut());
        navigate("/auth/login", { replace: true });
      }, 2000);
    }
  }, [status, error, dispatch, isSubmitted, navigate]);

  const onSubmit = (data: ResetPasswordFormData) => {
    setIsSubmitted(true);
    dispatch(updatePassword(data.password));
  };

  const isLoading = status === Statuses.LOADING;

  if (passwordUpdated) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-xl font-semibold">{t("auth.passwordUpdated")}</h2>
        <p className="text-default-500">{t("auth.redirecting")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {t(`errors.${error}`) !== `errors.${error}`
            ? t(`errors.${error}`)
            : error}
        </div>
      )}

      <div>
        <Input
          {...register("password")}
          type={showPassword ? "text" : "password"}
          label={t("auth.newPassword")}
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
        {t("auth.resetPassword")}
      </Button>
    </form>
  );
};
