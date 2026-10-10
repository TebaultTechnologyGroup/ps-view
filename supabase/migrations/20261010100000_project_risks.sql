CREATE TABLE "public"."project_risks" (
  "id"          uuid                     NOT NULL,
  "project_id"  uuid                     NOT NULL REFERENCES "public"."projects" (id) ON DELETE CASCADE,
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

CREATE INDEX project_risks_project_idx ON "public"."project_risks" (project_id);

ALTER TABLE "public"."project_risks" ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the project (projects RLS applies inside the subquery) can read its risks.
CREATE POLICY "project_risks_select" ON "public"."project_risks"
  FOR SELECT
  TO authenticated
  USING (
    deleted = false
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_risks.project_id)
  );

-- Only CAMUNDA users can create, change or delete risks.
CREATE POLICY "project_risks_admin" ON "public"."project_risks"
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'CAMUNDA')
  WITH CHECK (public.current_user_role() = 'CAMUNDA');
