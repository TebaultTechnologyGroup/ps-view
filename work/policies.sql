
-- this allows owners and those with permission to select
-- projects
CREATE POLICY project_permission_access ON projects
for select
USING (
  owner_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM project_permissions pp
    WHERE pp.project_id = projects.id
    AND (
      -- Direct user
      pp.type = 'user' AND pp.target_id = auth.uid()
      -- User's groups
      OR pp.type = 'group' AND EXISTS (
        SELECT 1 FROM user_groups ug 
        WHERE ug.group_id = pp.target_id 
        AND ug.user_id = auth.uid()
      )
      -- User's customer
      OR pp.type = 'customer' AND pp.target_id = (
        SELECT customer_id FROM users u 
        WHERE u.id = auth.uid()
      )
    )
  )
);
-- this allows employees the option to edit users.
CREATE POLICY admin_projects on projects USING (
  exists (select 1 from users where id = auth.uid() and role = 'CAMUNDA')
);

CREATE POLICY customer_view ON customers USING (auth.uid() IS NOT NULL);


CREATE POLICY user_access ON users USING (
  -- Current user is CAMUNDA (sees all users)
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'CAMUNDA'
  )
  OR
  -- Current user sees others with same customer_id
  customer_id = (SELECT customer_id FROM users WHERE id = auth.uid())
);

-- just make sure user is logged in
create policy access_user_groups 
on user_groups USING (auth.uid() IS NOT NULL);

CREATE POLICY portfolio_access ON portfolios USING (
  -- Current user is CAMUNDA (sees all users)
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'CAMUNDA'
  )
  OR
  -- Current user sees portfolios with same customer_id
  customer_id = (SELECT customer_id FROM users WHERE id = auth.uid())
);

create policy project_permission_access on project_permissions using (
  (auth.uid() IS NOT NULL)
);

create policy portfolio_projects_access on portfolio_projects using (
  (auth.uid() IS NOT NULL)
);

create policy project_types_access on project_types using (
  (auth.uid() IS NOT NULL)
);

create policy project_status_reports_access on project_status_reports using (
  (auth.uid() IS NOT NULL)
);
