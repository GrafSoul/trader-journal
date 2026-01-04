import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { Statuses } from "@/store/statuses/statuses";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Header } from "@/components/ui/Header";

export const AuthLayout = () => {
  const { isAuthenticated, status } = useAppSelector((state) => state.auth);

  // Show loading while checking auth
  if (status === Statuses.LOADING || status === Statuses.IDLE) {
    return <LoadingScreen />;
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
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
