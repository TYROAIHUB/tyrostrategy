-- ============================================================================
-- Migration 023: edit permissions = proje membership (leader OR participant)
-- ============================================================================
-- Eski davranış (kullanıcı raporu 2026-05-04):
--   editOnlyOwn=true rolünde (Proje Lideri/Kullanıcı) bir kullanıcı yalnızca
--   `aksiyon.owner == ben` veya `proje.owner == ben` olduğunda edit edebiliyordu.
--   "Proje lideri kendi projesindeki aksiyonu edit edemez" yan etkisi vardı —
--   çünkü aksiyon owner'ı bir başka kullanıcı (örn. takım üyesi) olabiliyordu.
--
-- Yeni davranış:
--   editOnlyOwn=true rolünde edit yetkisi PROJE ÜYELİĞİNE bağlı:
--     - Kullanıcı projenin owner'ı (lideri) ise → tüm proje + tüm aksiyonları edit
--     - Kullanıcı projenin participants'ı (üye) ise → tüm proje + tüm aksiyonları edit
--   aksiyon.owner field'ı edit kararında ARTIK KULLANILMIYOR.
--
-- Frontend (usePermissions.canEditProje / canEditAksiyon) aynı şekilde
-- güncellendi — UI ve RLS aynı kararı verir.
-- ============================================================================

-- 1) Helper: am I a member (owner OR participant) of given proje?
CREATE OR REPLACE FUNCTION app.is_member(p_proje_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projeler p
    WHERE p.id = p_proje_id AND app.is_owner(p.owner)
  ) OR app.is_participant(p_proje_id);
$$;

-- 2) projeler UPDATE: editOnlyOwn → is_member yerine is_owner
DROP POLICY IF EXISTS "projeler_update" ON public.projeler;
CREATE POLICY "projeler_update" ON public.projeler FOR UPDATE
  USING (
    app.has_perm('proje.edit')
    AND (NOT app.flag('editOnlyOwn') OR app.is_member(id))
  );

-- 3) aksiyonlar UPDATE: editOnlyOwn → parent proje'nin is_member kontrolü
DROP POLICY IF EXISTS "aksiyonlar_update" ON public.aksiyonlar;
CREATE POLICY "aksiyonlar_update" ON public.aksiyonlar FOR UPDATE
  USING (
    app.has_perm('aksiyon.edit')
    AND (NOT app.flag('editOnlyOwn') OR app.is_member(proje_id))
  );

-- ============================================================================
-- Doğrulama (PostgREST üzerinden, Proje Lideri Büşra için):
--
-- 1) Büşra owner'ı olmadığı bir aksiyonu kendi projesinde edit edebilir mi?
--    (Önceden 0 row, şimdi başarılı olmalı):
--    curl -X PATCH '/rest/v1/aksiyonlar?id=eq.<id>' \
--         -H 'X-User-Email: busra.kaplan@tiryaki.com.tr' \
--         -d '{"progress": 50}'
--    → 200 OK, satır güncellenir
--
-- 2) Büşra hiç parçası olmadığı bir aksiyonu hâlâ edit EDEMEZ:
--    Aynı PATCH başka projedeki bir aksiyona → 0 row döner (USING reddediyor)
--
-- 3) Admin (viewOnlyOwn=false) hâlâ her şeyi edit eder (kuraldan etkilenmez).
-- ============================================================================
