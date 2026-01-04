import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Divider } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signUp } from "@/services/authService";
import { clearAuthError } from "@/store/slices/authSlice";
import { Statuses } from "@/store/statuses/statuses";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { useEffect } from "react";

export const RegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error, user } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
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
    dispatch(signUp({ email: data.email, password: data.password }));
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
      />

      <Input
        {...register("password")}
        type="password"
        label={t("auth.password")}
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
