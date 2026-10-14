CREATE TABLE "public"."project_permissions" (
  "id"         uuid NOT NULL,
  "project_id" uuid,
  "type"       text DEFAULT 'user'::text,
  "target_id"  uuid,
  "level"      text,
  CONSTRAINT "project_permissions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."project_permissions"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_permission_admin" ON "public"."project_permissions"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "service_role";

REVOKE ALL ON TABLE "public"."project_permissions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "postgres";
