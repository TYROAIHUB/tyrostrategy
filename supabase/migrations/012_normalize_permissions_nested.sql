-- ============================================================================
-- Migration 012: role_permissions.permissions → pure nested shape
-- ============================================================================
-- Problem:
--   DB rows accumulated a MIXED shape:
--     * Initial seed wrote flat keys: canEditProje, canDeleteAksiyon, ...
--     * UI saves wrote nested shape: { proje: {edit,create,delete}, ... }
--     * Each upsert preserved flat keys that were still in localStorage
--   has_perm() in migration 007 reads flat keys. Once the UI saves a
--   clean nested-only replace, RLS silently breaks for that role.
--
-- Fix:
--   1. has_perm() now reads the NESTED path: 'proje.delete' → #>>'{proje,delete}'
--      (the frontend's RolePermissions shape is already nested).
--   2. Strip flat keys from all existing rows so future fetches return
--      a clean shape (no spurious top-level booleans).
-- ============================================================================

-- ── 1. has_perm reads nested path ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION app.has_perm(path text) RETURNS boolean AS $$
DECLARE
  v_role text := app.current_role();
  v_val  text;
BEGIN
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- 'proje.delete' → ARRAY['proje','delete'] → JSONB #>> path
  SELECT rp.permissions #>> string_to_array(path, '.') INTO v_val
  FROM public.role_permissions rp
  WHERE rp.role = v_role;

  RETURN COALESCE(v_val::boolean, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ── 2. Strip legacy flat keys from every row ──────────────────────────────
-- jsonb_build_object emits ONLY the keys we list — anything else is dropped.
-- COALESCE defends against rows that legacy-wrote only flat (shouldn't
-- happen in current data but cheap insurance).
UPDATE public.role_permissions
SET permissions = jsonb_strip_nulls(jsonb_build_object(
  'pages',       permissions -> 'pages',
  'proje',       permissions -> 'proje',
  'aksiyon',     permissions -> 'aksiyon',
  'editOnlyOwn', permissions -> 'editOnlyOwn',
  'viewOnlyOwn', permissions -> 'viewOnlyOwn'
));

-- ============================================================================
-- Sanity (run manually if desired):
--   SELECT role, jsonb_object_keys(permissions) FROM public.role_permissions;
--   → only: pages, proje, aksiyon, editOnlyOwn, viewOnlyOwn
-- ============================================================================
