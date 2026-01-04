import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { Statuses } from "@/store/statuses/statuses";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, status } = useAppSelector((state) => state.auth);

  // Show loading while checking auth
  if (status === Statuses.LOADING || status === Statuses.IDLE) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
