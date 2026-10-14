CREATE TABLE "public"."project_status" (
  "id"         uuid NOT NULL DEFAULT gen_random_uuid(),
  "locale_tag" text NOT NULL,
  CONSTRAINT "project_status_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."project_status"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_status_access" ON "public"."project_status"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status" TO "service_role";

REVOKE ALL ON TABLE "public"."project_status" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status" TO "postgres";
