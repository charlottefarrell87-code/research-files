-- ============================================================
-- Research Hub – Supabase Schema
-- Run this in your Supabase SQL editor after creating a project
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- PROFILES  (extends Supabase auth.users)
-- ──────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  role        text not null default 'viewer' check (role in ('admin','viewer')),
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Automatically create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────
-- PROJECTS
-- ──────────────────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  color       text default '#6366f1',
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.projects enable row level security;

create policy "Authenticated users can view projects"
  on public.projects for select using (auth.role() = 'authenticated');
create policy "Admins can insert projects"
  on public.projects for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Admins can update projects"
  on public.projects for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Admins can delete projects"
  on public.projects for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────
-- SUB-PROJECTS
-- ──────────────────────────────────────────────────────────
create table public.sub_projects (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  description text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.sub_projects enable row level security;

create policy "Authenticated users can view sub_projects"
  on public.sub_projects for select using (auth.role() = 'authenticated');
create policy "Admins can manage sub_projects"
  on public.sub_projects for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────
-- RESEARCH FILES
-- ──────────────────────────────────────────────────────────
create table public.research_files (
  id             uuid primary key default uuid_generate_v4(),
  project_id     uuid references public.projects(id) on delete cascade,
  sub_project_id uuid references public.sub_projects(id) on delete cascade,
  name           text not null,
  description    text,
  file_type      text not null check (file_type in ('html_upload','external_link')),
  -- for html_upload: path in Supabase Storage bucket "research-files"
  storage_path   text,
  -- for external_link: the URL
  external_url   text,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint file_has_source check (storage_path is not null or external_url is not null)
);
alter table public.research_files enable row level security;

create policy "Authenticated users can view files"
  on public.research_files for select using (auth.role() = 'authenticated');
create policy "Admins can manage files"
  on public.research_files for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────
-- COMMENTS
-- ──────────────────────────────────────────────────────────
create table public.comments (
  id             uuid primary key default uuid_generate_v4(),
  project_id     uuid references public.projects(id) on delete cascade,
  sub_project_id uuid references public.sub_projects(id) on delete cascade,
  author_id      uuid not null references public.profiles(id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.comments enable row level security;

create policy "Authenticated users can view comments"
  on public.comments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert comments"
  on public.comments for insert with check (auth.uid() = author_id);
create policy "Authors and admins can update comments"
  on public.comments for update using (
    auth.uid() = author_id or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Authors and admins can delete comments"
  on public.comments for delete using (
    auth.uid() = author_id or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────
-- STORAGE BUCKET
-- ──────────────────────────────────────────────────────────
-- Run this in the Supabase dashboard > Storage > New bucket
-- Name: research-files, Private: true
-- Or uncomment the line below if using Supabase CLI:
-- insert into storage.buckets (id, name, public) values ('research-files', 'research-files', false);

-- Storage RLS
create policy "Authenticated users can read research files"
  on storage.objects for select
  using (bucket_id = 'research-files' and auth.role() = 'authenticated');

create policy "Admins can upload research files"
  on storage.objects for insert
  with check (
    bucket_id = 'research-files' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can delete research files"
  on storage.objects for delete
  using (
    bucket_id = 'research-files' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ──────────────────────────────────────────────────────────
-- HELPER FUNCTIONS & INDEXES
-- ──────────────────────────────────────────────────────────
-- Full-text search indexes
create index projects_fts on public.projects using gin(to_tsvector('english', name || ' ' || coalesce(description,'')));
create index files_fts on public.research_files using gin(to_tsvector('english', name || ' ' || coalesce(description,'')));

-- Updated-at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger set_projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger set_sub_projects_updated_at before update on public.sub_projects
  for each row execute procedure public.set_updated_at();
create trigger set_files_updated_at before update on public.research_files
  for each row execute procedure public.set_updated_at();
create trigger set_comments_updated_at before update on public.comments
  for each row execute procedure public.set_updated_at();
