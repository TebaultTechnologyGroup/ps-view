import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/guards/AppContext";
import { AuthLoading } from "@/guards/AuthLoading";

// Requires a signed-in user with a usable profile.
export function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  // The landing page hosts the login form. Save the location so we can send them back.
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
