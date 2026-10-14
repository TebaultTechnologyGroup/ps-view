CREATE TABLE "public"."project_dependencies" (
  "id"                uuid                     NOT NULL,
  "project_id"        uuid                     NOT NULL,
  "dependency_number" integer                  NOT NULL,
  "title"             text                     NOT NULL,
  "description"       text,
  "impact"            text,
  "resolution"        text,
  "dependency_type"   text                     NOT NULL DEFAULT 'external'::text,
  "direction"         text                     NOT NULL DEFAULT 'inbound'::text,
  "related_party"     text,
  "owner_id"          uuid,
  "raised_by"         uuid,
  "raised_date"       date                     NOT NULL DEFAULT now(),
  "priority"          text                     NOT NULL DEFAULT 'medium'::text,
  "status"            text                     NOT NULL DEFAULT 'open'::text,
  "due_date"          date,
  "resolved_date"     date,
  "deleted"           boolean                  NOT NULL DEFAULT false,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"        uuid,
  "updated_by"        uuid,
  CONSTRAINT "project_dependencies_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_dependencies_project_number_key" UNIQUE (project_id, dependency_number),
  CONSTRAINT "project_dependencies_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT "project_dependencies_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT "project_dependencies_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES public.users(id)
);

ALTER TABLE "public"."project_dependencies"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."project_dependencies"
  ADD COLUMN "dependency_id" text GENERATED ALWAYS AS (('D'::text || (dependency_number)::text)) STORED;

CREATE TRIGGER project_dependencies_assign_number
  BEFORE INSERT ON public.project_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION public.project_dependencies_assign_number();

CREATE POLICY "project_dependencies_admin" ON "public"."project_dependencies"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_dependencies_select" ON "public"."project_dependencies"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_dependencies.project_id)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_dependencies" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_dependencies" TO "service_role";

REVOKE ALL ON TABLE "public"."project_dependencies" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_dependencies" TO "postgres";
