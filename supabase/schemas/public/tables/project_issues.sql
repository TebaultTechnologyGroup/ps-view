CREATE TABLE "public"."project_issues" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "project_id"             uuid                     NOT NULL,
  "issue_number"           integer                  NOT NULL,
  "title"                  text                     NOT NULL,
  "description"            text,
  "action_plan"            text,
  "resolution"             text,
  "raised_by"              uuid,
  "raised_date"            date                     NOT NULL DEFAULT now(),
  "owner_id"               uuid,
  "category_id"            uuid,
  "severity"               text,
  "priority"               text,
  "has_budget_impact"      boolean                  DEFAULT false,
  "has_schedule_impact"    boolean                  DEFAULT false,
  "has_scope_impact"       boolean                  DEFAULT false,
  "estimated_cost_impact"  integer                  DEFAULT 0,
  "estimated_days_delayed" integer                  DEFAULT 0,
  "currency"               text                     DEFAULT '$'::text,
  "status"                 text                     DEFAULT 'New'::text,
  "target_date"            date,
  "actual_date"            date,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"             uuid,
  "updated_by"             uuid,
  "deleted"                boolean                  DEFAULT false,
  CONSTRAINT "project_issues_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.issue_categories(id),
  CONSTRAINT "project_issues_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_issues_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT "project_issues_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT "project_issues_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES public.users(id)
);

ALTER TABLE "public"."project_issues"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."project_issues"
  ADD COLUMN "issue_id" text GENERATED ALWAYS AS (('I'::text || (issue_number)::text)) STORED;

CREATE TRIGGER project_issues_assign_number
  BEFORE INSERT ON public.project_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.project_issues_assign_number();

CREATE POLICY "project_issues_admin" ON "public"."project_issues"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_issues_select" ON "public"."project_issues"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_issues.project_id)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_issues" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_issues" TO "service_role";

REVOKE ALL ON TABLE "public"."project_issues" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_issues" TO "postgres";
