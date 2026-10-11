CREATE TABLE project_change_orders (
  "id"                  uuid        primary key,
  "project_id"          uuid        NOT NULL REFERENCES "public"."projects" (id) ON DELETE CASCADE,
  -- Per-project external key: CO1, CO2, ... Never reused (soft-deleted rows count).
  "change_order_number" int         NOT NULL,
  "change_order_id"     text        GENERATED ALWAYS AS ('CO' || change_order_number::text) STORED,
  "title"               text        NOT NULL,
  "description"         text,
  "justification"       text,
  "owner_id"            uuid        REFERENCES "public"."users" (id),
  "requested_by"        uuid        REFERENCES "public"."users" (id),
  "requested_date"      date        NOT NULL DEFAULT now(),
  "status"              text        NOT NULL DEFAULT 'draft',
  "estimated_cost_impact" int       NOT NULL DEFAULT 0,
  "estimated_days_impact" int       NOT NULL DEFAULT 0,
  "currency"            text        NOT NULL DEFAULT '$',
  -- customer-side approver (free text; customers are not necessarily users)
  "approver"            text,
  "decision_date"       date,
  "deleted"             boolean     NOT NULL DEFAULT false,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"          uuid,
  "updated_by"          uuid,
  CONSTRAINT project_change_orders_project_number_key UNIQUE (project_id, change_order_number)
);

ALTER TABLE project_change_orders ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the project (projects RLS applies inside the subquery) can read its change orders.
CREATE POLICY "project_change_orders_select" ON "public"."project_change_orders"
  FOR SELECT
  TO authenticated
  USING (
    deleted = false
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_change_orders.project_id)
  );

-- Only CAMUNDA users can create, change or delete change orders.
CREATE POLICY "project_change_orders_admin" ON "public"."project_change_orders"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');

CREATE OR REPLACE FUNCTION public.project_change_orders_assign_number()
  RETURNS trigger
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

CREATE TRIGGER project_change_orders_assign_number
  BEFORE INSERT ON "public"."project_change_orders"
  FOR EACH ROW EXECUTE FUNCTION public.project_change_orders_assign_number();

CREATE POLICY "project_status_reports_select" ON "public"."project_status_reports"
  FOR SELECT
  TO authenticated
  USING (
    deleted = false
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_status_reports.project_id)
  );


CREATE POLICY "project_status_reports_admin" ON "public"."project_status_reports"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');