create table customers (
  id uuid primary key,
  name text not null
);

alter table customers enable row level security;


create table users (
  id uuid primary key,
  full_name text,
  display_name text,
  email text,
  locale text,
  timezone text,
  country text,
  city text,
  role text not null default 'CUSTOMER', -- CUSTOMER, CAMUNDA
  customer_id uuid, 
  active boolean default true,
  deleted boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table users enable row level security;

create table groups (
  id uuid primary key,
  name text,
  customer_id uuid,
  deleted boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table groups enable row level security;

create table user_groups (
  group_id uuid not null,
  user_id uuid not null,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid
);

alter table user_groups enable row level security;

create table portfolios(
  id uuid primary key,
  name text,
  customer_id uuid,
  deleted boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table portfolios enable row level security;

create table projects(
  id uuid primary key,
  name text,
  owner_id uuid,
  type_id uuid,
  start_date date,
  end_date date,
  customer_id uuid,
  deleted boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table projects enable row level security;

create table project_permissions(
  id uuid primary key,
  project_id uuid,
  type text default 'user', -- user, group
  target_id uuid,           -- FK to user or group
  level text                -- view, edit, owner
);

alter table project_permissions enable row level security;

create table portfolio_projects(
  project_id uuid not null,
  portfolio_id uuid not null,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid
);

alter table portfolio_projects enable row level security;

create table project_types(
  id uuid primary key,
  name text,
  description uuid,
  active boolean default false  
);

alter table portfolio_project_types enable row level security;

create table project_status_reports(
   id uuid primary key,
   project_id uuid,
   project_status_id uuid,
   comments text,
   range_start date,
   range_end date,
   published_at timestamp with time zone,
   created_at timestamp with time zone not null default now(),
   updated_at timestamp with time zone not null default now(),
   created_by uuid,
   updated_by uuid
);

alter table create table project_status_reports enable row level security;

CREATE TABLE "public"."project_risks" (
  "id"          uuid                     NOT NULL,
  "project_id"  uuid                     NOT NULL REFERENCES "public"."projects" (id) ON DELETE CASCADE,
  "risk_number" integer                  NOT NULL,
  "risk_id"     text                     GENERATED ALWAYS AS ('R' || risk_number::text) STORED,
  "title"       text                     NOT NULL,
  "description" text,
  "probability" text                     NOT NULL DEFAULT 'medium' CHECK (probability IN ('low', 'medium', 'high')),
  "impact"      text                     NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
  "status"      text                     NOT NULL DEFAULT 'open'   CHECK (status IN ('open', 'mitigated', 'accepted', 'closed')),
  "mitigation"  text,
  "owner_id"    uuid                     REFERENCES "public"."users" (id),
  "due_date"    date,
  "deleted"     boolean                  NOT NULL DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  CONSTRAINT "project_risks_pkey" PRIMARY KEY (id)
);
