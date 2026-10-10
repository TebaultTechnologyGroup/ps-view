import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/guards/AppContext";
import { AuthLoading } from "@/guards/AuthLoading";
import { homeFor } from "@/guards/homeFor";

// For public pages (landing/login): signed-in users go straight to their home.
export function RedirectAuthenticated() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  return <Outlet />;
}
