-- ============================================================================
-- Migration 030: Proje statülerini yeni aksiyon-escalation kuralına hizala
-- ============================================================================
-- Kullanıcı isteği 2026-05-22: Proje statüsü artık AKSIYON statülerinden
-- escalation ile gelir (eski tarih bazlı suggestStatusFromProgress yerine).
-- Kurallar:
--   1. Lifecycle (On Hold / Cancelled) → DOKUNULMAZ (manuel kararlar)
--   2. En az 1 aksiyon "High Risk" → proje "High Risk"
--   3. Aksi halde en az 1 aksiyon "At Risk" → proje "At Risk"
--   4. Aksi halde TÜM aksiyonlar "Achieved" → proje "Achieved"
--   5. Aksi halde → proje "On Track"
--   6. Aksiyonsuz proje → mevcut statü korunur
--
-- Mevcut DB verisi (kod değişimi öncesi) bu kurala tam uymuyordu:
--   - 25 proje "OnTrack/AtRisk" iken aksiyonlarında HighRisk var → HighRisk'e çekilir
--   -  8 proje "OnTrack" iken aksiyonlarında AtRisk var → AtRisk'e çekilir
--   -  4 proje HighRisk olduğu halde aksiyonları temiz → OnTrack'e iner
--   -  3 proje HighRisk → AtRisk
--   -  3 proje AtRisk → OnTrack
--   -  4 proje NotStarted (aksiyonlu) → OnTrack
-- Toplam 47 proje statüsü güncellenecek; dry-run sayımı eşleşmeli.
--
-- Audit: updated_at = NOW(), updated_by = 'SYSTEM_MIGRATION_030' (görsel
-- olarak "kim güncelledi" alanında migration izi kalsın).
--
-- Tek seferlik data alignment — idempotent (yeniden çalışırsa zaten doğru
-- olan satırlar değişmez, sadece kalan tutarsızlıkları düzeltir).
-- ============================================================================

WITH proje_target AS (
  SELECT
    p.id,
    p.status AS old_status,
    p.completed_at AS old_completed_at,
    CASE
      WHEN p.status IN ('On Hold', 'Cancelled') THEN p.status
      WHEN EXISTS (SELECT 1 FROM public.aksiyonlar a WHERE a.proje_id = p.id) THEN
        CASE
          WHEN EXISTS (SELECT 1 FROM public.aksiyonlar a WHERE a.proje_id = p.id AND a.status = 'High Risk') THEN 'High Risk'
          WHEN EXISTS (SELECT 1 FROM public.aksiyonlar a WHERE a.proje_id = p.id AND a.status = 'At Risk') THEN 'At Risk'
          WHEN NOT EXISTS (SELECT 1 FROM public.aksiyonlar a WHERE a.proje_id = p.id AND a.status <> 'Achieved') THEN 'Achieved'
          ELSE 'On Track'
        END
      ELSE p.status
    END AS new_status
  FROM public.projeler p
)
UPDATE public.projeler p
SET
  status = t.new_status,
  -- completedAt sync: Achieved'a geçişte NOW(), Achieved'tan çıkışta NULL
  completed_at = CASE
    WHEN t.new_status = 'Achieved' AND t.old_status <> 'Achieved' THEN NOW()
    WHEN t.new_status <> 'Achieved' AND t.old_status = 'Achieved' THEN NULL
    ELSE p.completed_at
  END,
  updated_at = NOW(),
  updated_by = 'SYSTEM_MIGRATION_030'
FROM proje_target t
WHERE p.id = t.id
  AND t.old_status IS DISTINCT FROM t.new_status;
