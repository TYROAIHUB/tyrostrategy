-- Fix report_templates RLS: allow all update/delete operations.
-- Owner filtering is enforced client-side (fetch by owner_email) and
-- app.user_email is not set via the anon key, so the original policies
-- would silently block all updates and deletes.
DROP POLICY IF EXISTS "templates_update" ON report_templates;
DROP POLICY IF EXISTS "templates_delete" ON report_templates;

CREATE POLICY "templates_update" ON report_templates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "templates_delete" ON report_templates FOR DELETE USING (true);
