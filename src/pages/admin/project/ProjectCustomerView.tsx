import { useParams } from "react-router-dom";
import CustomerDashboard from "@/pages/app/Dashboard";

// The customer dashboard for this project, as customers see it.
export default function ProjectCustomerView() {
  const { id } = useParams();
  return id ? <CustomerDashboard projectId={id} /> : null;
}
