CREATE TABLE project_actions (
  "id"             uuid        primary key,
  "project_id"     uuid        NOT NULL REFERENCES "public"."projects" (id) ON DELETE CASCADE,
  -- Per-project external key: A1, A2, ... Never reused (soft-deleted rows count).
  "action_number"  int         NOT NULL,
  "action_id"      text        GENERATED ALWAYS AS ('A' || action_number::text) STORED,
  "title"          text        NOT NULL,
  "description"    text,
  "resolution"     text,
  "owner_id"       uuid        REFERENCES "public"."users" (id),
  "raised_by"      uuid        REFERENCES "public"."users" (id),
  "raised_date"    date        NOT NULL DEFAULT now(),
  "priority"       text        NOT NULL DEFAULT 'medium',
  "status"         text        NOT NULL DEFAULT 'open',
  "due_date"       date,
  "completed_date" date,
  "deleted"        boolean     NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"     uuid,
  "updated_by"     uuid,
  CONSTRAINT project_actions_project_number_key UNIQUE (project_id, action_number)
);

ALTER TABLE project_actions ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the project (projects RLS applies inside the subquery) can read its actions.
CREATE POLICY "project_actions_select" ON "public"."project_actions"
  FOR SELECT
  TO authenticated
  USING (
    deleted = false
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_actions.project_id)
  );

-- Only CAMUNDA users can create, change or delete actions.
CREATE POLICY "project_actions_admin" ON "public"."project_actions"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');

CREATE OR REPLACE FUNCTION public.project_actions_assign_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.action_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(action_number), 0) + 1
        INTO NEW.action_number
        FROM public.project_actions
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE TRIGGER project_actions_assign_number
  BEFORE INSERT ON "public"."project_actions"
  FOR EACH ROW EXECUTE FUNCTION public.project_actions_assign_number();
