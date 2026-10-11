CREATE TABLE project_milestones (
  "id"               uuid        primary key,
  "project_id"       uuid        NOT NULL REFERENCES "public"."projects" (id) ON DELETE CASCADE,
  -- Per-project external key: M1, M2, ... Never reused (soft-deleted rows count).
  "milestone_number" int         NOT NULL,
  "milestone_id"     text        GENERATED ALWAYS AS ('M' || milestone_number::text) STORED,
  "title"            text        NOT NULL,
  "description"      text,
  "notes"            text,
  "owner_id"         uuid        REFERENCES "public"."users" (id),
  "status"           text        NOT NULL DEFAULT 'not_started',
  -- baseline date agreed with the customer
  "planned_date"     date,
  -- current expectation; differs from planned_date when slipping
  "forecast_date"    date,
  "actual_date"      date,
  "deleted"          boolean     NOT NULL DEFAULT false,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"       uuid,
  "updated_by"       uuid,
  CONSTRAINT project_milestones_project_number_key UNIQUE (project_id, milestone_number)
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the project (projects RLS applies inside the subquery) can read its milestones.
CREATE POLICY "project_milestones_select" ON "public"."project_milestones"
  FOR SELECT
  TO authenticated
  USING (
    deleted = false
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_milestones.project_id)
  );

-- Only CAMUNDA users can create, change or delete milestones.
CREATE POLICY "project_milestones_admin" ON "public"."project_milestones"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');

CREATE OR REPLACE FUNCTION public.project_milestones_assign_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.milestone_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(milestone_number), 0) + 1
        INTO NEW.milestone_number
        FROM public.project_milestones
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE TRIGGER project_milestones_assign_number
  BEFORE INSERT ON "public"."project_milestones"
  FOR EACH ROW EXECUTE FUNCTION public.project_milestones_assign_number();
