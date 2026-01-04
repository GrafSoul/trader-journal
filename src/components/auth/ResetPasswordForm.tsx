import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePassword } from "@/services/authService";
import { clearAuthError } from "@/store/slices/authSlice";
import { Statuses } from "@/store/statuses/statuses";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";

export const ResetPasswordForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (status === Statuses.SUCCEEDED && !error) {
      setPasswordUpdated(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  }, [status, error, navigate]);

  const onSubmit = (data: ResetPasswordFormData) => {
    dispatch(updatePassword(data.password));
  };

  const isLoading = status === Statuses.LOADING;

  if (passwordUpdated) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">✅</div>
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

      <Input
        {...register("password")}
        type="password"
        label={t("auth.newPassword")}
        placeholder="••••••••"
        isInvalid={!!errors.password}
        errorMessage={errors.password && t(errors.password.message as string)}
        isDisabled={isLoading}
        autoComplete="new-password"
      />

      <Input
        {...register("confirmPassword")}
        type="password"
        label={t("auth.confirmPassword")}
        placeholder="••••••••"
        isInvalid={!!errors.confirmPassword}
        errorMessage={
          errors.confirmPassword && t(errors.confirmPassword.message as string)
        }
        isDisabled={isLoading}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        className="w-full">
        {t("auth.resetPassword")}
      </Button>
    </form>
  );
};
