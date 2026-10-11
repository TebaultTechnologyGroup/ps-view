CREATE POLICY "projects_select_customer" ON "public"."projects"
  FOR SELECT
  TO "authenticated"
  USING (((public.current_user_role() = 'CUSTOMER'::text) AND public.current_user_has_project_permission(id)));
