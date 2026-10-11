-- portfolio_projects was created without keys. Make membership unique and tie it to both parents.
DELETE FROM "public"."portfolio_projects" pp
WHERE NOT EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = pp.portfolio_id)
   OR NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pp.project_id);

ALTER TABLE "public"."portfolio_projects"
  ADD CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY (portfolio_id, project_id),
  ADD CONSTRAINT "portfolio_projects_portfolio_fk"
    FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ADD CONSTRAINT "portfolio_projects_project_fk"
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
