CREATE TABLE "public"."project_actions" (
  "id"             uuid                     NOT NULL,
  "project_id"     uuid                     NOT NULL,
  "action_number"  integer                  NOT NULL,
  "title"          text                     NOT NULL,
  "description"    text,
  "resolution"     text,
  "owner_id"       uuid,
  "raised_by"      uuid,
  "raised_date"    date                     NOT NULL DEFAULT now(),
  "priority"       text                     NOT NULL DEFAULT 'medium'::text,
  "status"         text                     NOT NULL DEFAULT 'open'::text,
  "due_date"       date,
  "completed_date" date,
  "deleted"        boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"     uuid,
  "updated_by"     uuid,
  CONSTRAINT "project_actions_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_actions_project_number_key" UNIQUE (project_id, action_number),
  CONSTRAINT "project_actions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT "project_actions_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT "project_actions_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES public.users(id)
);

ALTER TABLE "public"."project_actions"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."project_actions"
  ADD COLUMN "action_id" text GENERATED ALWAYS AS (('A'::text || (action_number)::text)) STORED;

CREATE TRIGGER project_actions_assign_number
  BEFORE INSERT ON public.project_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.project_actions_assign_number();

CREATE POLICY "project_actions_admin" ON "public"."project_actions"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_actions_select" ON "public"."project_actions"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_actions.project_id)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_actions" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_actions" TO "service_role";

REVOKE ALL ON TABLE "public"."project_actions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_actions" TO "postgres";
