CREATE TABLE "public"."portfolio_projects" (
  "project_id"   uuid                     NOT NULL,
  "portfolio_id" uuid                     NOT NULL,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by"   uuid,
  CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY (portfolio_id, project_id),
  CONSTRAINT "portfolio_projects_portfolio_fk" FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE,
  CONSTRAINT "portfolio_projects_project_fk" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

ALTER TABLE "public"."portfolio_projects"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "service_role";

REVOKE ALL ON TABLE "public"."portfolio_projects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "postgres";
