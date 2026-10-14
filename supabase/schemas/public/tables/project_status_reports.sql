CREATE TABLE "public"."project_status_reports" (
  "id"                uuid                     NOT NULL,
  "project_id"        uuid,
  "project_status_id" uuid,
  "comments"          text,
  "range_start"       date,
  "range_end"         date,
  "published_at"      timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"        uuid,
  "updated_by"        uuid,
  CONSTRAINT "project_status_reports_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."project_status_reports"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_status_reports_admin" ON "public"."project_status_reports"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_status_reports_select" ON "public"."project_status_reports"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_status_reports.project_id))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status_reports" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status_reports" TO "service_role";

REVOKE ALL ON TABLE "public"."project_status_reports" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status_reports" TO "postgres";
