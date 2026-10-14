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

GRANT EXECUTE ON FUNCTION "public"."project_actions_assign_number"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."project_actions_assign_number"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."project_actions_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_actions_assign_number"() TO "postgres";
