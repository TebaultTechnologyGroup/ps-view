SET local check_function_bodies = off;

CREATE TABLE "public"."customers" (
  "id"   uuid NOT NULL,
  "name" text NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."customers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."groups" (
  "id"          uuid                     NOT NULL,
  "name"        text,
  "customer_id" uuid,
  "deleted"     boolean                  DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  CONSTRAINT "groups_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."groups"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."portfolio_projects" (
  "project_id"   uuid                     NOT NULL,
  "portfolio_id" uuid                     NOT NULL,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by"   uuid
);

ALTER TABLE "public"."portfolio_projects"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."portfolios" (
  "id"          uuid                     NOT NULL,
  "name"        text,
  "customer_id" uuid,
  "deleted"     boolean                  DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  CONSTRAINT "portfolios_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."portfolios"
  ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE "public"."project_types" (
  "id"          uuid    NOT NULL,
  "name"        text,
  "description" uuid,
  "active"      boolean DEFAULT false,
  CONSTRAINT "project_types_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."project_types"
  ENABLE ROW LEVEL SECURITY;

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
  CONSTRAINT "projects_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."projects"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_groups" (
  "group_id"   uuid                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by" uuid,
  CONSTRAINT "user_groups_pkey" PRIMARY KEY (group_id, user_id)
);

ALTER TABLE "public"."user_groups"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."users" (
  "id"           uuid                     NOT NULL,
  "auth_id"      uuid,
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
  CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  begin
    insert into public.users (id, email) values (new.id, new.email);
    return new;
  end;
  $function$;

ALTER TABLE "public"."groups"
  ADD CONSTRAINT "groups_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE "public"."portfolios"
  ADD CONSTRAINT "portfolios_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_type_fk" FOREIGN KEY (type_id) REFERENCES public.project_types(id);

ALTER TABLE "public"."user_groups"
  ADD CONSTRAINT "user_groups_group_fk" FOREIGN KEY (group_id) REFERENCES public.groups(id);

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE "public"."portfolios"
  ADD CONSTRAINT "portfolios_createdby_fk" FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE "public"."portfolios"
  ADD CONSTRAINT "portfolios_updatedby_fk" FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_createdby_fk" FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_owner_fk" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_updatedby_fk" FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE "public"."user_groups"
  ADD CONSTRAINT "user_groups_user_fk" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_createdby_fk" FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_updatedby_fk" FOREIGN KEY (updated_by) REFERENCES public.users(id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "customer_view" ON "public"."customers"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY "portfolio_projects_access" ON "public"."portfolio_projects"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY "portfolio_access" ON "public"."portfolios"
  FOR ALL
  TO PUBLIC
  USING (((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'CAMUNDA'::text)))) OR (customer_id = ( SELECT users.customer_id
   FROM public.users
  WHERE (users.id = auth.uid())))));

CREATE POLICY "project_permission_access" ON "public"."project_permissions"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY "project_status_reports_access" ON "public"."project_status_reports"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY "project_types_access" ON "public"."project_types"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY "admin_projects" ON "public"."projects"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'CAMUNDA'::text)))));

CREATE POLICY "project_access" ON "public"."projects"
  FOR ALL
  TO PUBLIC
  USING (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.project_permissions pp
  WHERE ((pp.project_id = projects.id) AND (((pp.type = 'user'::text) AND (pp.target_id = auth.uid())) OR ((pp.type = 'group'::text) AND (EXISTS ( SELECT 1
           FROM public.user_groups ug
          WHERE ((ug.group_id = pp.target_id) AND (ug.user_id = auth.uid()))))) OR ((pp.type = 'customer'::text) AND (pp.target_id = ( SELECT u.customer_id
           FROM public.users u
          WHERE (u.id = auth.uid()))))))))));

CREATE POLICY "project_permission_access" ON "public"."projects"
  FOR SELECT
  TO PUBLIC
  USING (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.project_permissions pp
  WHERE ((pp.project_id = projects.id) AND (((pp.type = 'user'::text) AND (pp.target_id = auth.uid())) OR ((pp.type = 'group'::text) AND (EXISTS ( SELECT 1
           FROM public.user_groups ug
          WHERE ((ug.group_id = pp.target_id) AND (ug.user_id = auth.uid()))))) OR ((pp.type = 'customer'::text) AND (pp.target_id = ( SELECT u.customer_id
           FROM public.users u
          WHERE (u.id = auth.uid()))))))))));

CREATE POLICY "access_user_groups" ON "public"."user_groups"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."customers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."groups" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."groups" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."groups" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."groups" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."portfolio_projects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."portfolios" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_permissions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status_reports" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_status_reports" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status_reports" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_status_reports" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_types" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_types" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_types" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_types" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."projects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_groups" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_groups" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_groups" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_groups" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."users" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "service_role";
