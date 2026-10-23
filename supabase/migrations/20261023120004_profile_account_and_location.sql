-- User-supplied profile details. These fields are profile data only and are
-- never used for authorization; staff authorization remains profiles.role.

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists account_type text,
  add column if not exists city text,
  add column if not exists bio text,
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists location_source text;

alter table public.profiles
  add constraint profiles_full_name_check check (full_name is null or char_length(full_name) between 1 and 120),
  add constraint profiles_account_type_check check (account_type is null or account_type in ('student', 'working-professional')),
  add constraint profiles_city_check check (city is null or char_length(city) between 1 and 120),
  add constraint profiles_bio_check check (bio is null or char_length(bio) <= 500),
  add constraint profiles_coordinates_check check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  ),
  add constraint profiles_location_source_check check (
    location_source is null or location_source in ('gps', 'manual')
  );

-- Only new sign-ups are required to supply account details. Existing users can
-- complete their profile through the same owner-only update policy.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_name text := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  submitted_type text := nullif(trim(new.raw_user_meta_data ->> 'account_type'), '');
  submitted_city text := nullif(trim(new.raw_user_meta_data ->> 'city'), '');
  submitted_neighborhood text := nullif(trim(new.raw_user_meta_data ->> 'neighborhood'), '');
begin
  if submitted_name is null
     or submitted_type not in ('student', 'working-professional')
     or submitted_city is null
     or submitted_neighborhood is null then
    raise exception 'Full name, account type, city, and neighborhood are required';
  end if;

  insert into public.profiles (
    id, display_name, full_name, account_type, city, neighborhood, role
  ) values (
    new.id, submitted_name, submitted_name, submitted_type, submitted_city,
    submitted_neighborhood, 'member'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create index if not exists profiles_city_neighborhood_idx
on public.profiles (city, neighborhood);
