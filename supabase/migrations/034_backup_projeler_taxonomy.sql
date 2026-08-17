-- ============================================================================
-- 034_backup_projeler_taxonomy.sql
--
-- Excel'den asset_class / action_type yüklemesi (035) ÖNCESİ tam yedek.
-- 2026-08-17'de uygulandı; 208 projenin tamamının yatırım alanları saklandı.
--
-- Neden yedek: 035 bir VERİ yüklemesi, şema değişikliği değil. Yanlış eşleşme
-- ya da Excel'de hata çıkması durumunda tek UPDATE ile eski hale dönülebilsin.
--
-- ROLLBACK:
--   UPDATE public.projeler p
--   SET asset_class = b.asset_class,
--       action_type = b.action_type,
--       capex_usd   = b.capex_usd,
--       location_id = b.location_id
--   FROM public.projeler_taxonomy_backup_20260817 b
--   WHERE p.id = b.id;
--
-- İdempotent: DROP ... IF EXISTS + CREATE TABLE AS.
-- DİKKAT: yeniden çalıştırmak yedeği O ANDAKİ veriyle tazeler — orijinal
-- 2026-08-17 anlık görüntüsünü kaybetmek istemiyorsan tekrar koşturma.
-- ============================================================================

DROP TABLE IF EXISTS public.projeler_taxonomy_backup_20260817;

CREATE TABLE public.projeler_taxonomy_backup_20260817 AS
SELECT id, asset_class, action_type, capex_usd, location_id, now() AS backed_up_at
FROM public.projeler;

ALTER TABLE public.projeler_taxonomy_backup_20260817
  ADD PRIMARY KEY (id);

COMMENT ON TABLE public.projeler_taxonomy_backup_20260817 IS
  'Excel taksonomi yüklemesi öncesi (2026-08-17) projeler snapshot. Rollback:
   UPDATE projeler p SET asset_class=b.asset_class, action_type=b.action_type
   FROM projeler_taxonomy_backup_20260817 b WHERE p.id=b.id;';
