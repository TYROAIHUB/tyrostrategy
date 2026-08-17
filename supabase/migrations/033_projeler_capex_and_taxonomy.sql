-- ============================================================================
-- 033_projeler_capex_and_taxonomy.sql
--
-- projeler tablosuna üç yeni OPSİYONEL alan:
--   • capex_usd   — yatırım tutarı (USD)
--   • asset_class — varlık sınıfı  (sabit seçim, AST-*)
--   • action_type — yatırım tipi   (sabit seçim, ACT-*)
--
-- Üçü de NULL kabul ediyor, DEFAULT yok — lokasyon (032) ile aynı desen.
-- Mevcut 208 proje etkilenmiyor, formlarda alanlar boş bırakılabiliyor.
-- (Kavramsal tasarım dokümanı CAPEX'i "zorunlu" işaretliyor ama mevcut
--  satırlara NOT NULL eklenemez; zorunluluk gerekirse uygulama katmanında
--  yatırım projeleri için ayrıca uygulanır.)
--
-- Taksonomi değerleri InvestmentMap kavramsal tasarım dokümanındaki
-- "Kategorizasyon sözlüğü" bölümünden birebir alındı. CHECK constraint'i
-- serbest metin girişini DB seviyesinde engelliyor — migration 027'deki
-- ID format guard'ı ile aynı defense-in-depth mantığı: dropdown bypass
-- edilse bile bozuk kod tabloya giremez.
--
-- İdempotent: ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS.
-- ============================================================================

ALTER TABLE public.projeler
  ADD COLUMN IF NOT EXISTS capex_usd   NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS asset_class TEXT,
  ADD COLUMN IF NOT EXISTS action_type TEXT;

-- ── CAPEX ──
-- Negatif yatırım tutarı anlamsız. NULL serbest (alan opsiyonel).
ALTER TABLE public.projeler DROP CONSTRAINT IF EXISTS projeler_capex_usd_non_negative;
ALTER TABLE public.projeler
  ADD CONSTRAINT projeler_capex_usd_non_negative
  CHECK (capex_usd IS NULL OR capex_usd >= 0);

-- ── Asset Class (varlık sınıfı) ──
ALTER TABLE public.projeler DROP CONSTRAINT IF EXISTS projeler_asset_class_valid;
ALTER TABLE public.projeler
  ADD CONSTRAINT projeler_asset_class_valid
  CHECK (asset_class IS NULL OR asset_class IN (
    'AST-PROC',   -- Üretim ve İşleme Tesisleri
    'AST-PORT',   -- Liman ve Deniz Altyapısı
    'AST-STOR',   -- Depolama ve Lojistik Tesisleri
    'AST-ADMIN',  -- İdari ve Sosyal Yapılar
    'AST-UTIL',   -- Yardımcı Tesisler, HSE ve Teknik Sistemler
    'AST-CIVIL'   -- Saha ve İnşaat Altyapısı
  ));

-- ── Project Action Type (yatırım tipi) ──
ALTER TABLE public.projeler DROP CONSTRAINT IF EXISTS projeler_action_type_valid;
ALTER TABLE public.projeler
  ADD CONSTRAINT projeler_action_type_valid
  CHECK (action_type IS NULL OR action_type IN (
    'ACT-NEW',    -- Yeni Yapım / Yeni Kurulum
    'ACT-EXP',    -- Genişleme / Kapasite Artışı
    'ACT-UPG',    -- Modernizasyon / Entegrasyon
    'ACT-SUS',    -- İdame / Yenileme / Büyük Bakım
    'ACT-REL'     -- Taşıma / Yeniden Konumlandırma
  ));

-- ── Indexler ──
-- Portföy kırılımları (asset class / action type bazlı sayım ve CAPEX
-- toplamı) bu iki kolon üzerinden gruplanacak.
CREATE INDEX IF NOT EXISTS projeler_asset_class_idx
  ON public.projeler (asset_class) WHERE asset_class IS NOT NULL;
CREATE INDEX IF NOT EXISTS projeler_action_type_idx
  ON public.projeler (action_type) WHERE action_type IS NOT NULL;

COMMENT ON COLUMN public.projeler.capex_usd IS
  'Opsiyonel yatırım tutarı, USD. NULL = girilmemiş.';
COMMENT ON COLUMN public.projeler.asset_class IS
  'Opsiyonel varlık sınıfı (AST-*). CHECK ile sabit listeye kilitli.';
COMMENT ON COLUMN public.projeler.action_type IS
  'Opsiyonel yatırım tipi (ACT-*). CHECK ile sabit listeye kilitli.';

-- ============================================================================
-- Rollback (gerekirse):
--   ALTER TABLE public.projeler
--     DROP COLUMN IF EXISTS capex_usd,
--     DROP COLUMN IF EXISTS asset_class,
--     DROP COLUMN IF EXISTS action_type;
-- ============================================================================
