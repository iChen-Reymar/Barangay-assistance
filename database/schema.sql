-- Barangay Buru-un Assistance Matching System
-- Schema matched to the running application (server/index.mjs).
--
-- Run this entire file in the Supabase SQL Editor. It is safe to run again.
-- Existing rows in the tables below are kept. Passwords stay in Supabase Auth.
--
-- Kept, because the API reads and writes them:
--   users, associations, association_profiles, association_members,
--   member_documents, beneficiaries, assistance_programs, assistance_requests,
--   request_documents, qualification_checks, request_decisions,
--   generated_assistance_list, priority_list, audit_logs, audit_changes,
--   report_history, notifications, privacy_settings, aid_records
--
-- Removed, because no application code reads or writes them:
--   app_store                  leftover key/value store from an older build
--   generated_priority_list    replaced by priority_list
--   ml_models                  the model file is ml-service/artifacts/vulnerability_model.joblib

drop table if exists public.app_store cascade;
drop table if exists public.generated_priority_list cascade;
drop table if exists public.ml_models cascade;

-- Admin: accounts, roles, and access approvals.
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('admin', 'staff', 'association')),
  status text not null default 'pending'
    check (status in ('approved', 'pending', 'rejected')),
  association_name text,
  payload jsonb not null default '{}'::jsonb
);

-- Admin: associations and the assigned Association Head.
create table if not exists public.associations (
  id text primary key,
  name text not null,
  type text not null
    check (type in ('Agricultural', 'Livelihood', 'Special Sector', 'Youth')),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  head_user_id text references public.users (id) on delete set null,
  contact_person text not null default '',
  contact_number text not null default '',
  members integer not null default 0 check (members >= 0),
  payload jsonb not null default '{}'::jsonb
);

-- Association Head: the editable profile stored as barangay_association_details.
create table if not exists public.association_profiles (
  id text primary key,
  name text not null,
  type text not null,
  registration_number text,
  date_registered text,
  address text,
  contact_person text,
  contact_number text,
  email text,
  total_members integer not null default 0 check (total_members >= 0),
  description text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  payload jsonb not null default '{}'::jsonb
);

-- Association Head: member roster.
create table if not exists public.association_members (
  id text primary key,
  association_name text,
  name text not null,
  age integer not null default 0 check (age >= 0),
  contact_number text not null default '',
  address text not null default '',
  date_joined text not null,
  family_size integer not null default 0 check (family_size >= 0),
  is_pwd boolean not null default false,
  is_senior boolean not null default false,
  membership_status text not null default 'ACTIVE'
    check (membership_status in ('ACTIVE', 'INACTIVE')),
  vulnerability text not null default 'LOW'
    check (vulnerability in ('HIGH', 'MEDIUM', 'LOW')),
  assistance_status text not null default 'NONE'
    check (assistance_status in ('NONE', 'PENDING', 'RECEIVED')),
  notes text,
  payload jsonb not null default '{}'::jsonb
);

-- Barangay certificate and government ID for each member.
create table if not exists public.member_documents (
  id text primary key,
  member_id text not null references public.association_members (id) on delete cascade,
  document_kind text not null
    check (document_kind in ('barangay_certificate', 'government_id')),
  name text not null,
  data_url text not null,
  file_size text not null,
  uploaded_at text not null,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'verified', 'rejected')),
  verified_by text,
  verified_at text,
  unique (member_id, document_kind)
);

-- Association Head: aid already received by a member of that association.
create table if not exists public.aid_records (
  id text primary key,
  association_name text not null,
  member_id text,
  member_name text not null,
  program_name text not null,
  date_received text not null,
  quantity text not null,
  comments text not null default '',
  status text not null default 'RECEIVED'
    check (status in ('RECEIVED', 'PENDING')),
  submitted_by text,
  submitted_at text,
  payload jsonb not null default '{}'::jsonb
);

-- Barangay Staff: beneficiaries they classify and verify.
create table if not exists public.beneficiaries (
  id text primary key,
  name text not null,
  association_name text not null,
  family_size integer not null default 0 check (family_size >= 0),
  monthly_income numeric(12, 2) not null default 0 check (monthly_income >= 0),
  vulnerability text not null
    check (vulnerability in ('HIGH', 'MEDIUM', 'LOW')),
  verification text not null default 'PENDING'
    check (verification in ('VERIFIED', 'PENDING', 'UNVERIFIED')),
  payload jsonb not null default '{}'::jsonb
);

-- Admin: assistance programs.
create table if not exists public.assistance_programs (
  id text primary key,
  name text not null,
  category text not null
    check (category in ('Food', 'Agricultural', 'Livelihood', 'Medical', 'Emergency', 'Fisheries')),
  sponsoring_agency text not null,
  description text not null,
  eligibility_criteria text not null,
  max_beneficiaries integer check (max_beneficiaries is null or max_beneficiaries >= 0),
  budget_allocation numeric(14, 2)
    check (budget_allocation is null or budget_allocation >= 0),
  start_date text not null,
  end_date text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE', 'CLOSED')),
  date_created text not null,
  payload jsonb not null default '{}'::jsonb
);

-- Association requests. Staff review them. Every role can view the result.
create table if not exists public.assistance_requests (
  id text primary key,
  source text not null default 'assistance'
    check (source in ('assistance', 'recommendation')),
  association_name text not null,
  request_type text not null,
  vulnerability text not null
    check (vulnerability in ('HIGH', 'MEDIUM', 'LOW')),
  request_date text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'UNDER REVIEW', 'REJECTED')),
  score integer,
  program_name text,
  description text,
  previous_assistance text,
  submitted_by text,
  contact_number text,
  email text,
  address text,
  member_count integer,
  purpose text,
  requested_items text,
  supporting_info text,
  submitted_at text,
  association_type text,
  monthly_income text,
  vulnerability_score integer,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.request_documents (
  id text primary key,
  request_id text not null references public.assistance_requests (id) on delete cascade,
  name text not null,
  file_type text not null,
  uploaded_at text not null,
  file_size text not null,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'verified', 'rejected')),
  verified_by text,
  verified_at text,
  data_url text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.qualification_checks (
  id text primary key,
  request_id text not null references public.assistance_requests (id) on delete cascade,
  criterion text not null,
  description text not null,
  status text not null default 'pending'
    check (status in ('passed', 'pending', 'failed', 'not_applicable')),
  verified_by text,
  verified_at text,
  notes text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.request_decisions (
  id text primary key,
  request_id text not null references public.assistance_requests (id) on delete cascade,
  decision text not null check (decision in ('approve', 'reject', 'override')),
  notes text not null default '',
  decided_by text not null,
  decided_by_email text,
  decided_at text not null,
  previous_status text not null,
  new_status text not null,
  payload jsonb not null default '{}'::jsonb
);

-- Staff generates this ranked list. The API replaces the whole list on each run.
create table if not exists public.generated_assistance_list (
  rank_no integer primary key check (rank_no > 0),
  beneficiary_name text not null,
  association_name text not null,
  score integer not null,
  classification text not null
    check (classification in ('HIGH', 'MEDIUM', 'LOW')),
  program_name text not null,
  verification text not null,
  reason text not null,
  generated_at text not null,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.priority_list (
  id text primary key,
  rank_no integer not null check (rank_no > 0),
  association_name text not null,
  score integer not null,
  classification text not null
    check (classification in ('HIGH', 'MEDIUM', 'LOW')),
  recommended text not null,
  previous_aid text not null check (previous_aid in ('None', 'Yes')),
  status text not null
    check (status in ('PENDING', 'APPROVED', 'UNDER REVIEW', 'REJECTED')),
  notes text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_logs (
  id text primary key,
  created_at text not null,
  display_date text not null,
  user_name text not null,
  user_email text,
  action text not null,
  action_color text not null
    check (action_color in ('green', 'orange', 'red', 'blue', 'purple', 'teal')),
  description text not null,
  ip_address text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_changes (
  id bigint generated always as identity primary key,
  audit_log_id text not null references public.audit_logs (id) on delete cascade,
  field_name text not null,
  old_value text not null,
  new_value text not null
);

create table if not exists public.report_history (
  id text primary key,
  name text not null,
  generated_by text not null,
  generated_date text not null,
  format text not null check (format in ('PDF', 'EXCEL', 'CSV')),
  report_type text not null,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.notifications (
  id text primary key,
  user_id text references public.users (id) on delete set null,
  association_name text,
  message text not null,
  notice_time text not null,
  created_at text,
  is_read boolean not null default false,
  notice_type text not null
    check (notice_type in ('info', 'success', 'warning')),
  document_name text,
  member_name text,
  rejected_by text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.privacy_settings (
  id text primary key default 'default',
  mask_contact_in_exports boolean not null default true,
  mask_ip_in_audit_logs boolean not null default true,
  mask_email_in_audit_logs boolean not null default true,
  anonymize_rejected_requests boolean not null default true,
  anonymization_level text not null default 'partial'
    check (anonymization_level in ('none', 'partial', 'full')),
  audit_log_retention_days integer not null default 365,
  assistance_record_retention_days integer not null default 730,
  access_request_retention_days integer not null default 180,
  auto_purge_enabled boolean not null default false,
  last_anonymization_run text,
  last_purge_run text,
  payload jsonb not null default '{}'::jsonb
);

-- Tables created by an older version keep their old columns. These statements
-- add every column the API writes, without touching existing rows.
alter table public.users add column if not exists association_name text;
alter table public.users add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.associations add column if not exists members integer not null default 0;
alter table public.associations add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.association_profiles add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.association_members add column if not exists association_name text;
alter table public.association_members add column if not exists age integer not null default 0;
alter table public.association_members add column if not exists address text not null default '';
alter table public.association_members add column if not exists date_joined text not null default '';
alter table public.association_members add column if not exists family_size integer not null default 0;
alter table public.association_members add column if not exists is_pwd boolean not null default false;
alter table public.association_members add column if not exists is_senior boolean not null default false;
alter table public.association_members add column if not exists assistance_status text not null default 'NONE';
alter table public.association_members add column if not exists notes text;
alter table public.association_members add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.aid_records add column if not exists association_name text not null default '';
alter table public.aid_records add column if not exists member_id text;
alter table public.aid_records add column if not exists member_name text not null default '';
alter table public.aid_records add column if not exists program_name text not null default '';
alter table public.aid_records add column if not exists date_received text not null default '';
alter table public.aid_records add column if not exists quantity text not null default '';
alter table public.aid_records add column if not exists comments text not null default '';
alter table public.aid_records add column if not exists status text not null default 'RECEIVED';
alter table public.aid_records add column if not exists submitted_by text;
alter table public.aid_records add column if not exists submitted_at text;
alter table public.aid_records add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.beneficiaries add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.assistance_programs add column if not exists sponsoring_agency text not null default '';
alter table public.assistance_programs add column if not exists description text not null default '';
alter table public.assistance_programs add column if not exists eligibility_criteria text not null default '';
alter table public.assistance_programs add column if not exists max_beneficiaries integer;
alter table public.assistance_programs add column if not exists budget_allocation numeric(14, 2);
alter table public.assistance_programs add column if not exists start_date text not null default '';
alter table public.assistance_programs add column if not exists end_date text;
alter table public.assistance_programs add column if not exists date_created text not null default '';
alter table public.assistance_programs add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.assistance_requests add column if not exists request_date text not null default '';
alter table public.assistance_requests add column if not exists program_name text;
alter table public.assistance_requests add column if not exists description text;
alter table public.assistance_requests add column if not exists previous_assistance text;
alter table public.assistance_requests add column if not exists submitted_by text;
alter table public.assistance_requests add column if not exists contact_number text;
alter table public.assistance_requests add column if not exists email text;
alter table public.assistance_requests add column if not exists address text;
alter table public.assistance_requests add column if not exists member_count integer;
alter table public.assistance_requests add column if not exists purpose text;
alter table public.assistance_requests add column if not exists requested_items text;
alter table public.assistance_requests add column if not exists supporting_info text;
alter table public.assistance_requests add column if not exists submitted_at text;
alter table public.assistance_requests add column if not exists association_type text;
alter table public.assistance_requests add column if not exists monthly_income text;
alter table public.assistance_requests add column if not exists vulnerability_score integer;
alter table public.assistance_requests add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.request_documents add column if not exists data_url text;
alter table public.request_documents add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.qualification_checks add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.request_decisions add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.generated_assistance_list add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.priority_list add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.audit_logs add column if not exists display_date text not null default '';
alter table public.audit_logs add column if not exists user_email text;
alter table public.audit_logs add column if not exists action_color text not null default 'blue';
alter table public.audit_logs add column if not exists ip_address text not null default '';
alter table public.audit_logs add column if not exists entity_type text;
alter table public.audit_logs add column if not exists entity_id text;
alter table public.audit_logs add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.report_history add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists association_name text;
alter table public.notifications add column if not exists created_at text;
alter table public.notifications add column if not exists document_name text;
alter table public.notifications add column if not exists member_name text;
alter table public.notifications add column if not exists rejected_by text;
alter table public.notifications add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.privacy_settings add column if not exists payload jsonb not null default '{}'::jsonb;

create index if not exists users_email_idx on public.users (lower(email));
create index if not exists users_role_status_idx on public.users (role, status);
create index if not exists associations_head_idx on public.associations (head_user_id);
create index if not exists associations_name_idx on public.associations (lower(name));
create index if not exists association_members_owner_idx on public.association_members (lower(association_name));
create index if not exists beneficiaries_association_idx on public.beneficiaries (association_name);
create index if not exists aid_records_association_idx on public.aid_records (lower(association_name));
create index if not exists assistance_requests_status_idx on public.assistance_requests (status);
create index if not exists assistance_requests_association_idx on public.assistance_requests (association_name);
create index if not exists notifications_user_idx on public.notifications (user_id, is_read);
create index if not exists notifications_association_idx on public.notifications (association_name, is_read);
create index if not exists member_documents_member_idx on public.member_documents (member_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at);

-- create table if not exists skips foreign keys on tables that already exist.
do $$
begin
  if not exists (
    select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and r.relname = 'request_documents' and c.contype = 'f'
  ) then
    alter table public.request_documents
      add constraint request_documents_request_id_fkey
      foreign key (request_id) references public.assistance_requests (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and r.relname = 'qualification_checks' and c.contype = 'f'
  ) then
    alter table public.qualification_checks
      add constraint qualification_checks_request_id_fkey
      foreign key (request_id) references public.assistance_requests (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and r.relname = 'request_decisions' and c.contype = 'f'
  ) then
    alter table public.request_decisions
      add constraint request_decisions_request_id_fkey
      foreign key (request_id) references public.assistance_requests (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and r.relname = 'audit_changes' and c.contype = 'f'
  ) then
    alter table public.audit_changes
      add constraint audit_changes_audit_log_id_fkey
      foreign key (audit_log_id) references public.audit_logs (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and r.relname = 'member_documents' and c.contype = 'f'
  ) then
    alter table public.member_documents
      add constraint member_documents_member_id_fkey
      foreign key (member_id) references public.association_members (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and r.relname = 'associations' and c.contype = 'f'
  ) then
    alter table public.associations
      add constraint associations_head_user_id_fkey
      foreign key (head_user_id) references public.users (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and r.relname = 'notifications' and c.contype = 'f'
  ) then
    alter table public.notifications
      add constraint notifications_user_id_fkey
      foreign key (user_id) references public.users (id) on delete set null;
  end if;
end $$;

-- The API writes with the secret key and bypasses these policies.
-- Signed-in users can read. A public visitor can only submit a pending account.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'associations', 'association_profiles', 'association_members', 'member_documents',
    'beneficiaries', 'assistance_programs', 'assistance_requests', 'request_documents',
    'qualification_checks', 'request_decisions', 'generated_assistance_list', 'priority_list',
    'audit_logs', 'audit_changes', 'report_history', 'notifications', 'privacy_settings',
    'aid_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists app_access on public.%I', table_name);
    execute format('drop policy if exists authenticated_read on public.%I', table_name);
    execute format(
      'create policy authenticated_read on public.%I for select to authenticated using (true)',
      table_name
    );
  end loop;
end $$;

drop policy if exists public_account_request on public.users;
create policy public_account_request
  on public.users
  for insert
  to anon
  with check (
    status = 'pending'
    and role in ('staff', 'association')
  );
