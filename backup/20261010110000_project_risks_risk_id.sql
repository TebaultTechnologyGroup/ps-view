-- Per-project external key: R1, R2, ... Never reused (soft-deleted rows count).
ALTER TABLE "public"."project_risks"
  ADD COLUMN "risk_number" integer;

-- Backfill existing rows in creation order.
UPDATE "public"."project_risks" r
SET risk_number = n.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY project_id ORDER BY created_at, id) AS rn
  FROM "public"."project_risks"
) n
WHERE r.id = n.id;

ALTER TABLE "public"."project_risks"
  ALTER COLUMN "risk_number" SET NOT NULL,
  ADD COLUMN "risk_id" text GENERATED ALWAYS AS ('R' || risk_number::text) STORED,
  ADD CONSTRAINT project_risks_project_number_key UNIQUE (project_id, risk_number),
  ADD CONSTRAINT project_risks_project_risk_id_key UNIQUE (project_id, risk_id);

CREATE OR REPLACE FUNCTION public.project_risks_assign_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  BEGIN
    IF NEW.risk_number IS NULL THEN
      -- serialize concurrent inserts for the same project
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.project_id::text, 0));
      SELECT COALESCE(MAX(risk_number), 0) + 1
        INTO NEW.risk_number
        FROM public.project_risks
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  END
  $function$;

CREATE TRIGGER project_risks_assign_number
  BEFORE INSERT ON "public"."project_risks"
  FOR EACH ROW EXECUTE FUNCTION public.project_risks_assign_number();
