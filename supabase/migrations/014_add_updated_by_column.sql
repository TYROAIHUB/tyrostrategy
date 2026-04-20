-- ============================================================================
-- Migration 014: updated_by sütunu (projeler + aksiyonlar)
-- ============================================================================
-- Frontend Proje ve Aksiyon tiplerinde updatedBy alanı var; DB'de yoktu,
-- bu yüzden "kim güncelledi" bilgisi hiçbir zaman DB'ye yazılamıyordu.
-- Şimdi kolonu ekliyoruz ve adapter bu alanı eşliyor.
--
-- updated_at zaten trigger ile otomatik. updated_by manuel — güncellemeyi
-- yapan kullanıcının adı frontend tarafında dataStore'da enrich edilip
-- adapter üzerinden yazılır.
-- ============================================================================

ALTER TABLE public.projeler   ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT '';
ALTER TABLE public.aksiyonlar ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT '';
