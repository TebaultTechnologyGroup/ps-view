import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/guards/AppContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login, but save the current location so we can send them back
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}