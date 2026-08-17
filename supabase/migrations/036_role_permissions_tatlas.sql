-- ============================================================================
-- 036_role_permissions_tatlas.sql
--
-- T-Atlas sayfası için yetki anahtarı: role_permissions.permissions altındaki
-- `pages` nesnesine `tAtlas` eklenir. Böylece Güvenlik sayfasından rol bazında
-- açılıp kapatılabiliyor (Raporlar sayfası gibi).
--
-- Varsayılan: Admin ve Management açık, Proje Lideri kapalı — dokümanın
-- "Admin ve yönetim rolündeki kullanıcılar" şartıyla aynı.
--
-- NOT: frontend `mergePerms` sayfaları varsayılanlar üzerine derin
-- birleştirdiği için anahtar DB'de olmasa da uygulama doğru çalışıyordu.
-- Bu migration Güvenlik ekranının gerçek kayıtlı durumu göstermesi ve
-- ileride sunucu tarafı bir kontrol eklenirse app.has_perm('pages.tAtlas')
-- çalışması için anahtarı kalıcı hale getiriyor.
--
-- İdempotent VE tahribatsız: yalnızca anahtar HİÇ YOKSA yazıyor. Yeniden
-- çalıştırmak, admin'in Güvenlik ekranından yaptığı değişikliği geri almaz.
-- ============================================================================

UPDATE public.role_permissions
SET permissions = jsonb_set(permissions, '{pages,tAtlas}', 'true'::jsonb, true)
WHERE role IN ('Admin', 'Management')
  AND permissions #> '{pages,tAtlas}' IS NULL;

UPDATE public.role_permissions
SET permissions = jsonb_set(permissions, '{pages,tAtlas}', 'false'::jsonb, true)
WHERE role = 'Proje Lideri'
  AND permissions #> '{pages,tAtlas}' IS NULL;

-- ============================================================================
-- Doğrulama:
--   SELECT role, permissions #>> '{pages,tAtlas}' FROM role_permissions ORDER BY role;
--
-- Rollback (gerekirse):
--   UPDATE public.role_permissions
--   SET permissions = permissions #- '{pages,tAtlas}';
-- ============================================================================
