import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Header } from "@/components/ui/Header";

export const AuthLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );

  // Show loading only during initial auth check
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Allow these pages even when authenticated
  const isResetPasswordPage = location.pathname === "/auth/reset-password";
  const isCallbackPage = location.pathname === "/auth/callback";

  // Redirect to dashboard if already authenticated (except special pages)
  if (isAuthenticated && !isResetPasswordPage && !isCallbackPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
