-- locale_tag is an i18n key (see "issue.category.*" in src/i18n/locales).
INSERT INTO "public"."issue_categories" ("id", "locale_tag") VALUES
  (gen_random_uuid(), 'issue.category.technical'),
  (gen_random_uuid(), 'issue.category.resource'),
  (gen_random_uuid(), 'issue.category.scope'),
  (gen_random_uuid(), 'issue.category.schedule'),
  (gen_random_uuid(), 'issue.category.vendor'),
  (gen_random_uuid(), 'issue.category.other');
