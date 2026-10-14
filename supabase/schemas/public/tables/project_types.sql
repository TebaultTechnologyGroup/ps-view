CREATE TABLE "public"."project_types" (
  "id"          uuid    NOT NULL DEFAULT gen_random_uuid(),
  "name"        text,
  "description" uuid,
  "active"      boolean DEFAULT false,
  CONSTRAINT "project_types_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."project_types"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_types_access" ON "public"."project_types"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_types" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_types" TO "service_role";

REVOKE ALL ON TABLE "public"."project_types" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_types" TO "postgres";
