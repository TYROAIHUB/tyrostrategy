-- ============================================================================
-- 035_load_excel_taxonomy.sql
--
-- "Yatırım Projeleri Listesi.xlsx" dosyasındaki 26 projenin asset_class ve
-- action_type değerleri. 2026-08-17'de uygulandı.
--
-- Kaynak: Excel B/D/E kolonları (Project Code / Asset Class / Project Action
-- Type). Değerler elle yazılmadı — Excel programatik ayrıştırılıp doğrulandı
-- (26 satır, tüm kodlar migration 033'teki CHECK listesinde, çift kayıt yok),
-- SQL o doğrulanmış veriden üretildi.
--
-- Yalnızca bu 26 proje ve yalnızca bu 2 kolon etkilenir. Uygulandığı anda
-- 208 projenin hiçbirinde bu alanlar dolu değildi — üzerine yazılan değer yok.
--
-- Yedek: migration 034 (projeler_taxonomy_backup_20260817).
--
-- DİKKAT: idempotent ama yeniden çalıştırmak, bu 26 proje için sonradan
-- kokpitten yapılmış değişiklikleri Excel değerlerine geri döndürür.
-- ============================================================================

WITH src(id, asset_class, action_type) AS (VALUES
  ('P26-0245', 'AST-UTIL', 'ACT-UPG'),
  ('P26-0103', 'AST-UTIL', 'ACT-UPG'),
  ('P26-0102', 'AST-ADMIN', 'ACT-SUS'),
  ('P25-0003', 'AST-PROC', 'ACT-NEW'),
  ('P26-0119', 'AST-STOR', 'ACT-NEW'),
  ('P25-0002', 'AST-PROC', 'ACT-UPG'),
  ('P26-0222', 'AST-PORT', 'ACT-SUS'),
  ('P26-0246', 'AST-ADMIN', 'ACT-REL'),
  ('P26-0071', 'AST-PROC', 'ACT-NEW'),
  ('P26-0070', 'AST-PROC', 'ACT-NEW'),
  ('P26-0244', 'AST-PORT', 'ACT-EXP'),
  ('P26-0069', 'AST-PROC', 'ACT-NEW'),
  ('P26-0085', 'AST-PROC', 'ACT-NEW'),
  ('P26-0078', 'AST-ADMIN', 'ACT-NEW'),
  ('P26-0112', 'AST-STOR', 'ACT-SUS'),
  ('P26-0114', 'AST-PORT', 'ACT-SUS'),
  ('P26-0113', 'AST-ADMIN', 'ACT-UPG'),
  ('P26-0106', 'AST-STOR', 'ACT-SUS'),
  ('P26-0109', 'AST-UTIL', 'ACT-UPG'),
  ('P26-0107', 'AST-PORT', 'ACT-SUS'),
  ('P26-0247', 'AST-PROC', 'ACT-EXP'),
  ('P26-0123', 'AST-PROC', 'ACT-NEW'),
  ('P25-0004', 'AST-PROC', 'ACT-NEW'),
  ('P24-0001', 'AST-ADMIN', 'ACT-NEW'),
  ('P26-0115', 'AST-ADMIN', 'ACT-NEW'),
  ('P26-0100', 'AST-PROC', 'ACT-NEW')
)
UPDATE public.projeler p
SET asset_class = s.asset_class,
    action_type = s.action_type
FROM src s
WHERE p.id = s.id
;
