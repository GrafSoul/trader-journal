import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

import { RootLayout } from "@/layouts/RootLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

// Lazy load pages for better performance
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("@/pages/auth/ForgotPasswordPage")
);
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const CallbackPage = lazy(() => import("@/pages/auth/CallbackPage"));
const ConfirmPage = lazy(() => import("@/pages/auth/ConfirmPage"));

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TradesPage = lazy(() => import("@/pages/trades/TradesPage"));
const NewTradePage = lazy(() => import("@/pages/trades/NewTradePage"));
const TradeDetailPage = lazy(() => import("@/pages/trades/TradeDetailPage"));
const EditTradePage = lazy(() => import("@/pages/trades/EditTradePage"));
const ImportPage = lazy(() => import("@/pages/ImportPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Suspense wrapper for lazy components

const withSuspense = (
  Component: React.LazyExoticComponent<React.ComponentType>
) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Auth routes (public)
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          { path: "login", element: withSuspense(LoginPage) },
          { path: "register", element: withSuspense(RegisterPage) },
          {
            path: "forgot-password",
            element: withSuspense(ForgotPasswordPage),
          },
          { path: "reset-password", element: withSuspense(ResetPasswordPage) },
          { path: "callback", element: withSuspense(CallbackPage) },
          { path: "confirm", element: withSuspense(ConfirmPage) },
        ],
      },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { index: true, element: withSuspense(DashboardPage) },
              { path: "dashboard", element: withSuspense(DashboardPage) },
              { path: "trades", element: withSuspense(TradesPage) },
              { path: "trades/new", element: withSuspense(NewTradePage) },
              { path: "trades/:id", element: withSuspense(TradeDetailPage) },
              { path: "trades/:id/edit", element: withSuspense(EditTradePage) },
              { path: "import", element: withSuspense(ImportPage) },
              { path: "settings", element: withSuspense(SettingsPage) },
            ],
          },
        ],
      },

      // 404
      { path: "*", element: withSuspense(NotFoundPage) },
    ],
  },
]);
