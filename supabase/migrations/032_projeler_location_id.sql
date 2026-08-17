-- ============================================================================
-- 032_projeler_location_id.sql
--
-- projeler tablosuna OPSİYONEL lokasyon referansı. Lokasyon tanımları
-- migration 031'deki public.locations tablosunda (ülke + şehir aynı satırda),
-- Ayarlar > Lokasyon sekmesinden yönetiliyor.
--
-- ZORUNLU DEĞİL: kolon NULL kabul ediyor, DEFAULT yok. Mevcut 208 projenin
-- hiçbiri etkilenmiyor, proje formunda alan boş bırakılabiliyor.
--
-- ON DELETE SET NULL: Ayarlar'dan bir lokasyon silinirse ona bağlı projeler
-- silinmez — sadece lokasyon referansı boşalır. (CASCADE olsa lokasyon silmek
-- projeleri uçururdu; RESTRICT olsa admin lokasyonu hiç silemezdi.)
--
-- İdempotent: ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS.
-- ============================================================================

ALTER TABLE public.projeler
  ADD COLUMN IF NOT EXISTS location_id UUID;

-- FK'yı ayrı adımda kuruyoruz — ADD COLUMN IF NOT EXISTS ile REFERENCES
-- birleştirilirse kolon zaten varken constraint eklenmiyor.
ALTER TABLE public.projeler
  DROP CONSTRAINT IF EXISTS projeler_location_id_fkey;
ALTER TABLE public.projeler
  ADD CONSTRAINT projeler_location_id_fkey
  FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

-- Lokasyona göre proje filtreleme / gruplama için (harita ve raporlar)
CREATE INDEX IF NOT EXISTS projeler_location_id_idx
  ON public.projeler (location_id)
  WHERE location_id IS NOT NULL;

COMMENT ON COLUMN public.projeler.location_id IS
  'Opsiyonel lokasyon referansı → public.locations(id). NULL = lokasyon girilmemiş.';

-- ============================================================================
-- RLS notu: projeler üzerindeki mevcut policy''ler (006 / 018 / 029) kolon
-- bazlı değil, satır bazlı çalışıyor — yeni kolon otomatik olarak aynı
-- policy''lere tabi. locations SELECT''i herkese açık (031), dolayısıyla her
-- rol proje formundaki lokasyon dropdown''ını doldurabiliyor.
--
-- Rollback (gerekirse):
--   ALTER TABLE public.projeler DROP COLUMN IF EXISTS location_id;
-- ============================================================================
