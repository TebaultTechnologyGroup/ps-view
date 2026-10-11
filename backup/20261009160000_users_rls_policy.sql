-- Role lookup that bypasses RLS. A policy on public.users cannot query
-- public.users directly (infinite recursion), so it goes through this.
CREATE OR REPLACE FUNCTION public.current_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT role FROM public.users WHERE id = auth.uid()
  $function$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

-- CAMUNDA users can manage every row; everyone else only their own.
-- Non-CAMUNDA users cannot change their own role.
CREATE POLICY "users_access" ON "public"."users"
  FOR ALL
  TO authenticated
  USING (
    public.current_user_role() = 'CAMUNDA'
    OR id = auth.uid()
  )
  WITH CHECK (
    public.current_user_role() = 'CAMUNDA'
    OR (id = auth.uid() AND role = public.current_user_role())
  );

-- Backfill the profile for the user created in the console, as CAMUNDA.
INSERT INTO public.users (id, email, role)
VALUES ('25dfb822-2d9e-451f-9979-90babd79892c', 'mark.tebault@camunda.com', 'CAMUNDA')
ON CONFLICT (id) DO UPDATE SET role = 'CAMUNDA';
