do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'carfnewaccess'
  ) then
    alter table public.users
    add column carfnewaccess boolean not null default false;

    update public.users
    set carfnewaccess = true;
  end if;
end $$;
