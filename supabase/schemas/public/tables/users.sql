CREATE TABLE "public"."users" (
  "id"           uuid                     NOT NULL,
  "full_name"    text,
  "display_name" text,
  "email"        text,
  "locale"       text,
  "timezone"     text,
  "country"      text,
  "city"         text,
  "customer_id"  uuid,
  "active"       boolean                  DEFAULT true,
  "deleted"      boolean                  DEFAULT false,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"   uuid,
  "updated_by"   uuid,
  "role"         text                     NOT NULL DEFAULT 'CUSTOMER'::text,
  CONSTRAINT "users_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_createdby_fk" FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT "users_updatedby_fk" FOREIGN KEY (updated_by) REFERENCES public.users(id)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access" ON "public"."users"
  FOR ALL
  TO "authenticated"
  USING (((public.current_user_role() = 'CAMUNDA'::text) OR (id = auth.uid())))
  WITH CHECK (((public.current_user_role() = 'CAMUNDA'::text) OR ((id = auth.uid()) AND (role = public.current_user_role()))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "service_role";

REVOKE ALL ON TABLE "public"."users" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "postgres";
