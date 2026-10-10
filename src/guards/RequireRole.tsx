import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "@/guards/AppContext";
import { homeFor } from "@/guards/homeFor";

// Must be nested inside ProtectedRoutes. Sends users with the wrong role to their own home.
// This is UX only; RLS is what actually protects the data.
function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to={user ? homeFor(user.role) : "/"} replace />;
  }

  return <Outlet />;
}

// routes.ts can't use JSX, so expose ready-made components.
export const CamundaOnly = () => <RequireRole role="CAMUNDA" />;
export const CustomerOnly = () => <RequireRole role="CUSTOMER" />;
