SET local check_function_bodies = off;

CREATE TABLE "public"."customers" (
  "id"   uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."customers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."groups" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
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

CREATE TABLE "public"."issue_categories" (
  "id"         uuid NOT NULL DEFAULT gen_random_uuid(),
  "locale_tag" text NOT NULL,
  CONSTRAINT "issue_categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."issue_categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."portfolio_projects" (
  "project_id"   uuid                     NOT NULL,
  "portfolio_id" uuid                     NOT NULL,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by"   uuid,
  CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY (portfolio_id, project_id)
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

CREATE TABLE "public"."project_actions" (
  "id"             uuid                     NOT NULL,
  "project_id"     uuid                     NOT NULL,
  "action_number"  integer                  NOT NULL,
  "title"          text                     NOT NULL,
  "description"    text,
  "resolution"     text,
  "owner_id"       uuid,
  "raised_by"      uuid,
  "raised_date"    date                     NOT NULL DEFAULT now(),
  "priority"       text                     NOT NULL DEFAULT 'medium'::text,
  "status"         text                     NOT NULL DEFAULT 'open'::text,
  "due_date"       date,
  "completed_date" date,
  "deleted"        boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"     uuid,
  "updated_by"     uuid,
  CONSTRAINT "project_actions_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_actions_project_number_key" UNIQUE (project_id, action_number)
);

ALTER TABLE "public"."project_actions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."project_change_orders" (
  "id"                    uuid                     NOT NULL,
  "project_id"            uuid                     NOT NULL,
  "change_order_number"   integer                  NOT NULL,
  "title"                 text                     NOT NULL,
  "description"           text,
  "justification"         text,
  "owner_id"              uuid,
  "requested_by"          uuid,
  "requested_date"        date                     NOT NULL DEFAULT now(),
  "status"                text                     NOT NULL DEFAULT 'draft'::text,
  "estimated_cost_impact" integer                  NOT NULL DEFAULT 0,
  "estimated_days_impact" integer                  NOT NULL DEFAULT 0,
  "currency"              text                     NOT NULL DEFAULT '$'::text,
  "approver"              text,
  "decision_date"         date,
  "deleted"               boolean                  NOT NULL DEFAULT false,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"            uuid,
  "updated_by"            uuid,
  CONSTRAINT "project_change_orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_change_orders_project_number_key" UNIQUE (project_id, change_order_number)
);

ALTER TABLE "public"."project_change_orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."project_dependencies" (
  "id"                uuid                     NOT NULL,
  "project_id"        uuid                     NOT NULL,
  "dependency_number" integer                  NOT NULL,
  "title"             text                     NOT NULL,
  "description"       text,
  "impact"            text,
  "resolution"        text,
  "dependency_type"   text                     NOT NULL DEFAULT 'external'::text,
  "direction"         text                     NOT NULL DEFAULT 'inbound'::text,
  "related_party"     text,
  "owner_id"          uuid,
  "raised_by"         uuid,
  "raised_date"       date                     NOT NULL DEFAULT now(),
  "priority"          text                     NOT NULL DEFAULT 'medium'::text,
  "status"            text                     NOT NULL DEFAULT 'open'::text,
  "due_date"          date,
  "resolved_date"     date,
  "deleted"           boolean                  NOT NULL DEFAULT false,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"        uuid,
  "updated_by"        uuid,
  CONSTRAINT "project_dependencies_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_dependencies_project_number_key" UNIQUE (project_id, dependency_number)
);

ALTER TABLE "public"."project_dependencies"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."project_issues" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "project_id"             uuid                     NOT NULL,
  "issue_number"           integer                  NOT NULL,
  "title"                  text                     NOT NULL,
  "description"            text,
  "action_plan"            text,
  "resolution"             text,
  "raised_by"              uuid,
  "raised_date"            date                     NOT NULL DEFAULT now(),
  "owner_id"               uuid,
  "category_id"            uuid,
  "severity"               text,
  "priority"               text,
  "has_budget_impact"      boolean                  DEFAULT false,
  "has_schedule_impact"    boolean                  DEFAULT false,
  "has_scope_impact"       boolean                  DEFAULT false,
  "estimated_cost_impact"  integer                  DEFAULT 0,
  "estimated_days_delayed" integer                  DEFAULT 0,
  "currency"               text                     DEFAULT '$'::text,
  "status"                 text                     DEFAULT 'New'::text,
  "target_date"            date,
  "actual_date"            date,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"             uuid,
  "updated_by"             uuid,
  "deleted"                boolean                  DEFAULT false,
  CONSTRAINT "project_issues_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."project_issues"
  ENABLE ROW LEVEL SECURITY;

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
  CONSTRAINT "project_milestones_project_number_key" UNIQUE (project_id, milestone_number)
);

ALTER TABLE "public"."project_milestones"
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

CREATE TABLE "public"."project_risks" (
  "id"          uuid                     NOT NULL,
  "project_id"  uuid                     NOT NULL,
  "title"       text                     NOT NULL,
  "description" text,
  "probability" text                     NOT NULL DEFAULT 'medium'::text,
  "impact"      text                     NOT NULL DEFAULT 'medium'::text,
  "status"      text                     NOT NULL DEFAULT 'open'::text,
  "mitigation"  text,
  "owner_id"    uuid,
  "due_date"    date,
  "deleted"     boolean                  NOT NULL DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  "risk_number" integer                  NOT NULL,
  CONSTRAINT "project_risks_impact_check" CHECK ((impact = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT "project_risks_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_risks_probability_check" CHECK ((probability = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT "project_risks_project_number_key" UNIQUE (project_id, risk_number),
  CONSTRAINT "project_risks_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'mitigated'::text, 'accepted'::text, 'closed'::text])))
);

ALTER TABLE "public"."project_risks"
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
  "id"          uuid    NOT NULL DEFAULT gen_random_uuid(),
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

ALTER TABLE "public"."project_actions"
  ADD COLUMN "action_id" text GENERATED ALWAYS AS (('A'::text || (action_number)::text)) STORED;

ALTER TABLE "public"."project_change_orders"
  ADD COLUMN "change_order_id" text GENERATED ALWAYS AS (('CO'::text || (change_order_number)::text)) STORED;

ALTER TABLE "public"."project_dependencies"
  ADD COLUMN "dependency_id" text GENERATED ALWAYS AS (('D'::text || (dependency_number)::text)) STORED;

ALTER TABLE "public"."project_issues"
  ADD COLUMN "issue_id" text GENERATED ALWAYS AS (('I'::text || (issue_number)::text)) STORED;

ALTER TABLE "public"."project_milestones"
  ADD COLUMN "milestone_id" text GENERATED ALWAYS AS (('M'::text || (milestone_number)::text)) STORED;

ALTER TABLE "public"."project_risks"
  ADD COLUMN "risk_id" text GENERATED ALWAYS AS (('R'::text || (risk_number)::text)) STORED;

CREATE OR REPLACE FUNCTION public.current_user_customer_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT customer_id FROM public.users WHERE id = auth.uid()
  $function$;

CREATE OR REPLACE FUNCTION public.current_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT role FROM public.users WHERE id = auth.uid()
  $function$;

CREATE OR REPLACE FUNCTION public.current_user_has_project_permission(p_project_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT EXISTS (
      SELECT 1
      FROM public.project_permissions pp
      WHERE pp.project_id = p_project_id
        AND (
          (pp.type = 'user' AND pp.target_id = auth.uid())
          OR (pp.type = 'group' AND EXISTS (
            SELECT 1 FROM public.user_groups ug
            WHERE ug.group_id = pp.target_id AND ug.user_id = auth.uid()))
          OR (pp.type = 'customer' AND pp.target_id = (
            SELECT u.customer_id FROM public.users u WHERE u.id = auth.uid()))
        )
    )
  $function$;

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

CREATE OR REPLACE FUNCTION public.project_actions_assign_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.action_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(action_number), 0) + 1
        INTO NEW.action_number
        FROM public.project_actions
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE OR REPLACE FUNCTION public.project_change_orders_assign_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.change_order_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(change_order_number), 0) + 1
        INTO NEW.change_order_number
        FROM public.project_change_orders
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE OR REPLACE FUNCTION public.project_dependencies_assign_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.dependency_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(dependency_number), 0) + 1
        INTO NEW.dependency_number
        FROM public.project_dependencies
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE OR REPLACE FUNCTION public.project_issues_assign_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.issue_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(issue_number), 0) + 1
        INTO NEW.issue_number
        FROM public.project_issues
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE OR REPLACE FUNCTION public.project_milestones_assign_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.milestone_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(milestone_number), 0) + 1
        INTO NEW.milestone_number
        FROM public.project_milestones
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE OR REPLACE FUNCTION public.project_risks_assign_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.risk_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(risk_number), 0) + 1
        INTO NEW.risk_number
        FROM public.project_risks
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

ALTER TABLE "public"."groups"
  ADD CONSTRAINT "groups_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE "public"."portfolios"
  ADD CONSTRAINT "portfolios_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE "public"."portfolio_projects"
  ADD CONSTRAINT "portfolio_projects_portfolio_fk" FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_issues"
  ADD CONSTRAINT "project_issues_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.issue_categories(id);

ALTER TABLE "public"."project_risks"
  ADD CONSTRAINT "project_risks_project_risk_id_key" UNIQUE (project_id, risk_id);

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE "public"."portfolio_projects"
  ADD CONSTRAINT "portfolio_projects_project_fk" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_actions"
  ADD CONSTRAINT "project_actions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_change_orders"
  ADD CONSTRAINT "project_change_orders_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_dependencies"
  ADD CONSTRAINT "project_dependencies_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_issues"
  ADD CONSTRAINT "project_issues_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_milestones"
  ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_risks"
  ADD CONSTRAINT "project_risks_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

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

ALTER TABLE "public"."project_actions"
  ADD CONSTRAINT "project_actions_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE "public"."project_actions"
  ADD CONSTRAINT "project_actions_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES public.users(id);

ALTER TABLE "public"."project_change_orders"
  ADD CONSTRAINT "project_change_orders_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE "public"."project_change_orders"
  ADD CONSTRAINT "project_change_orders_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES public.users(id);

ALTER TABLE "public"."project_dependencies"
  ADD CONSTRAINT "project_dependencies_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE "public"."project_dependencies"
  ADD CONSTRAINT "project_dependencies_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES public.users(id);

ALTER TABLE "public"."project_issues"
  ADD CONSTRAINT "project_issues_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE "public"."project_issues"
  ADD CONSTRAINT "project_issues_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES public.users(id);

ALTER TABLE "public"."project_milestones"
  ADD CONSTRAINT "project_milestones_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE "public"."project_risks"
  ADD CONSTRAINT "project_risks_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id);

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

CREATE INDEX project_risks_project_idx ON public.project_risks USING btree (project_id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER project_actions_assign_number
  BEFORE INSERT ON public.project_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.project_actions_assign_number();

CREATE TRIGGER project_change_orders_assign_number
  BEFORE INSERT ON public.project_change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.project_change_orders_assign_number();

CREATE TRIGGER project_dependencies_assign_number
  BEFORE INSERT ON public.project_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION public.project_dependencies_assign_number();

CREATE TRIGGER project_issues_assign_number
  BEFORE INSERT ON public.project_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.project_issues_assign_number();

CREATE TRIGGER project_milestones_assign_number
  BEFORE INSERT ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.project_milestones_assign_number();

CREATE TRIGGER project_risks_assign_number
  BEFORE INSERT ON public.project_risks
  FOR EACH ROW
  EXECUTE FUNCTION public.project_risks_assign_number();

CREATE POLICY "customers_admin" ON "public"."customers"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "customers_select_own" ON "public"."customers"
  FOR SELECT
  TO "authenticated"
  USING (((public.current_user_role() = 'CUSTOMER'::text) AND (id = public.current_user_customer_id())));

CREATE POLICY "groups_admin" ON "public"."groups"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "groups_select_own" ON "public"."groups"
  FOR SELECT
  TO "authenticated"
  USING (((public.current_user_role() = 'CUSTOMER'::text) AND (id = public.current_user_customer_id())));

CREATE POLICY "issue_categories_access" ON "public"."issue_categories"
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

CREATE POLICY "portfolios_admin" ON "public"."portfolios"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_actions_admin" ON "public"."project_actions"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_actions_select" ON "public"."project_actions"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_actions.project_id)))));

CREATE POLICY "project_change_orders_admin" ON "public"."project_change_orders"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_change_orders_select" ON "public"."project_change_orders"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_change_orders.project_id)))));

CREATE POLICY "project_dependencies_admin" ON "public"."project_dependencies"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_dependencies_select" ON "public"."project_dependencies"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_dependencies.project_id)))));

CREATE POLICY "project_issues_admin" ON "public"."project_issues"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_issues_select" ON "public"."project_issues"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_issues.project_id)))));

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

CREATE POLICY "project_permission_admin" ON "public"."project_permissions"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_risks_admin" ON "public"."project_risks"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_risks_select" ON "public"."project_risks"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_risks.project_id)))));

CREATE POLICY "project_types_access" ON "public"."project_types"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY "projects_admin" ON "public"."projects"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "projects_select_customer" ON "public"."projects"
  FOR SELECT
  TO "authenticated"
  USING (((public.current_user_role() = 'CUSTOMER'::text) AND public.current_user_has_project_permission(id)));

CREATE POLICY "access_user_groups" ON "public"."user_groups"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY "users_access" ON "public"."users"
  FOR ALL
  TO "authenticated"
  USING (((public.current_user_role() = 'CAMUNDA'::text) OR (id = auth.uid())))
  WITH CHECK (((public.current_user_role() = 'CAMUNDA'::text) OR ((id = auth.uid()) AND (role = public.current_user_role()))));

REVOKE ALL ON FUNCTION "public"."current_user_customer_id"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."current_user_customer_id"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."current_user_customer_id"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."current_user_customer_id"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."current_user_customer_id"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."project_actions_assign_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."project_actions_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_actions_assign_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_actions_assign_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."project_change_orders_assign_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."project_change_orders_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_change_orders_assign_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_change_orders_assign_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."project_dependencies_assign_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."project_dependencies_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_dependencies_assign_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_dependencies_assign_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."project_issues_assign_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."project_issues_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_issues_assign_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_issues_assign_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."project_milestones_assign_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."project_milestones_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_milestones_assign_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_milestones_assign_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."project_risks_assign_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."project_risks_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_risks_assign_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_risks_assign_number"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."customers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."groups" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."groups" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."groups" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."groups" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."issue_categories" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."issue_categories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."issue_categories" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."issue_categories" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."portfolio_projects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolio_projects" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."portfolios" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_actions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_actions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_actions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_actions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_change_orders" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_change_orders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_change_orders" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_change_orders" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_dependencies" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_dependencies" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_dependencies" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_dependencies" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_issues" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_issues" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_issues" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_issues" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_milestones" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_milestones" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_milestones" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_milestones" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_permissions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_risks" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."project_risks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_risks" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_risks" TO "service_role";

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
