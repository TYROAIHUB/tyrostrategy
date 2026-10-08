-- 037_report_templates_owner_only_writes.sql
--
-- Rapor şablonlarında GÖRÜNÜRLÜK ile YAZMA yetkisini ayırır.
--
-- Arka plan: 006_rls_role_based.sql, Admin rolüne report_templates üzerinde
-- sınırsız UPDATE/DELETE veriyordu:
--
--     USING (app.current_role() = 'Admin' OR lower(owner_email) = lower(app.current_email()))
--
-- Gelişmiş filtre şablonları tüm adminlere görünür hâle gelince (449ff9a)
-- bu kural fiilî bir veri kaybı riskine dönüştü: bir admin, listede gördüğü
-- BAŞKA bir adminin şablonunu silebiliyor ya da üzerine yazabiliyordu.
--
-- Kullanıcı kuralı (2026-10-08): "diğer adminin oluşturduğu şablonu
-- görebilmeliyim ama silmemeliyim."
--
-- Bu migration SELECT'i olduğu gibi bırakır (herkes görmeye devam eder) ve
-- yalnızca UPDATE + DELETE'i sahibine kilitler. Admin bypass'ı kaldırılır.
--
-- Not: Şablon, kullanıcının kendi filtre tercihidir — kurumsal bir kayıt
-- değil. Sahibi işten ayrılırsa satır yetim kalır; temizlik gerekirse
-- service_role ile (RLS dışı) yapılır, uygulama üzerinden değil.

-- UPDATE: yalnızca sahibi
DROP POLICY IF EXISTS "templates_update" ON public.report_templates;
CREATE POLICY "templates_update" ON public.report_templates FOR UPDATE
  USING (lower(owner_email) = lower(app.current_email()))
  -- owner_email bir başkasına devredilemesin (yazdıktan sonra sahiplik kaçışı)
  WITH CHECK (lower(owner_email) = lower(app.current_email()));

-- DELETE: yalnızca sahibi
DROP POLICY IF EXISTS "templates_delete" ON public.report_templates;
CREATE POLICY "templates_delete" ON public.report_templates FOR DELETE
  USING (lower(owner_email) = lower(app.current_email()));
