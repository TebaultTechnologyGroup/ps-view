CREATE OR REPLACE FUNCTION public.current_user_has_project_permission (
  p_project_id uuid
)
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

GRANT EXECUTE ON FUNCTION "public"."current_user_has_project_permission"(uuid) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."current_user_has_project_permission"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."current_user_has_project_permission"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."current_user_has_project_permission"(uuid) TO "postgres";
