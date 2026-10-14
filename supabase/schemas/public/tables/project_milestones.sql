CREATE TABLE "public"."project_milestones" (
  "id"               uuid                     NOT NULL,
  "project_id"       uuid                     NOT NULL,
  "milestone_number" integer                  NOT NULL,
  "title"            text                     NOT NULL,
  "description"      text,
  "notes"            text,
  "owner_id"         uuid,
  "status"           text                     NOT NULL DEFAULT 'not_started'::text,
  "planned_date"     date,
  "forecast_date"    date,
  "actual_date"      date,
  "deleted"          boolean                  NOT NULL DEFAULT false,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"       uuid,
  "updated_by"       uuid,
  CONSTRAINT "project_milestones_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_milestones_project_number_key" UNIQUE (project_id, milestone_number),
  CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT "project_milestones_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id)
);

ALTER TABLE "public"."project_milestones"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."project_milestones"
  ADD COLUMN "milestone_id" text GENERATED ALWAYS AS (('M'::text || (milestone_number)::text)) STORED;

CREATE TRIGGER project_milestones_assign_number
  BEFORE INSERT ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.project_milestones_assign_number();

CREATE POLICY "project_milestones_admin" ON "public"."project_milestones"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_milestones_select" ON "public"."project_milestones"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_milestones.project_id)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_milestones" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_milestones" TO "service_role";

REVOKE ALL ON TABLE "public"."project_milestones" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_milestones" TO "postgres";
