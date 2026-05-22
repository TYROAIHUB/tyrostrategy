-- ============================================================================
-- Migration 029: LALE iş kolu projelerini sadece Admin'ler görür/yazar
-- ============================================================================
-- Kullanıcı isteği 2026-05-22: source='LALE' olan projeler hassas portföy.
-- Sadece role='Admin' kullanıcılara görünür/değiştirilebilir olmalı; diğer
-- rollere veri DB katmanında hiç gönderilmesin (anon anahtar + curl bypass
-- edilemez).
--
-- Yaklaşım: mevcut policy'lere LALE kuralı OVERLAY olarak eklenir. Eski
-- iş kuralları (viewOnlyOwn, editOnlyOwn, has_perm) korunur; LALE filtresi
-- bunların ÜZERİNE ekstra "AND" şartı.
--
-- Cascade: aksiyonlar/proje_participants/proje_tags RLS policy'leri zaten
-- projeler.id üzerinden EXISTS sorgusu yapar (subquery'ye projeler SELECT
-- policy'si uygulanır) → LALE proje gizlendikçe çocuk kayıtlar da kullanıcıya
-- görünmez. Dashboard KPI / Kokpit / Raporlar / Gantt / Workspace hepsi
-- useDataStore.projeler'i okuduğu için otomatik LALE'siz veri üzerinden
-- çalışır — UI kodunda hiçbir değişiklik gerekmez.
-- ============================================================================

-- SELECT: viewOnlyOwn kuralı korunur + LALE non-admin'e gizlenir
DROP POLICY IF EXISTS "projeler_select" ON public.projeler;
CREATE POLICY "projeler_select" ON public.projeler FOR SELECT
  USING (
    (app.current_role() IS NOT NULL)
    AND ((NOT app.flag('viewOnlyOwn'::text)) OR app.is_owner(owner) OR app.is_participant(id))
    AND (source <> 'LALE' OR app.current_role() = 'Admin')
  );

-- UPDATE: editOnlyOwn + has_perm korunur + LALE non-admin'e kapalı
DROP POLICY IF EXISTS "projeler_update" ON public.projeler;
CREATE POLICY "projeler_update" ON public.projeler FOR UPDATE
  USING (
    (app.has_perm('proje.edit'::text) AND ((NOT app.flag('editOnlyOwn'::text)) OR app.is_member(id)))
    AND (source <> 'LALE' OR app.current_role() = 'Admin')
  )
  WITH CHECK (true);

-- DELETE: has_perm korunur + LALE non-admin'e kapalı
DROP POLICY IF EXISTS "projeler_delete" ON public.projeler;
CREATE POLICY "projeler_delete" ON public.projeler FOR DELETE
  USING (
    app.has_perm('proje.delete'::text)
    AND (source <> 'LALE' OR app.current_role() = 'Admin')
  );

-- INSERT: has_perm korunur + LALE yeni proje sadece Admin tarafından
DROP POLICY IF EXISTS "projeler_insert" ON public.projeler;
CREATE POLICY "projeler_insert" ON public.projeler FOR INSERT
  WITH CHECK (
    app.has_perm('proje.create'::text)
    AND (source <> 'LALE' OR app.current_role() = 'Admin')
  );

NOTIFY pgrst, 'reload schema';
