import type { Role } from "@/guards/AppContext";

export const homeFor = (role: Role) => (role === "CAMUNDA" ? "/admin" : "/app");
