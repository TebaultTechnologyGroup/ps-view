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
  CONSTRAINT "project_change_orders_project_number_key" UNIQUE (project_id, change_order_number),
  CONSTRAINT "project_change_orders_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT "project_change_orders_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT "project_change_orders_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES public.users(id)
);

ALTER TABLE "public"."project_change_orders"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."project_change_orders"
  ADD COLUMN "change_order_id" text GENERATED ALWAYS AS (('CO'::text || (change_order_number)::text)) STORED;

CREATE TRIGGER project_change_orders_assign_number
  BEFORE INSERT ON public.project_change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.project_change_orders_assign_number();

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

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_change_orders" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_change_orders" TO "service_role";

REVOKE ALL ON TABLE "public"."project_change_orders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_change_orders" TO "postgres";
