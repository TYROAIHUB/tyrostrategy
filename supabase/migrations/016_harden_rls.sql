-- ============================================================================
-- Migration 016: users tablosu WITH CHECK (yetki bazlı) + column-level koruma
-- ============================================================================
-- Amaç — bir kritik açık kapatılıyor:
--
--   "Yetkisiz self-update role escalation" açığı:
--   Migration 006'daki users_update policy'sinde WITH CHECK yoktu. O yüzden
--   herhangi bir çalışan DevTools'tan kendi users satırına `role='Admin'`
--   yazabiliyordu. Burada WITH CHECK ekliyoruz — self-update'te sadece
--   `locale` (dil) kolonu değişebilir, diğer her kolon mevcut değeriyle aynı
--   kalmak ZORUNDA.
--
--   Ayrıca INSERT/DELETE artık sabit 'Admin' rolüne değil `pages.kullanicilar`
--   yetkisine bağlı — Güvenlik sayfasındaki rol ayarları canlı çalışır.
--
-- NOT: İlk versiyonda projeler/aksiyonlar/vb. SELECT policy'leri de
-- `app.current_email() IS NOT NULL` ile sıkıştırılmıştı. Ama frontend module
-- startup'ta (MSAL login bitmeden) fetch yaptığı için UI boş açılıyordu. SELECT
-- sıkıştırması geri alındı (USING true). Frontend uyarlandığında (startup
-- fetch'i auth sonrasına taşı) SELECT'ler tekrar sıkılaştırılabilir — şimdilik
-- SELECT tarafında sıkılaştırma YAPMIYORUZ.
-- ============================================================================

-- ─── users tablosu: yetki bazlı CRUD + self-update-sadece-locale ───────────
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

-- INSERT: sadece Kullanıcılar sayfasına yetkisi olan kişi yeni kullanıcı oluşturabilir
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (app.has_perm('pages.kullanicilar'));

-- DELETE: sadece Kullanıcılar sayfasına yetkisi olan kişi silebilir
CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (app.has_perm('pages.kullanicilar'));

-- UPDATE:
--   ya pages.kullanicilar yetkin var → tüm kolonlar serbest,
--   ya da bu sensin (self) → SADECE locale değişebilir,
--                           diğer tüm kolonlar mevcut değeriyle aynı kalmak ZORUNDA.
-- IS NOT DISTINCT FROM, `NULL = NULL`'ı true kabul eder (regular = operatörü NULL'u false sayardı).
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (
    app.has_perm('pages.kullanicilar')
    OR lower(email) = lower(app.current_email())
  )
  WITH CHECK (
    app.has_perm('pages.kullanicilar')
    OR (
      lower(email) = lower(app.current_email())
      AND email        IS NOT DISTINCT FROM (SELECT u.email        FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND role         IS NOT DISTINCT FROM (SELECT u.role         FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND department   IS NOT DISTINCT FROM (SELECT u.department   FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND display_name IS NOT DISTINCT FROM (SELECT u.display_name FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND title        IS NOT DISTINCT FROM (SELECT u.title        FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
    )
  );

-- ============================================================================
-- Doğrulama — REST API ile (anon key + X-User-Email header):
--
-- 1) Self role escalation reddediliyor mu?
--      curl -X PATCH 'https://<proj>.supabase.co/rest/v1/users?email=eq.<self>' \
--           -H 'apikey: <ANON>' -H 'Authorization: Bearer <ANON>' \
--           -H 'X-User-Email: <self>' -H 'Content-Type: application/json' \
--           -d '{"role":"Admin"}'
--      → 401 + "new row violates row-level security policy" (beklenen)
--
-- 2) Locale self-update hâlâ çalışıyor mu?
--      Aynı curl, -d '{"locale":"en"}' → 200 OK (beklenen)
--
-- 3) Başka kullanıcıyı update etme denemesi?
--      Farklı email için PATCH → 200 + [] (USING filter match yok — güvenli no-op)
--
-- NOT: Bu testleri direct pg bağlantısı ile yapmayın — superuser modunda RLS
-- bypass olur, gerçek kullanıcı davranışını simüle etmez.
-- ============================================================================

-- ============================================================================
-- ROLLBACK (sorun olursa):
--
--   DROP POLICY IF EXISTS "users_insert" ON public.users;
--   DROP POLICY IF EXISTS "users_update" ON public.users;
--   DROP POLICY IF EXISTS "users_delete" ON public.users;
--   CREATE POLICY "users_insert" ON public.users FOR INSERT
--     WITH CHECK (app.current_role() = 'Admin');
--   CREATE POLICY "users_update" ON public.users FOR UPDATE
--     USING (app.current_role() = 'Admin' OR lower(email) = lower(app.current_email()));
--   CREATE POLICY "users_delete" ON public.users FOR DELETE
--     USING (app.current_role() = 'Admin');
-- ============================================================================
