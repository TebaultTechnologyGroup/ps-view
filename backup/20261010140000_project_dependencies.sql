CREATE TABLE project_dependencies (
  "id"                uuid        primary key,
  "project_id"        uuid        NOT NULL REFERENCES "public"."projects" (id) ON DELETE CASCADE,
  -- Per-project external key: D1, D2, ... Never reused (soft-deleted rows count).
  "dependency_number" int         NOT NULL,
  "dependency_id"     text        GENERATED ALWAYS AS ('D' || dependency_number::text) STORED,
  "title"             text        NOT NULL,
  "description"       text,
  "impact"            text,
  "resolution"        text,
  -- internal: within Camunda / the delivery team; external: customer, partner or vendor
  "dependency_type"   text        NOT NULL DEFAULT 'external',
  -- inbound: the project depends on someone else; outbound: someone else depends on the project
  "direction"         text        NOT NULL DEFAULT 'inbound',
  -- the team, customer or vendor on the other side of the dependency
  "related_party"     text,
  "owner_id"          uuid        REFERENCES "public"."users" (id),
  "raised_by"         uuid        REFERENCES "public"."users" (id),
  "raised_date"       date        NOT NULL DEFAULT now(),
  "priority"          text        NOT NULL DEFAULT 'medium',
  "status"            text        NOT NULL DEFAULT 'open',
  "due_date"          date,
  "resolved_date"     date,
  "deleted"           boolean     NOT NULL DEFAULT false,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"        uuid,
  "updated_by"        uuid,
  CONSTRAINT project_dependencies_project_number_key UNIQUE (project_id, dependency_number)
);

ALTER TABLE project_dependencies ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the project (projects RLS applies inside the subquery) can read its dependencies.
CREATE POLICY "project_dependencies_select" ON "public"."project_dependencies"
  FOR SELECT
  TO authenticated
  USING (
    deleted = false
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_dependencies.project_id)
  );

-- Only CAMUNDA users can create, change or delete dependencies.
CREATE POLICY "project_dependencies_admin" ON "public"."project_dependencies"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');

CREATE OR REPLACE FUNCTION public.project_dependencies_assign_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.dependency_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(dependency_number), 0) + 1
        INTO NEW.dependency_number
        FROM public.project_dependencies
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE TRIGGER project_dependencies_assign_number
  BEFORE INSERT ON "public"."project_dependencies"
  FOR EACH ROW EXECUTE FUNCTION public.project_dependencies_assign_number();
