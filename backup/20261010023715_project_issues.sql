CREATE TABLE issue_categories (
  "id"          uuid        primary key,
   "locale_tag" text not null
);

alter table issue_categories enable row level security;

create policy issue_categories_access on issue_categories using (
  (auth.uid() IS NOT NULL)
);

CREATE TABLE project_issues (
  "id"          uuid        primary key,
  "project_id"  uuid        NOT NULL REFERENCES "public"."projects" (id) ON DELETE CASCADE,
  "issue_number" int        NOT NULL,
  "issue_id"    text        GENERATED ALWAYS AS ('I' || issue_number::text) STORED,
  "title"       text        NOT NULL,
  "description" text,
   "action_plan" TEXT,
   "resolution" text,
  "raised_by"    uuid                     REFERENCES "public"."users" (id),
  "raised_date" DATE not null default now(),
  "owner_id"    uuid                     REFERENCES "public"."users" (id),
  "category_id" uuid                     REFERENCES "public"."issue_categories" (id),
  "severity"    text,
  "priority"    text,
  "has_budget_impact" boolean default false,
  "has_schedule_impact" boolean default false,
  "has_scope_impact" boolean default false,
  "estimated_cost_impact" int default 0,
  "estimated_days_delayed" int default 0,
  "currency" text default '$',
  "status" text default 'New',
   "target_date" DATE,
   "actual_date" DATE,
   "deleted" boolean default false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid
);
alter table project_issues enable row level security;


-- Anyone who can see the project (projects RLS applies inside the subquery) can read its risks.
CREATE POLICY "project_issues_select" ON "public"."project_issues"
  FOR SELECT
  TO authenticated
  USING (
    deleted = false
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_issues.project_id)
  );

-- Only CAMUNDA users can create, change or delete risks.
CREATE POLICY "project_issues_admin" ON "public"."project_issues"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');

  -- functions

CREATE OR REPLACE FUNCTION public.project_issues_assign_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.issue_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(issue_number), 0) + 1
        INTO NEW.issue_number
        FROM public.project_issues
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE TRIGGER project_issues_assign_number
  BEFORE INSERT ON "public"."project_issues"
  FOR EACH ROW EXECUTE FUNCTION public.project_issues_assign_number();
