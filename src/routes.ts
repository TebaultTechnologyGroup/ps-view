import { createBrowserRouter, redirect } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/app/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Portfolios from "./pages/admin/Portfolios";
import Projects from "./pages/admin/Projects";
import Customers from "./pages/admin/Customers";
import Users from "./pages/admin/Users";
import Groups from "./pages/admin/Groups";


export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/app/dashboard", Component: Dashboard },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, loader: () => redirect("/admin/dashboard") },
      { path: "dashboard", Component: AdminDashboard },
      { path: "portfolios", Component: Portfolios },
      { path: "projects", Component: Projects },
      { path: "customers", Component: Customers },
      { path: "users", Component: Users },
      { path: "groups", Component: Groups },
    ],
  },
]);
