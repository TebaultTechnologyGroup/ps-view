CREATE TABLE "public"."user_groups" (
  "group_id"   uuid                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by" uuid,
  CONSTRAINT "user_groups_group_fk" FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT "user_groups_pkey" PRIMARY KEY (group_id, user_id),
  CONSTRAINT "user_groups_user_fk" FOREIGN KEY (user_id) REFERENCES public.users(id)
);

ALTER TABLE "public"."user_groups"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_user_groups" ON "public"."user_groups"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_groups" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_groups" TO "service_role";

REVOKE ALL ON TABLE "public"."user_groups" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_groups" TO "postgres";
