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
  head_user_id text references public.users (id) on update cascade on delete set null,
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
  member_id text references public.association_members (id) on update cascade on delete set null,
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
    check (status in ('PENDING', 'UNDER REVIEW', 'LIST GENERATED', 'APPROVED', 'REJECTED')),
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
  storage_path text,
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

-- Generated results have a stable beneficiary ID. Rank is display order only;
-- it cannot be the primary key because each association can have a rank 1.
create table if not exists public.generated_assistance_list (
  id text primary key,
  beneficiary_id text,
  request_id text references public.assistance_requests (id) on update cascade on delete set null,
  rank_no integer not null check (rank_no > 0),
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

-- Upgrade earlier installations to the Staff-triggered automatic final-list workflow.
alter table public.assistance_requests drop constraint if exists assistance_requests_status_check;
alter table public.assistance_requests add constraint assistance_requests_status_check
  check (status in ('PENDING', 'UNDER REVIEW', 'LIST GENERATED', 'APPROVED', 'REJECTED'));

-- Upgrade installations created before generated rows had stable IDs.
alter table public.generated_assistance_list add column if not exists id text;
update public.generated_assistance_list
set id = md5(lower(coalesce(association_name, '')) || '|' || lower(beneficiary_name))
where id is null or id = '';
alter table public.generated_assistance_list alter column id set not null;
alter table public.generated_assistance_list drop constraint if exists generated_assistance_list_pkey;
alter table public.generated_assistance_list add constraint generated_assistance_list_pkey primary key (id);

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
    check (status in ('PENDING', 'UNDER REVIEW', 'LIST GENERATED', 'APPROVED', 'REJECTED')),
  notes text,
  payload jsonb not null default '{}'::jsonb
);

alter table public.priority_list drop constraint if exists priority_list_status_check;
alter table public.priority_list add constraint priority_list_status_check
  check (status in ('PENDING', 'UNDER REVIEW', 'LIST GENERATED', 'APPROVED', 'REJECTED'));

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
  user_id text,
  generated_date text not null,
  format text not null check (format in ('PDF', 'EXCEL', 'CSV')),
  report_type text not null,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.notifications (
  id text primary key,
  user_id text references public.users (id) on update cascade on delete set null,
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
  updated_by text,
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
alter table public.beneficiaries add column if not exists member_id text;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'beneficiaries_member_id_fkey'
  ) then
    alter table public.beneficiaries
      add constraint beneficiaries_member_id_fkey
      foreign key (member_id) references public.association_members (id)
      on update cascade on delete set null;
  end if;
end $$;
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
alter table public.request_documents add column if not exists storage_path text;
alter table public.request_documents add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.qualification_checks add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.request_decisions add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.generated_assistance_list add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.generated_assistance_list add column if not exists beneficiary_id text;
alter table public.generated_assistance_list add column if not exists request_id text;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'generated_assistance_list_request_id_fkey'
  ) then
    alter table public.generated_assistance_list
      add constraint generated_assistance_list_request_id_fkey
      foreign key (request_id) references public.assistance_requests (id)
      on update cascade on delete set null;
  end if;
end $$;
alter table public.priority_list add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.audit_logs add column if not exists display_date text not null default '';
alter table public.audit_logs add column if not exists user_email text;
alter table public.audit_logs add column if not exists action_color text not null default 'blue';
alter table public.audit_logs add column if not exists ip_address text not null default '';
alter table public.audit_logs add column if not exists entity_type text;
alter table public.audit_logs add column if not exists entity_id text;
alter table public.audit_logs add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.report_history add column if not exists user_id text;
alter table public.report_history add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists association_name text;
alter table public.notifications add column if not exists created_at text;
alter table public.notifications add column if not exists document_name text;
alter table public.notifications add column if not exists member_name text;
alter table public.notifications add column if not exists rejected_by text;
alter table public.notifications add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.privacy_settings add column if not exists updated_by text;
alter table public.privacy_settings add column if not exists payload jsonb not null default '{}'::jsonb;

create index if not exists users_email_idx on public.users (lower(email));
create index if not exists users_role_status_idx on public.users (role, status);
create index if not exists associations_head_idx on public.associations (head_user_id);
create index if not exists associations_name_idx on public.associations (lower(name));
create index if not exists association_members_owner_idx on public.association_members (lower(association_name));
create index if not exists beneficiaries_association_idx on public.beneficiaries (association_name);
create unique index if not exists beneficiaries_member_key on public.beneficiaries (member_id) where member_id is not null;
create index if not exists aid_records_association_idx on public.aid_records (lower(association_name));
create index if not exists assistance_requests_status_idx on public.assistance_requests (status);
create index if not exists assistance_requests_association_idx on public.assistance_requests (association_name);
create index if not exists generated_assistance_request_idx on public.generated_assistance_list (request_id);
create index if not exists notifications_user_idx on public.notifications (user_id, is_read);
create index if not exists notifications_association_idx on public.notifications (association_name, is_read);
create index if not exists member_documents_member_idx on public.member_documents (member_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at);
create index if not exists report_history_user_idx on public.report_history (user_id);

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

-- The schema visualizer draws a line only for a foreign key.
-- These links use the association name and the program name, which is how the
-- app already relates the rows. Blank text is stored as null so it does not
-- have to match a parent row.
alter table public.beneficiaries alter column association_name drop not null;
alter table public.assistance_requests alter column association_name drop not null;
alter table public.generated_assistance_list alter column association_name drop not null;
alter table public.generated_assistance_list alter column program_name drop not null;
alter table public.priority_list alter column association_name drop not null;
alter table public.aid_records alter column association_name drop not null;
alter table public.aid_records alter column program_name drop not null;
alter table public.association_profiles alter column name drop not null;

update public.users set association_name = null where btrim(association_name) = '';
update public.association_members set association_name = null where btrim(association_name) = '';
update public.beneficiaries set association_name = null where btrim(association_name) = '';
update public.assistance_requests set association_name = null where btrim(association_name) = '';
update public.assistance_requests set program_name = null where btrim(program_name) = '';
update public.generated_assistance_list set association_name = null where btrim(association_name) = '';
update public.generated_assistance_list set program_name = null where btrim(program_name) = '';
update public.priority_list set association_name = null where btrim(association_name) = '';
update public.notifications set association_name = null where btrim(association_name) = '';
update public.notifications set user_id = null where btrim(user_id) = '';
update public.aid_records set association_name = null where btrim(association_name) = '';
update public.aid_records set program_name = null where btrim(program_name) = '';
update public.aid_records set member_id = null where btrim(member_id) = '';
update public.audit_logs set user_email = null where btrim(user_email) = '';
update public.association_profiles set name = null where btrim(name) = '';
update public.report_history set user_id = null where btrim(user_id) = '';
update public.privacy_settings set updated_by = null where btrim(updated_by) = '';

-- Older report rows stored a name or email in generated_by and had no user id.
update public.report_history as history
set user_id = matched.user_id
from (
  select history_row.id as history_id, min(account.id) as user_id
  from public.report_history as history_row
  join public.users as account
    on lower(btrim(account.email)) = lower(btrim(history_row.generated_by))
    or lower(btrim(account.full_name)) = lower(btrim(history_row.generated_by))
  where history_row.user_id is null
  group by history_row.id
  having count(distinct account.id) = 1
) as matched
where history.id = matched.history_id;

create unique index if not exists users_email_key on public.users (email);
create unique index if not exists associations_name_key on public.associations (name);
create unique index if not exists assistance_programs_name_key on public.assistance_programs (name);

do $$
declare
  spec record;
begin
  for spec in
    select * from (values
      ('users', 'users_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('association_profiles', 'association_profiles_name_fkey', 'name', 'associations', 'name', 'cascade', 'cascade'),
      ('association_members', 'association_members_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('beneficiaries', 'beneficiaries_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('assistance_requests', 'assistance_requests_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('assistance_requests', 'assistance_requests_program_name_fkey', 'program_name', 'assistance_programs', 'name', 'cascade', 'set null'),
      ('generated_assistance_list', 'generated_assistance_list_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('generated_assistance_list', 'generated_assistance_list_program_name_fkey', 'program_name', 'assistance_programs', 'name', 'cascade', 'set null'),
      ('priority_list', 'priority_list_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('notifications', 'notifications_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('aid_records', 'aid_records_association_name_fkey', 'association_name', 'associations', 'name', 'cascade', 'set null'),
      ('aid_records', 'aid_records_program_name_fkey', 'program_name', 'assistance_programs', 'name', 'cascade', 'set null'),
      ('aid_records', 'aid_records_member_id_fkey', 'member_id', 'association_members', 'id', 'cascade', 'set null'),
      ('audit_logs', 'audit_logs_user_email_fkey', 'user_email', 'users', 'email', 'cascade', 'set null'),
      ('report_history', 'report_history_user_id_fkey', 'user_id', 'users', 'id', 'cascade', 'set null'),
      ('privacy_settings', 'privacy_settings_updated_by_fkey', 'updated_by', 'users', 'id', 'cascade', 'set null')
    ) as link(child_table, constraint_name, child_column, parent_table, parent_column, on_update, on_delete)
  loop
    if not exists (
      select 1 from pg_constraint where conname = spec.constraint_name
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (%I) references public.%I (%I) on update %s on delete %s',
        spec.child_table,
        spec.constraint_name,
        spec.child_column,
        spec.parent_table,
        spec.parent_column,
        spec.on_update,
        spec.on_delete
      );
    end if;
  end loop;
end $$;

-- Auth users are the identity source of truth. Older imports sometimes kept a
-- generated profile ID even though the email belonged to an existing Auth
-- account. Rebuild every user-ID foreign key with ON UPDATE CASCADE, then align
-- those profiles by email without losing their related records.
do $$
declare
  spec record;
  old_constraint record;
begin
  for spec in
    select * from (values
      ('associations', 'head_user_id', 'associations_head_user_id_fkey', 'set null'),
      ('notifications', 'user_id', 'notifications_user_id_fkey', 'set null'),
      ('report_history', 'user_id', 'report_history_user_id_fkey', 'set null'),
      ('privacy_settings', 'updated_by', 'privacy_settings_updated_by_fkey', 'set null')
    ) as link(child_table, child_column, constraint_name, on_delete)
  loop
    for old_constraint in
      select constraint_row.conname
      from pg_constraint as constraint_row
      join pg_class as relation on relation.oid = constraint_row.conrelid
      join pg_namespace as namespace on namespace.oid = relation.relnamespace
      join pg_attribute as attribute
        on attribute.attrelid = relation.oid
       and attribute.attnum = any (constraint_row.conkey)
      where namespace.nspname = 'public'
        and relation.relname = spec.child_table
        and attribute.attname = spec.child_column
        and constraint_row.contype = 'f'
        and constraint_row.confrelid = 'public.users'::regclass
    loop
      execute format(
        'alter table public.%I drop constraint %I',
        spec.child_table,
        old_constraint.conname
      );
    end loop;

    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references public.users (id) on update cascade on delete %s',
      spec.child_table,
      spec.constraint_name,
      spec.child_column,
      spec.on_delete
    );
  end loop;
end $$;

update public.users as profile
set id = account.id::text
from auth.users as account
where lower(btrim(profile.email)) = lower(btrim(account.email))
  and profile.id <> account.id::text
  and not exists (
    select 1
    from public.users as conflicting_profile
    where conflicting_profile.id = account.id::text
      and conflicting_profile.email <> profile.email
  );

-- The API writes with the secret key and bypasses these policies. Browser reads
-- are restricted by role and association so a signed-in account cannot inspect
-- every resident in the barangay.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()::text and status = 'approved'
$$;

create or replace function public.current_app_association()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select association_name from public.users where id = auth.uid()::text and status = 'approved'
$$;

create or replace function public.current_app_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.users where id = auth.uid()::text and status = 'approved'
$$;

-- Publishable-key account registration. The trigger deliberately forces every
-- self-registration to PENDING and accepts only Staff or Association Head roles;
-- callers cannot create an approved account or an Administrator through Auth
-- metadata. Admin approval remains a separate application workflow.
create or replace function public.create_pending_app_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'password';
  requested_role text := lower(coalesce(metadata ->> 'role', ''));
  display_name text := btrim(coalesce(metadata ->> 'full_name', metadata ->> 'fullName', new.email, ''));
  requested_association text := nullif(btrim(coalesce(metadata ->> 'associationName', metadata ->> 'association_name', '')), '');
begin
  if requested_role not in ('staff', 'association') then
    return new;
  end if;

  insert into public.users (id, email, full_name, role, status, association_name, payload)
  values (
    new.id::text,
    lower(coalesce(new.email, '')),
    display_name,
    requested_role,
    'pending',
    case
      when exists (select 1 from public.associations item where lower(item.name) = lower(requested_association))
        then requested_association
      else null
    end,
    metadata || jsonb_build_object('status', 'pending', 'role', requested_role)
  )
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists create_pending_app_profile_after_signup on auth.users;
create trigger create_pending_app_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_pending_app_profile();

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
  end loop;
end $$;

drop policy if exists users_read on public.users;
create policy users_read on public.users for select to authenticated
  using (id = auth.uid()::text or public.current_app_role() = 'admin');

drop policy if exists associations_read on public.associations;
create policy associations_read on public.associations for select to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or head_user_id = auth.uid()::text
    or lower(name) = lower(coalesce(public.current_app_association(), ''))
  );

drop policy if exists association_profiles_read on public.association_profiles;
create policy association_profiles_read on public.association_profiles for select to authenticated
  using (public.current_app_role() in ('admin', 'staff') or lower(name) = lower(coalesce(public.current_app_association(), '')));

drop policy if exists association_members_read on public.association_members;
create policy association_members_read on public.association_members for select to authenticated
  using (public.current_app_role() in ('admin', 'staff') or lower(association_name) = lower(coalesce(public.current_app_association(), '')));

drop policy if exists member_documents_read on public.member_documents;
create policy member_documents_read on public.member_documents for select to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or exists (
      select 1 from public.association_members member
      where member.id = member_id
        and lower(member.association_name) = lower(coalesce(public.current_app_association(), ''))
    )
  );

drop policy if exists aid_records_read on public.aid_records;
create policy aid_records_read on public.aid_records for select to authenticated
  using (public.current_app_role() in ('admin', 'staff') or lower(association_name) = lower(coalesce(public.current_app_association(), '')));

drop policy if exists beneficiaries_read on public.beneficiaries;
create policy beneficiaries_read on public.beneficiaries for select to authenticated
  using (public.current_app_role() in ('admin', 'staff') or lower(association_name) = lower(coalesce(public.current_app_association(), '')));

drop policy if exists assistance_programs_read on public.assistance_programs;
create policy assistance_programs_read on public.assistance_programs for select to authenticated using (true);

drop policy if exists assistance_requests_read on public.assistance_requests;
create policy assistance_requests_read on public.assistance_requests for select to authenticated
  using (public.current_app_role() in ('admin', 'staff') or lower(association_name) = lower(coalesce(public.current_app_association(), '')));

drop policy if exists request_documents_read on public.request_documents;
create policy request_documents_read on public.request_documents for select to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or exists (select 1 from public.assistance_requests item where item.id = request_id and lower(item.association_name) = lower(coalesce(public.current_app_association(), '')))
  );

drop policy if exists qualification_checks_read on public.qualification_checks;
create policy qualification_checks_read on public.qualification_checks for select to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or exists (select 1 from public.assistance_requests item where item.id = request_id and lower(item.association_name) = lower(coalesce(public.current_app_association(), '')))
  );

drop policy if exists request_decisions_read on public.request_decisions;
create policy request_decisions_read on public.request_decisions for select to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or exists (select 1 from public.assistance_requests item where item.id = request_id and lower(item.association_name) = lower(coalesce(public.current_app_association(), '')))
  );

drop policy if exists generated_assistance_list_read on public.generated_assistance_list;
create policy generated_assistance_list_read on public.generated_assistance_list for select to authenticated
  using (public.current_app_role() in ('admin', 'staff') or lower(association_name) = lower(coalesce(public.current_app_association(), '')));

drop policy if exists priority_list_read on public.priority_list;
create policy priority_list_read on public.priority_list for select to authenticated
  using (public.current_app_role() in ('admin', 'staff') or lower(association_name) = lower(coalesce(public.current_app_association(), '')));

drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or user_id = auth.uid()::text
    or lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  );

drop policy if exists audit_logs_read on public.audit_logs;
create policy audit_logs_read on public.audit_logs for select to authenticated
  using (public.current_app_role() = 'admin' or lower(user_email) = lower(coalesce(public.current_app_email(), '')));
drop policy if exists audit_changes_read on public.audit_changes;
create policy audit_changes_read on public.audit_changes for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.audit_logs item
      where item.id = audit_log_id
        and lower(item.user_email) = lower(coalesce(public.current_app_email(), ''))
    )
  );
drop policy if exists report_history_read on public.report_history;
create policy report_history_read on public.report_history for select to authenticated
  using (public.current_app_role() = 'admin' or user_id = auth.uid()::text);
drop policy if exists privacy_settings_read on public.privacy_settings;
create policy privacy_settings_read on public.privacy_settings for select to authenticated using (public.current_app_role() = 'admin');

-- Authenticated writes used when the Express API runs with the Supabase
-- publishable key. Express still validates role transitions and payloads; these
-- policies provide the database authorization boundary for the caller's JWT.
drop policy if exists users_write_admin on public.users;
create policy users_write_admin on public.users for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists associations_write_admin on public.associations;
create policy associations_write_admin on public.associations for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists association_profiles_write on public.association_profiles;
create policy association_profiles_write on public.association_profiles for all to authenticated
  using (
    public.current_app_role() = 'admin'
    or lower(name) = lower(coalesce(public.current_app_association(), ''))
  )
  with check (
    public.current_app_role() = 'admin'
    or lower(name) = lower(coalesce(public.current_app_association(), ''))
  );

drop policy if exists association_members_write on public.association_members;
create policy association_members_write on public.association_members for all to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  )
  with check (
    public.current_app_role() in ('admin', 'staff')
    or lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  );

drop policy if exists member_documents_write on public.member_documents;
create policy member_documents_write on public.member_documents for all to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or exists (
      select 1 from public.association_members member
      where member.id = member_id
        and lower(member.association_name) = lower(coalesce(public.current_app_association(), ''))
    )
  )
  with check (
    public.current_app_role() in ('admin', 'staff')
    or exists (
      select 1 from public.association_members member
      where member.id = member_id
        and lower(member.association_name) = lower(coalesce(public.current_app_association(), ''))
    )
  );

drop policy if exists aid_records_write on public.aid_records;
create policy aid_records_write on public.aid_records for all to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  )
  with check (
    public.current_app_role() in ('admin', 'staff')
    or lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  );

drop policy if exists beneficiaries_write_staff on public.beneficiaries;
create policy beneficiaries_write_staff on public.beneficiaries for all to authenticated
  using (public.current_app_role() in ('admin', 'staff'))
  with check (public.current_app_role() in ('admin', 'staff'));

drop policy if exists assistance_programs_write_admin on public.assistance_programs;
create policy assistance_programs_write_admin on public.assistance_programs for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- Keep request creation and workflow updates as separate privileges. The API
-- uses INSERT for a new Association request and UPDATE for an existing request;
-- it must not UPSERT this table because PostgreSQL then evaluates INSERT RLS
-- even when the conflict branch would update an existing row.
drop policy if exists assistance_requests_insert_association on public.assistance_requests;
create policy assistance_requests_insert_association on public.assistance_requests for insert to authenticated
  with check (
    public.current_app_role() = 'association'
    and status = 'PENDING'
    and lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  );
drop policy if exists assistance_requests_update_staff on public.assistance_requests;
create policy assistance_requests_update_staff on public.assistance_requests for update to authenticated
  using (public.current_app_role() = 'staff')
  with check (public.current_app_role() = 'staff');

drop policy if exists request_documents_write on public.request_documents;
drop policy if exists request_documents_write_staff on public.request_documents;
create policy request_documents_write_staff on public.request_documents for all to authenticated
  using (public.current_app_role() = 'staff')
  with check (public.current_app_role() = 'staff');
drop policy if exists request_documents_insert_association on public.request_documents;
create policy request_documents_insert_association on public.request_documents for insert to authenticated
  with check (
    public.current_app_role() = 'association'
    and status = 'uploaded'
    and exists (
      select 1 from public.assistance_requests item
      where item.id = request_id
        and lower(item.association_name) = lower(coalesce(public.current_app_association(), ''))
    )
  );

drop policy if exists qualification_checks_write on public.qualification_checks;
drop policy if exists qualification_checks_write_staff on public.qualification_checks;
create policy qualification_checks_write_staff on public.qualification_checks for all to authenticated
  using (public.current_app_role() = 'staff')
  with check (public.current_app_role() = 'staff');
drop policy if exists qualification_checks_insert_association on public.qualification_checks;
create policy qualification_checks_insert_association on public.qualification_checks for insert to authenticated
  with check (
    public.current_app_role() = 'association'
    and status = 'pending'
    and exists (
      select 1 from public.assistance_requests item
      where item.id = request_id
        and lower(item.association_name) = lower(coalesce(public.current_app_association(), ''))
    )
  );

drop policy if exists generated_assistance_list_write_staff on public.generated_assistance_list;
create policy generated_assistance_list_write_staff on public.generated_assistance_list for all to authenticated
  using (public.current_app_role() = 'staff')
  with check (public.current_app_role() = 'staff');

drop policy if exists priority_list_write_staff on public.priority_list;
create policy priority_list_write_staff on public.priority_list for all to authenticated
  using (public.current_app_role() = 'staff')
  with check (public.current_app_role() = 'staff');

drop policy if exists notifications_write on public.notifications;
create policy notifications_write on public.notifications for all to authenticated
  using (
    public.current_app_role() in ('admin', 'staff')
    or user_id = auth.uid()::text
    or lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  )
  with check (
    public.current_app_role() in ('admin', 'staff')
    or user_id = auth.uid()::text
    or lower(association_name) = lower(coalesce(public.current_app_association(), ''))
  );

drop policy if exists audit_logs_write on public.audit_logs;
create policy audit_logs_write on public.audit_logs for all to authenticated
  using (public.current_app_role() = 'admin' or lower(user_email) = lower(coalesce(public.current_app_email(), '')))
  with check (public.current_app_role() = 'admin' or lower(user_email) = lower(coalesce(public.current_app_email(), '')));

drop policy if exists audit_changes_write on public.audit_changes;
create policy audit_changes_write on public.audit_changes for all to authenticated
  using (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.audit_logs item
      where item.id = audit_log_id
        and lower(item.user_email) = lower(coalesce(public.current_app_email(), ''))
    )
  )
  with check (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.audit_logs item
      where item.id = audit_log_id
        and lower(item.user_email) = lower(coalesce(public.current_app_email(), ''))
    )
  );

drop policy if exists report_history_write on public.report_history;
create policy report_history_write on public.report_history for all to authenticated
  using (public.current_app_role() = 'admin' or user_id = auth.uid()::text)
  with check (public.current_app_role() = 'admin' or user_id = auth.uid()::text);

drop policy if exists privacy_settings_write_admin on public.privacy_settings;
create policy privacy_settings_write_admin on public.privacy_settings for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists public_account_request on public.users;

-- Private request files. New uploads store only this object path in
-- request_documents; existing data_url rows remain readable during migration.
insert into storage.buckets (id, name, public, file_size_limit)
values ('request-documents', 'request-documents', false, 5242880)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists request_documents_storage_insert on storage.objects;
create policy request_documents_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'request-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists request_documents_storage_read on storage.objects;
create policy request_documents_storage_read on storage.objects for select to authenticated
  using (
    bucket_id = 'request-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_app_role() in ('admin', 'staff')
    )
  );

drop policy if exists request_documents_storage_update on storage.objects;
create policy request_documents_storage_update on storage.objects for update to authenticated
  using (
    bucket_id = 'request-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_app_role() = 'staff'
    )
  )
  with check (bucket_id = 'request-documents');

drop policy if exists request_documents_storage_delete on storage.objects;
create policy request_documents_storage_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'request-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_app_role() = 'admin'
    )
  );
-- Public account requests go through the rate-limited Express endpoint. There
-- is intentionally no anonymous direct-write policy on the users table.
