CREATE OR REPLACE FUNCTION public.current_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT role FROM public.users WHERE id = auth.uid()
  $function$;

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO "postgres";
