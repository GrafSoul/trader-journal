import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPasswordRequest } from "@/services/authService";
import { clearAuthError } from "@/store/slices/authSlice";
import { Statuses } from "@/store/statuses/statuses";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";
import { useEffect } from "react";

export const ForgotPasswordForm = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (status === Statuses.SUCCEEDED) {
      setEmailSent(true);
    }
  }, [status]);

  const onSubmit = (data: ForgotPasswordFormData) => {
    dispatch(resetPasswordRequest(data.email));
  };

  const isLoading = status === Statuses.LOADING;

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">📧</div>
        <h2 className="text-xl font-semibold">{t("auth.emailSent")}</h2>
        <p className="text-default-500">{t("auth.checkEmailDescription")}</p>
        <Link to="/auth/login" className="text-primary hover:underline">
          {t("auth.backToLogin")}
        </Link>
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

      <p className="text-sm text-default-500">{t("auth.forgotPasswordHint")}</p>

      <Input
        {...register("email")}
        type="email"
        label={t("auth.email")}
        placeholder="email@example.com"
        isInvalid={!!errors.email}
        errorMessage={errors.email && t(errors.email.message as string)}
        isDisabled={isLoading}
        autoComplete="email"
      />

      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        className="w-full">
        {t("auth.resetPassword")}
      </Button>

      <p className="text-center text-sm">
        <Link to="/auth/login" className="text-primary hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </form>
  );
};
