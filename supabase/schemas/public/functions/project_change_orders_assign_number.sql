CREATE OR REPLACE FUNCTION public.project_change_orders_assign_number()
  RETURNS TRIGGER
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

GRANT EXECUTE ON FUNCTION "public"."project_change_orders_assign_number"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."project_change_orders_assign_number"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."project_change_orders_assign_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."project_change_orders_assign_number"() TO "postgres";
