CREATE OR REPLACE FUNCTION public.current_user_customer_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT customer_id FROM public.users WHERE id = auth.uid()
  $function$;

GRANT EXECUTE ON FUNCTION "public"."current_user_customer_id"() TO "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."current_user_customer_id"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."current_user_customer_id"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."current_user_customer_id"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."current_user_customer_id"() TO "postgres";
