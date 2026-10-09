CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  begin
    insert into public.users (id, email) values (new.id, new.email);
    return new;
  end;
  $function$;