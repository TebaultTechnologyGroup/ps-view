CREATE TABLE "public"."portfolios" (
  "id"          uuid                     NOT NULL,
  "name"        text,
  "customer_id" uuid,
  "deleted"     boolean                  DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  CONSTRAINT "portfolios_customer_fk" FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT "portfolios_pkey" PRIMARY KEY (id),
  CONSTRAINT "portfolios_createdby_fk" FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT "portfolios_updatedby_fk" FOREIGN KEY (updated_by) REFERENCES public.users(id)
);

ALTER TABLE "public"."portfolios"
  ENABLE ROW LEVEL SECURITY;

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

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "service_role";

REVOKE ALL ON TABLE "public"."portfolios" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."portfolios" TO "postgres";
