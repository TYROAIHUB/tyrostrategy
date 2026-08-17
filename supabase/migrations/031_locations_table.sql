-- ============================================================================
-- 031_locations_table.sql
--
-- Lokasyon tanım tablosu — ülke + şehir AYNI SATIRDA. Ayarlar > Lokasyon
-- sekmesinden yönetilir (yeni / düzenle / sil). Proje formunda opsiyonel
-- olarak seçilecek — projede lokasyon ZORUNLU DEĞİL, o yüzden bu migration
-- projeler tablosuna hiçbir NOT NULL kolon eklemez.
--
-- Tablo adı `locations`: istek "LocationTable" idi ama Postgres quote'suz
-- identifier'ları küçük harfe indirir (`locationtable`) ve repo konvansiyonu
-- snake_case çoğul (projeler, aksiyonlar, tag_definitions, app_settings).
-- PascalCase kullanmak her sorguda "LocationTable" şeklinde quote zorunluluğu
-- getirirdi.
--
-- İdempotent: CREATE ... IF NOT EXISTS + DROP ... IF EXISTS.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country    TEXT NOT NULL,
  city       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Bütünlük kısıtları ──
-- Boş / yalnızca whitespace kayıt engeli. 23514 üretir → dataStore'daki
-- syncToSupabase permanent-error fast-path'ine düşer, kullanıcı retry
-- beklemeden anında toast görür.
ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_country_not_blank;
ALTER TABLE public.locations
  ADD CONSTRAINT locations_country_not_blank CHECK (btrim(country) <> '');

ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_city_not_blank;
ALTER TABLE public.locations
  ADD CONSTRAINT locations_city_not_blank CHECK (btrim(city) <> '');

-- Aynı ülke + şehir çifti iki kez tanımlanamaz (case-insensitive, trim'li).
-- Uygulama tarafı da ekleme öncesi kontrol ediyor; bu index son savunma —
-- iki admin aynı anda "Türkiye / Ankara" girerse biri 23505 alır.
CREATE UNIQUE INDEX IF NOT EXISTS locations_country_city_unique
  ON public.locations (lower(btrim(country)), lower(btrim(city)));

-- Ülkeye göre gruplanmış listeleme için
CREATE INDEX IF NOT EXISTS locations_country_idx
  ON public.locations (lower(btrim(country)));

-- ── updated_at otomatiği ──
-- 001_initial_schema.sql'deki mevcut public.update_updated_at() fonksiyonunu
-- yeniden kullanıyor (projeler / aksiyonlar / users / report_templates ile aynı).
DROP TRIGGER IF EXISTS trg_locations_updated_at ON public.locations;
CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── RLS ──
-- SELECT herkese açık: lokasyon dropdown'ı proje formunda her rol için
-- dolmalı (Admin, Proje Lideri, Management).
-- Mutasyonlar Admin-only: Ayarlar sayfası zaten yalnızca Admin'e açık
-- (role_permissions.pages.ayarlar → Admin true, diğer iki rol false),
-- tag_definitions ile birebir aynı desen.
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_select" ON public.locations;
DROP POLICY IF EXISTS "locations_insert" ON public.locations;
DROP POLICY IF EXISTS "locations_update" ON public.locations;
DROP POLICY IF EXISTS "locations_delete" ON public.locations;

CREATE POLICY "locations_select" ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "locations_insert" ON public.locations FOR INSERT
  WITH CHECK (app.current_role() = 'Admin');

CREATE POLICY "locations_update" ON public.locations FOR UPDATE
  USING (app.current_role() = 'Admin');

CREATE POLICY "locations_delete" ON public.locations FOR DELETE
  USING (app.current_role() = 'Admin');

-- PostgREST erişimi — RLS yine kapıda, bu sadece tablo düzeyi grant
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO anon, authenticated;

-- ============================================================================
-- Rollback (gerekirse):
--   DROP TABLE IF EXISTS public.locations CASCADE;
-- ============================================================================
