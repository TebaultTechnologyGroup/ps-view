create or replace function handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
  begin
    insert into public.users (auth_id, email) values (new.id, new.email);
    return new;
  end;
  $function$

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

  CREATE OR REPLACE FUNCTION public.current_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT role FROM public.users WHERE id = auth.uid()
  $function$;

CREATE OR REPLACE FUNCTION public.project_risks_assign_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.risk_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(risk_number), 0) + 1
        INTO NEW.risk_number
        FROM public.project_risks
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE TRIGGER project_risks_assign_number
  BEFORE INSERT ON "public"."project_risks"
  FOR EACH ROW EXECUTE FUNCTION public.project_risks_assign_number();




REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;