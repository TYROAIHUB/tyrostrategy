-- ============================================================================
-- Migration 010: 'Behind' enum değerini 'High Risk'e migrate et
-- ============================================================================
-- Best practice string-enum rename:
--   1. CHECK'i genişlet → hem 'Behind' hem 'High Risk' kabul etsin
--   2. Mevcut satırları güncelle (Behind → High Risk)
--   3. CHECK'i sıkıştır → sadece 'High Risk' kabul etsin
-- Hepsi tek transaction — arada bir satır yarım kalamaz.
-- ============================================================================

-- 1. Genişlet (legacy + new aynı anda geçerli)
ALTER TABLE public.projeler DROP CONSTRAINT projeler_status_check;
ALTER TABLE public.projeler ADD CONSTRAINT projeler_status_check
  CHECK (status IN ('On Track', 'Achieved', 'Behind', 'High Risk', 'At Risk', 'Not Started', 'Cancelled', 'On Hold'));

ALTER TABLE public.aksiyonlar DROP CONSTRAINT aksiyonlar_status_check;
ALTER TABLE public.aksiyonlar ADD CONSTRAINT aksiyonlar_status_check
  CHECK (status IN ('On Track', 'Achieved', 'Behind', 'High Risk', 'At Risk', 'Not Started', 'Cancelled', 'On Hold'));

-- 2. Veriyi migrate et
UPDATE public.projeler   SET status = 'High Risk' WHERE status = 'Behind';
UPDATE public.aksiyonlar SET status = 'High Risk' WHERE status = 'Behind';

-- 3. Sıkıştır (artık Behind kabul edilmiyor)
ALTER TABLE public.projeler DROP CONSTRAINT projeler_status_check;
ALTER TABLE public.projeler ADD CONSTRAINT projeler_status_check
  CHECK (status IN ('On Track', 'Achieved', 'High Risk', 'At Risk', 'Not Started', 'Cancelled', 'On Hold'));

ALTER TABLE public.aksiyonlar DROP CONSTRAINT aksiyonlar_status_check;
ALTER TABLE public.aksiyonlar ADD CONSTRAINT aksiyonlar_status_check
  CHECK (status IN ('On Track', 'Achieved', 'High Risk', 'At Risk', 'Not Started', 'Cancelled', 'On Hold'));
