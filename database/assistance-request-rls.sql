-- Focused production migration for assistance-request writes.
-- Run this in the Supabase SQL Editor. Existing data is not changed.
--
-- Association Heads may create their own pending requests. Barangay Staff may
-- update existing requests but may not insert new ones. The API must therefore
-- use INSERT for submissions and UPDATE for Staff workflow transitions; UPSERT
-- is intentionally incompatible with this least-privilege split.

begin;

alter table public.assistance_requests enable row level security;

drop policy if exists assistance_requests_insert_association on public.assistance_requests;
create policy assistance_requests_insert_association
  on public.assistance_requests
  for insert
  to authenticated
  with check (
    public.current_app_role() = 'association'
    and status = 'PENDING'
    and lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  );

drop policy if exists assistance_requests_update_staff on public.assistance_requests;
create policy assistance_requests_update_staff
  on public.assistance_requests
  for update
  to authenticated
  using (public.current_app_role() = 'staff')
  with check (public.current_app_role() = 'staff');

commit;
