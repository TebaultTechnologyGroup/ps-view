import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AppContext";
import { Loader2 } from "lucide-react";

export function RedirectAuthenticated() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to admin if the user is authenticated and Camunda role
  // Redirect to app if authenticted and not Camunda role.
  if (user) {
    if (user.role = "CAMUNDA"){
    return <Navigate to="/admin" state={{ from: location }} replace />;    
    }else{
    return <Navigate to="/app" state={{ from: location }} replace />;
    }
  }

  return <Outlet />;
}