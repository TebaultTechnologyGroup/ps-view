SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict IYLM7DQHeLm8BTRhEcv3dmLATaOXvLeptQQZApowtYSCcg37hP4ib1VsNbYgDHJ

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'debb7e2b-7a65-4546-8905-05def11b38f8', 'authenticated', 'authenticated', 'test-user2@acme.com', '$2a$10$J6QAY0B/ZfxUUZyIBT.nyOlE6qQcgDnnpaxe3JBmSShVTVcqX1B..', '2026-10-09 19:21:52.558613+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-10-09 19:21:52.556287+00', '2026-10-09 19:21:52.558951+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f80a8b2c-5a73-4ff2-80e0-981ad92fef2f', 'authenticated', 'authenticated', 'test-user1@acme.com', '$2a$10$z7v1QP/B3zppTR.GZpG9A.usYC8U/PnloG3VTjiy5hWz9JblELnma', '2026-10-09 18:40:59.600818+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-10-10 22:21:31.07147+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-10-09 18:40:59.598501+00', '2026-10-11 01:01:27.652769+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '25dfb822-2d9e-451f-9979-90babd79892c', 'authenticated', 'authenticated', 'test-admin1@acme.com', '$2a$06$HB.rMkRHL2dZV0t0Mhg8JOH/dHNdgP9TxTADPGXAUeXfZXnwkCDxC', '2026-10-09 15:04:40.365918+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-10-11 01:06:42.373927+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-10-09 15:04:40.363111+00', '2026-10-11 01:06:42.375325+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', '{"sub": "25dfb822-2d9e-451f-9979-90babd79892c", "email": "test-admin1@acme.com", "email_verified": false, "phone_verified": false}', 'email', '2026-10-09 15:04:40.364378+00', '2026-10-09 15:04:40.364395+00', '2026-10-09 15:04:40.364395+00', '1e145179-2200-4ccf-9f92-c4607dd9be7b'),
	('f80a8b2c-5a73-4ff2-80e0-981ad92fef2f', 'f80a8b2c-5a73-4ff2-80e0-981ad92fef2f', '{"sub": "f80a8b2c-5a73-4ff2-80e0-981ad92fef2f", "email": "test-user1@acme.com", "email_verified": false, "phone_verified": false}', 'email', '2026-10-09 18:40:59.59955+00', '2026-10-09 18:40:59.599564+00', '2026-10-09 18:40:59.599564+00', '8e151b57-8e5f-4ad0-a59b-abb414956d72'),
	('debb7e2b-7a65-4546-8905-05def11b38f8', 'debb7e2b-7a65-4546-8905-05def11b38f8', '{"sub": "debb7e2b-7a65-4546-8905-05def11b38f8", "email": "test-user2@acme.com", "email_verified": false, "phone_verified": false}', 'email', '2026-10-09 19:21:52.557429+00', '2026-10-09 19:21:52.557445+00', '2026-10-09 19:21:52.557445+00', 'ec4e2106-5fbf-484c-b9c1-21d38fc07bf1');



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("id", "name") VALUES
	('37038338-710b-4cf2-89d5-7f08c6e53b7b', 'Acme Inforporated');

--
-- Data for Name: issue_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."issue_categories" ("id", "locale_tag") VALUES
	('3e4cb7b3-3c87-4d00-b27c-e41a3e480fa1', 'technical'),
	('23b9e43c-03d8-4ca0-adb7-5c58f537cde3', 'access'),
	('9f28d8f4-5d84-409f-9553-322428365e1d', 'resource'),
	('ad7355b1-3c85-4d03-b492-32d7e12710f4', 'defects'),
	('667332e6-bc4d-470b-b87f-e7d14a6a80e7', 'readiness'),
	('659ebb62-5669-4af4-b22b-723b6b159dc9', 'other');


--
-- Data for Name: project_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."project_status" ("id", "locale_tag") VALUES
	('3e4cb7b3-3c87-4d00-b27c-e41a3e480fa1', 'onTrack'),
	('23b9e43c-03d8-4ca0-adb7-5c58f537cde3', 'atRisk'),
	('9f28d8f4-5d84-409f-9553-322428365e1d', 'blocked'),
	('ad7355b1-3c85-4d03-b492-32d7e12710f4', 'notStarted'),
	('667332e6-bc4d-470b-b87f-e7d14a6a80e7', 'onHold'),
	('659ebb62-5669-4af4-b22b-723b6b159dc9', 'canceled'),
	('5b0f7a52-6a0e-4c1c-9d51-3f6f0b1d2a77', 'complete');



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "full_name", "display_name", "email", "locale", "timezone", "country", "city", "customer_id", "active", "deleted", "created_at", "updated_at", "created_by", "updated_by", "role") VALUES
	('f80a8b2c-5a73-4ff2-80e0-981ad92fef2f', 'Temp User1', 'User1', 'test-user1@acme.com', NULL, NULL, 'United States', 'Acworth', '37038338-710b-4cf2-89d5-7f08c6e53b7b', true, false, '2026-10-09 18:40:59.598381+00', '2026-10-09 19:06:33.777+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 'CUSTOMER'),
	('debb7e2b-7a65-4546-8905-05def11b38f8', 'Test User2', 'User2', 'test-user2@acme.com', NULL, NULL, NULL, NULL, '37038338-710b-4cf2-89d5-7f08c6e53b7b', true, false, '2026-10-09 19:21:52.556169+00', '2026-10-09 19:21:52.556169+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 'CUSTOMER'),
	('25dfb822-2d9e-451f-9979-90babd79892c', 'Test Admin1', 'Admin1', 'test-admin1@acme.com', 'en-US', 'America/New_York', 'United States', 'Acworth', NULL, true, false, '2026-10-09 15:04:40.362972+00', '2026-10-10 02:12:12.375+00', NULL, '25dfb822-2d9e-451f-9979-90babd79892c', 'CAMUNDA');


INSERT INTO "public"."project_types" ("id", "name", "description", "active") VALUES
	('386380ad-4bdf-4bbc-80fb-9f08b12fcf60', 'custom', NULL, false),
	('432dbaa8-44ac-424c-a97c-0d41f053040f', 'quickstart', NULL, true);


INSERT INTO "public"."projects" ("id", "name", "owner_id", "type_id", "start_date", "end_date", "customer_id", "deleted", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Acme Quick Start', '25dfb822-2d9e-451f-9979-90babd79892c', NULL, '2026-10-09', '2026-12-11', '37038338-710b-4cf2-89d5-7f08c6e53b7b', false, '2026-10-09 19:33:08.044997+00', '2026-10-09 19:33:08.025+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c');


INSERT INTO "public"."project_actions" ("id", "project_id", "action_number", "title", "description", "resolution", "owner_id", "raised_by", "raised_date", "priority", "status", "due_date", "completed_date", "deleted", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('fbf811c5-b9b7-4361-a4c1-e5aab1f100d5', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 1, 'Create guidance on AI Token cost for the engagement', '<p>Use baseline token usage to estimate the total cost of the engagement using standard LLM utilization costs.</p>', NULL, '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-10-07', 'medium', 'open', '2026-10-12', NULL, false, '2026-10-10 21:52:34.816778+00', '2026-10-10 21:52:34.785+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c');

INSERT INTO "public"."project_change_orders" ("id", "project_id", "change_order_number", "title", "description", "justification", "owner_id", "requested_by", "requested_date", "status", "estimated_cost_impact", "estimated_days_impact", "currency", "approver", "decision_date", "deleted", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('0574798f-5452-4af4-8005-2f3f86905612', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 1, 'Extend the engagement two weeks', '<p>Due to SME availability, the project timeline needs to be extended 2 weeks.</p>', '<p>Each week of work is $15K</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-10-10', 'draft', 30000, 10, '$', 'Tom', NULL, false, '2026-10-10 22:09:05.022975+00', '2026-10-10 22:09:04.991+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c');


INSERT INTO "public"."project_issues" ("id", "project_id", "issue_number", "title", "description", "action_plan", "resolution", "raised_by", "raised_date", "owner_id", "category_id", "severity", "priority", "has_budget_impact", "has_schedule_impact", "has_scope_impact", "estimated_cost_impact", "estimated_days_delayed", "currency", "status", "target_date", "actual_date", "created_at", "updated_at", "created_by", "updated_by", "deleted") VALUES
	('6b77559e-ae7c-4ebb-b215-45bab436b2d9', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 1, 'Kickoff prerequisites incomplete', '<p>The kickoff prerequisites have not been completed.  This will impact our ability to begin on schedule.</p>', '<ul><li><p>The resources have already been assigned for the project; therefore we should kickoff as planned.</p></li><li><p>Acme needs to fast track the onboarding and completion of prerequisites</p></li><li><p>We may need to reduce the scope of the work to keep the schedule.</p></li></ul><p></p>', NULL, '25dfb822-2d9e-451f-9979-90babd79892c', '2026-10-10', '25dfb822-2d9e-451f-9979-90babd79892c', '667332e6-bc4d-470b-b87f-e7d14a6a80e7', 'high', 'high', false, true, false, 0, 5, '$', 'open', '2026-10-16', NULL, '2026-10-10 21:23:53.97255+00', '2026-10-10 21:23:53.928+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', false);


INSERT INTO "public"."project_permissions" ("id", "project_id", "type", "target_id", "level") VALUES
	('17b3e34b-c917-4d23-bcd3-6e275d90a69f', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'customer', '37038338-710b-4cf2-89d5-7f08c6e53b7b', 'view');


INSERT INTO "public"."project_risks" ("id", "project_id", "title", "description", "probability", "impact", "status", "mitigation", "owner_id", "due_date", "deleted", "created_at", "updated_at", "created_by", "updated_by", "risk_number") VALUES
	('5fc95b2b-cdb1-486f-858a-6f3ba5909639', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Workspace readiness', '<p>Prologis AWS Workspaces and related environment access for Camunda technical resources may not be provisioned in time, preventing the team from starting embedded delivery and discovery activities.</p>', 'high', 'high', 'open', '<p>Create an access-readiness tracker with one named Prologis owner per resource; set a hard readiness date before kickoff; run daily escalation until all workspaces, VPN, credentials, repositories, and required tools are validated. Use mock or synthetic data and offline design work as a contingency.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-10-31', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:40.772+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 2),
	('a7331f6e-6308-4fce-a46c-0a1bbd5e5d4e', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'SME Availability', '<p>Required Prologis SMEs and decision-makers may not be available across Global Operations, Finance, Accounting, Procurement, and Facility Management, delaying process discovery, design validation, and UAT.</p>', 'high', 'high', 'open', '<p>Schedule recurring SME meetings throughout the project.  Recommend daily or MWF.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-01', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:41.733+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 3),
	('58f8f136-22d7-459c-90c7-ec11d7cd0273', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'ProcessOS stability', '<p>ProcessOS is a beta release feature with frequent updates and revisions introducing risks to delivery timeline and inconsistent output.</p>', 'high', 'high', 'open', '<p>BP3 has AWS setup, but needs to get the distribution on the VDI.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-02', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:42.723+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 4),
	('c7c340bb-02fc-4bae-9e61-c0b66346edad', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Workflow is too complex for timeline', '<p>The Operating Expense Work Item lifecycle spans many stages and systems, and ambiguity about the representative depth of each stage could cause scope growth beyond the 12-week timebox.</p>', 'high', 'high', 'open', '<p>Scope is time-boxed to 12 weeks.  We will work with the SMEs to ensure scope of work is limited to fit into the allocated time.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-04', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:44.883+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 5),
	('15bc25c3-a241-40fa-b302-032eb73756bc', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Connectors and Job Workers too complex for timeline', '<p>The source and downstream system landscape, interfaces, data ownership, and integration constraints may not be sufficiently understood early enough to build reliable connectors and job workers.</p>', 'medium', 'low', 'open', '<p>Identify potential connectors and job workers early.  Test access to them early.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-05', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:45.828+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 6),
	('6cea63ef-caa6-4578-b274-3f41b6591090', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'AI tooling access', '<p>Prologis-approved AI tooling, model access, credentials, governance approvals, or output validation may be delayed or may not perform adequately for the targeted use cases.</p>', 'low', 'medium', 'open', '<p>Confirm the approved AI stack, access model, owners, usage limits, cost expectations, and validation criteria in Week 1</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-06', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:46.928+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 7),
	('9b543389-5bcb-4a4a-a035-bb9ee9852508', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Holiday schedules', '<p>Thanksgiving and year-end holiday absences may reduce SME, approver, technical, and vendor availability during demonstration, UAT, acceptance review, and handover activities.</p>', 'high', 'high', 'open', '<p>Identify SME availability during the holiday season.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-07', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:49.652+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 8),
	('d0a3b5b0-0dd4-4324-893e-52d32d2aac62', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Time line', '<p>The compressed 12-week schedule leaves limited float for delays, while each phase has a dependency-based gate from Discover through Deploy and closure.</p>', 'medium', 'low', 'open', '<p>Each phase has an estimated duration of time.  Track progress during each phase and alert if tracking shows potential delay.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-08', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:50.688+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 9),
	('37c9fd5e-0388-4bbd-9e83-4dc18cb63561', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Customer reviews', '<p>Customer review, acceptance, and remediation windows may extend beyond the planned end date, particularly if defects are found late or review periods overlap holiday availability.</p>', 'low', 'medium', 'open', '<p>Schedule customer reviews in advance and focus on high-risk remediations.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-09', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:52.758+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 10),
	('5c36d55b-60f2-4e5e-9309-e709cab2292a', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Environment readiness', '<p>Prologis owns test-environment readiness, promotion outside DEV/TEST, UAT execution, and operational acceptance; delays or gaps in these activities could prevent final demonstration readiness.</p>', 'high', 'high', 'open', '<p>Prologis is the technical owner.  TDL will review this with Prologis and help construct a readiness checklist.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-10', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:53.708+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 11),
	('3f637039-28e7-4591-a3ce-7681b0891764', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Quality of input', '<p>As-is process documentation, standard work instructions, data samples, and process variants may be incomplete or inconsistent across the large property-manager population, leading to incorrect models or rework.</p>', 'medium', 'low', 'open', '<p>Gather as much source documentation as possible before initiating the Scope &amp; Discovery phase of ProcessOS.  SME input and review is critical.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-11', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:55.377+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 12),
	('91d7292a-ff10-40c3-8368-05e8b8f19fd4', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Success measures or KPI complexity', '<p>Success criteria and numeric KPI baselines are not yet defined, making it difficult to prioritize trade-offs or determine whether the prototype demonstrates sufficient business value.</p>', 'low', 'medium', 'open', '<p>Agree up to three measurable KPIs, baselines, and evidence sources during Discover; document how each KPI will be demonstrated; obtain Business/Product Owner and sponsor alignment before Build.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-12', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:58.908+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 13),
	('b0b5d321-579f-4c1b-8e1e-c797d6b0512e', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'Copilot / Codex', '<p>Camunda has not tested Copilot as much as Claude.  It is unclear how the LLM will perform compared to Claude.</p>', 'high', 'high', 'open', '<p>Validate the quality of the LLM output as early as possible.  If needed, run similar tasks in Claude to compare output quality.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-11-13', false, '2026-10-09 20:15:08.549+00', '2026-10-09 20:22:59.882+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 14),
	('8ae6ace5-db58-499e-a139-424448879a7a', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', 'something could go wrong.', '<p><strong>And it ususally does!</strong></p>', 'medium', 'medium', 'closed', '<p>Wait until something explodes.</p>', '25dfb822-2d9e-451f-9979-90babd79892c', '2026-10-30', false, '2026-10-09 19:43:53.156407+00', '2026-10-09 20:23:04.773+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c', 1);


--
-- Data for Name: project_status_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."project_status_reports" ("id", "project_id", "project_status_id", "comments", "range_start", "range_end", "published_at", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('93f698f8-d870-484f-89a3-748839de1b91', 'e62ea380-5d9f-4d2c-ab75-bff68a25b580', NULL, 'Bob began the discovery phase of the project.  He will be ready to review results with SMEs on Monday.', '2026-10-05', '2026-10-09', '2026-10-09 19:34:35.545+00', '2026-10-09 19:34:28.072047+00', '2026-10-09 19:34:35.545+00', '25dfb822-2d9e-451f-9979-90babd79892c', '25dfb822-2d9e-451f-9979-90babd79892c');


--
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 21, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict IYLM7DQHeLm8BTRhEcv3dmLATaOXvLeptQQZApowtYSCcg37hP4ib1VsNbYgDHJ

RESET ALL;
