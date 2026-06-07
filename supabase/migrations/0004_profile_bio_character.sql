-- ============================================================================
-- Add a profile bio, and make the character permanent (chosen at signup).
-- Non-destructive — run in the Supabase SQL editor.
-- ============================================================================

-- 1) bio field
alter table public.profiles add column if not exists bio text not null default '';

-- 2) character is locked after signup: the client may edit ONLY username + bio.
--    (avatar_url is set once by the signup trigger and never by the client.)
revoke update on public.profiles from authenticated;
grant update (username, bio) on public.profiles to authenticated;

-- 3) new-user trigger now stores the character picked at signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'character', 'hoodie')
  )
  on conflict (id) do nothing;
  return new;
end $$;
