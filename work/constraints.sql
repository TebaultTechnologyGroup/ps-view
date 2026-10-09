-- users
alter table users add constraint users_customer_fk foreign key (customer_id) references customers (id);
alter table users add constraint users_createdby_fk foreign key (created_by) references users (id);
alter table users add constraint users_updatedby_fk foreign key (updated_by) references users (id);

-- groups
alter table groups add constraint groups_customer_fk foreign key (customer_id) references customers (id);

-- user_groups
alter table user_groups add constraint user_groups_group_fk foreign key (group_id) references groups (id);
alter table user_groups add constraint user_groups_user_fk foreign key (user_id) references users (id);
alter table user_groups add primary key (group_id, user_id);

-- portfolios
alter table portfolios add constraint portfolios_customer_fk foreign key (customer_id) references customers (id);
alter table portfolios add constraint portfolios_createdby_fk foreign key (created_by) references users (id);
alter table portfolios add constraint portfolios_updatedby_fk foreign key (updated_by) references users (id);

-- projects
alter table projects add constraint projects_customer_fk foreign key (customer_id) references customers (id);
alter table projects add constraint projects_owner_fk foreign key (owner_id) references users (id);
alter table projects add constraint projects_type_fk foreign key (type_id) references project_types (id);
alter table projects add constraint projects_createdby_fk foreign key (created_by) references users (id);
alter table projects add constraint projects_updatedby_fk foreign key (updated_by) references users (id);

-- project_status_reports
alter table project_status_reports add constraint project_status_reports_project_fk foreign key (project_id) references projects (id) on delete cascade;
alter table project_status_reports add contraint project_status_reports_status_fk foreign key (project_status_id) references project_status_reports (id);
