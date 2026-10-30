-- WARNING: this file drops existing tables. Run it only on a new, empty Supabase project.
-- ============================================================
-- SALES AI AGENT — SUPABASE MIGRATION 001
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────
-- DROP EXISTING (safe — test data only)
-- ─────────────────────────────────────────
drop table if exists public.crm_activities cascade;
drop table if exists public.deal_stages    cascade;
drop table if exists public.meetings       cascade;
drop table if exists public.profiles       cascade;

drop function if exists handle_new_user()        cascade;
drop function if exists handle_email_confirmed() cascade;
drop function if exists set_updated_at()         cascade;

drop type if exists meeting_type_enum      cascade;
drop type if exists meeting_source_enum    cascade;
drop type if exists deal_stage_enum        cascade;
drop type if exists crm_activity_type_enum cascade;

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
create type meeting_type_enum as enum (
  'First meeting',
  'Follow-up',
  'Demo',
  'Negotiation'
);

create type meeting_source_enum as enum (
  'form',
  'followup'
);

-- discovery and terminated removed — not used in the app UI
create type deal_stage_enum as enum (
  'prospecting',
  'demo',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'on_hold'
);

create type crm_activity_type_enum as enum (
  'brief',
  'call',
  'demo',
  'contract',
  'note',
  'meeting_done',
  'proposal',
  'followup',
  'next_meeting',
  'won',
  'lost',
  'on_hold',
  'terminated',
  'stage_change'
);

-- ─────────────────────────────────────────
-- HELPER: updated_at trigger function
-- ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────
-- TABLE: profiles
-- Sales rep user profiles — extends auth.users.
-- Populated automatically via trigger on signup.
-- is_verified flips to true when email is confirmed.
-- ─────────────────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  rep_name         text        not null,
  rep_designation  text        not null,
  whatsapp_number  text,
  email            text        not null,
  is_verified      boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();

-- ── Trigger: auto-create profile row on signup ───────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, rep_name, rep_designation, whatsapp_number, email, is_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'rep_name', ''),
    coalesce(new.raw_user_meta_data->>'rep_designation', ''),
    new.raw_user_meta_data->>'rep_whatsapp',
    new.email,
    false   -- always false until email link is clicked
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Trigger: flip is_verified when email is confirmed ───────────────────
create or replace function handle_email_confirmed()
returns trigger as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
    set    is_verified = true,
           updated_at  = now()
    where  id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_email_confirmed
  after update on auth.users
  for each row execute function handle_email_confirmed();

-- ─────────────────────────────────────────
-- TABLE: meetings
-- ─────────────────────────────────────────
create table public.meetings (
  id                   uuid primary key default uuid_generate_v4(),

  -- Ownership
  user_id              uuid not null references public.profiles(id) on delete cascade,
  rep_name             text not null,    -- denormalized for reminder API (no JOIN needed)
  rep_whatsapp         text,             -- denormalized for WhatsApp sending

  -- Hospital details
  hospital_name        text not null,
  city                 text not null,
  hospital_image_url   text,
  hospital_logo_url    text,
  hospital_url         text,
  beds                 integer,

  -- Contact details
  contact_name         text not null,
  contact_designation  text,

  -- Meeting details
  software_types       text[]            not null default '{}',
  meeting_date         date              not null,
  meeting_time         time              not null,  -- stored in UTC
  meeting_type         meeting_type_enum not null,
  objective            text,

  -- AI brief output
  pitch_point          text,
  live_signal          text,
  brief_json           jsonb,

  -- Reminder & follow-up linking
  reminder_sent        boolean             not null default false,
  reminder_24h_sent    boolean             not null default false,
  source               meeting_source_enum not null default 'form',
  parent_meeting_id    uuid references public.meetings(id) on delete set null,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_meetings_updated_at
  before update on public.meetings
  for each row execute function set_updated_at();

create index idx_meetings_user_id   on public.meetings(user_id);
create index idx_meetings_rep_name  on public.meetings(rep_name);
create index idx_meetings_date_time on public.meetings(meeting_date, meeting_time);
create index idx_meetings_hospital  on public.meetings(hospital_name, city);
create index idx_meetings_reminder  on public.meetings(reminder_sent) where reminder_sent = false;
create index idx_meetings_parent    on public.meetings(parent_meeting_id) where parent_meeting_id is not null;

-- ─────────────────────────────────────────
-- TABLE: crm_activities
-- Activity log per hospital per rep (previously localStorage only).
-- ─────────────────────────────────────────
create table public.crm_activities (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  hospital_name  text not null,
  city           text not null,
  meeting_id     uuid references public.meetings(id) on delete set null,
  activity_date  date not null default current_date,
  type           crm_activity_type_enum not null,
  note           text not null default '',
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_crm_user_hospital on public.crm_activities(user_id, hospital_name, city);
create index idx_crm_meeting_id    on public.crm_activities(meeting_id) where meeting_id is not null;

-- ─────────────────────────────────────────
-- TABLE: deal_stages
-- One row per (user, hospital, city). Upserted on every stage change.
-- ─────────────────────────────────────────
create table public.deal_stages (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  hospital_name  text not null,
  city           text not null,
  stage          deal_stage_enum not null default 'prospecting',
  updated_at     timestamptz not null default now(),

  unique (user_id, hospital_name, city)
);

create trigger trg_deal_stages_updated_at
  before update on public.deal_stages
  for each row execute function set_updated_at();

create index idx_deal_stages_user on public.deal_stages(user_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Each user can only see and modify their own rows.
-- Server-side APIs use the service_role key which bypasses RLS.
-- ─────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.meetings       enable row level security;
alter table public.crm_activities enable row level security;
alter table public.deal_stages    enable row level security;

-- profiles
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- meetings
create policy "meetings: select own"
  on public.meetings for select
  using (auth.uid() = user_id);

create policy "meetings: insert own"
  on public.meetings for insert
  with check (auth.uid() = user_id);

create policy "meetings: update own"
  on public.meetings for update
  using (auth.uid() = user_id);

create policy "meetings: delete own"
  on public.meetings for delete
  using (auth.uid() = user_id);

-- crm_activities
create policy "crm: select own"
  on public.crm_activities for select
  using (auth.uid() = user_id);

create policy "crm: insert own"
  on public.crm_activities for insert
  with check (auth.uid() = user_id);

create policy "crm: update own"
  on public.crm_activities for update
  using (auth.uid() = user_id);

create policy "crm: delete own"
  on public.crm_activities for delete
  using (auth.uid() = user_id);

-- deal_stages
create policy "deal_stages: select own"
  on public.deal_stages for select
  using (auth.uid() = user_id);

create policy "deal_stages: insert own"
  on public.deal_stages for insert
  with check (auth.uid() = user_id);

create policy "deal_stages: update own"
  on public.deal_stages for update
  using (auth.uid() = user_id);

create policy "deal_stages: delete own"
  on public.deal_stages for delete
  using (auth.uid() = user_id);
