-- Customer lookup that bypasses RLS, like current_user_role().
CREATE OR REPLACE FUNCTION public.current_user_customer_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT customer_id FROM public.users WHERE id = auth.uid()
  $function$;

REVOKE ALL ON FUNCTION public.current_user_customer_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_customer_id() TO authenticated, service_role;

-- Replaces the initial policy, which let any signed-in user read and write every customer.
DROP POLICY IF EXISTS "customer_view" ON "public"."customers";

-- CAMUNDA users can manage all customers.
CREATE POLICY "customers_admin" ON "public"."customers"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');

-- Customer users can read only the customer on their own user record.
CREATE POLICY "customers_select_own" ON "public"."customers"
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'CUSTOMER'
    AND id = public.current_user_customer_id()
  );

CREATE POLICY "groups_admin" ON "public"."groups"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');


CREATE POLICY "groups_select_own" ON "public"."groups"
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'CUSTOMER'
    AND id = public.current_user_customer_id()
  );

CREATE POLICY "portfolios_admin" ON "public"."portfolios"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');

CREATE POLICY "project_permission_admin" ON "public"."project_permissions"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');