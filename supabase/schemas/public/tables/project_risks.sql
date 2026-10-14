CREATE TABLE "public"."project_risks" (
  "id"          uuid                     NOT NULL,
  "project_id"  uuid                     NOT NULL,
  "title"       text                     NOT NULL,
  "description" text,
  "probability" text                     NOT NULL DEFAULT 'medium'::text,
  "impact"      text                     NOT NULL DEFAULT 'medium'::text,
  "status"      text                     NOT NULL DEFAULT 'open'::text,
  "mitigation"  text,
  "owner_id"    uuid,
  "due_date"    date,
  "deleted"     boolean                  NOT NULL DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  "risk_number" integer                  NOT NULL,
  CONSTRAINT "project_risks_impact_check" CHECK ((impact = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT "project_risks_pkey" PRIMARY KEY (id),
  CONSTRAINT "project_risks_probability_check" CHECK ((probability = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT "project_risks_project_number_key" UNIQUE (project_id, risk_number),
  CONSTRAINT "project_risks_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'mitigated'::text, 'accepted'::text, 'closed'::text]))),
  CONSTRAINT "project_risks_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT "project_risks_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id)
);

ALTER TABLE "public"."project_risks"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."project_risks"
  ADD COLUMN "risk_id" text GENERATED ALWAYS AS (('R'::text || (risk_number)::text)) STORED;

ALTER TABLE "public"."project_risks"
  ADD CONSTRAINT "project_risks_project_risk_id_key" UNIQUE (project_id, risk_id);

CREATE INDEX project_risks_project_idx ON public.project_risks USING btree (project_id);

CREATE TRIGGER project_risks_assign_number
  BEFORE INSERT ON public.project_risks
  FOR EACH ROW
  EXECUTE FUNCTION public.project_risks_assign_number();

CREATE POLICY "project_risks_admin" ON "public"."project_risks"
  FOR ALL
  TO "authenticated"
  USING ((public.current_user_role() = 'CAMUNDA'::text))
  WITH CHECK ((public.current_user_role() = 'CAMUNDA'::text));

CREATE POLICY "project_risks_select" ON "public"."project_risks"
  FOR SELECT
  TO "authenticated"
  USING (((deleted = false) AND (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE (p.id = project_risks.project_id)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_risks" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_risks" TO "service_role";

REVOKE ALL ON TABLE "public"."project_risks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_risks" TO "postgres";
