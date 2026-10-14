import { createBrowserRouter, redirect } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PasswordRecovery from "./pages/PasswordRecovery";
import Dashboard from "./pages/app/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Portfolios from "./pages/admin/Portfolios";
import Projects from "./pages/admin/Projects";
import ProjectLayout from "./pages/admin/project/ProjectLayout";
import ProjectDetails from "./pages/admin/project/ProjectDetails";
import ProjectStatus from "./pages/admin/project/ProjectStatus";
import ProjectCustomerView from "./pages/admin/project/ProjectCustomerView";
import ProjectRisks from "./pages/admin/project/ProjectRisks";
import ProjectIssues from "./pages/admin/project/ProjectIssues";
import ProjectActions from "./pages/admin/project/ProjectActions";
import ProjectDependencies from "./pages/admin/project/ProjectDependencies";
import ProjectMilestones from "./pages/admin/project/ProjectMilestones";
import ProjectChangeOrders from "./pages/admin/project/ProjectChangeOrders";
import Reports from "./pages/admin/reports/Reports";
import ProjectReview from "./pages/admin/reports/ProjectReview";
import Customers from "./pages/admin/Customers";
import Users from "./pages/admin/Users";
import Groups from "./pages/admin/Groups";
import { ProtectedRoutes } from "./guards/ProtectedRoutes";
import { RedirectAuthenticated } from "./guards/RedirectAuthenticated";
import { CamundaOnly, CustomerOnly } from "./guards/RequireRole";

export const router = createBrowserRouter([
  // Outside RedirectAuthenticated: the recovery link signs the user in.
  { path: "/password-recovery", Component: PasswordRecovery },
  { path: "/auth/v1/verify", Component: PasswordRecovery },

  {
    Component: RedirectAuthenticated,
    children: [{ path: "/", Component: LandingPage }],
  },

  {
    Component: ProtectedRoutes,
    children: [
      {
        Component: CustomerOnly,
        children: [
          { path: "/app", loader: () => redirect("/app/dashboard") },
          { path: "/app/dashboard", Component: Dashboard },
        ],
      },
      {
        Component: CamundaOnly,
        children: [
          {
            path: "/admin",
            Component: AdminLayout,
            children: [
              { index: true, loader: () => redirect("/admin/dashboard") },
              { path: "dashboard", Component: AdminDashboard },
              { path: "portfolios", Component: Portfolios },
              { path: "projects", Component: Projects },
              {
                path: "projects/new",
                Component: ProjectLayout,
                children: [
                  {
                    index: true,
                    loader: () => redirect("/admin/projects/new/details"),
                  },
                  { path: "details", Component: ProjectDetails },
                ],
              },
              {
                path: "projects/:id",
                Component: ProjectLayout,
                children: [
                  {
                    index: true,
                    loader: ({ params }) =>
                      redirect(`/admin/projects/${params.id}/details`),
                  },
                  { path: "details", Component: ProjectDetails },
                  { path: "status", Component: ProjectStatus },
                  { path: "risks", Component: ProjectRisks },
                  { path: "issues", Component: ProjectIssues },
                  { path: "actions", Component: ProjectActions },
                  { path: "dependencies", Component: ProjectDependencies },
                  { path: "milestones", Component: ProjectMilestones },
                  { path: "change-orders", Component: ProjectChangeOrders },
                  { path: "customer-view", Component: ProjectCustomerView },
                ],
              },
              { path: "reports", Component: Reports },
              { path: "reports/project-review", Component: ProjectReview },
              { path: "customers", Component: Customers },
              { path: "users", Component: Users },
              { path: "groups", Component: Groups },
            ],
          },
        ],
      },
    ],
  },
]);
