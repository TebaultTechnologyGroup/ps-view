CREATE TABLE "public"."issue_categories" (
  "id"         uuid NOT NULL DEFAULT gen_random_uuid(),
  "locale_tag" text NOT NULL,
  CONSTRAINT "issue_categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."issue_categories"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "issue_categories_access" ON "public"."issue_categories"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."issue_categories" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."issue_categories" TO "service_role";

REVOKE ALL ON TABLE "public"."issue_categories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."issue_categories" TO "postgres";
