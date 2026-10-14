CREATE TABLE "public"."projects" (
  "id"          uuid                     NOT NULL,
  "name"        text,
  "owner_id"    uuid,
  "type_id"     uuid,
  "start_date"  date,
  "end_date"    date,
  "customer_id" uuid,
  "deleted"     boolean                  DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  CONSTRAINT "projects_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT "projects_pkey" PRIMARY KEY (id),
  CONSTRAINT "projects_type_fk" FOREIGN KEY (type_id) REFERENCES public.project_types(id),
  CONSTRAINT "projects_createdby_fk" FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT "projects_owner_fk" FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT "projects_updatedby_fk" FOREIGN KEY (updated_by) REFERENCES public.users(id)
);

ALTER TABLE "public"."projects"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_admin" ON "public"."projects"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "projects_select_customer" ON "public"."projects"
  FOR SELECT
  TO "authenticated"
  USING (((public.current_user_role() = 'CUSTOMER'::text) AND public.current_user_has_project_permission(id)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "service_role";

REVOKE ALL ON TABLE "public"."projects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "postgres";
