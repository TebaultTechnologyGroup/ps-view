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