-- ============================================================================
-- Migration 028: users.last_login_at + touch_last_login() RPC
-- ============================================================================
-- Kullanıcı isteği 2026-05-10: Kullanıcılar sayfasında her kullanıcının en
-- son ne zaman giriş yaptığını gösteren bir kolon ekle.
--
-- Yaklaşım: server-side audit. Client clock manipülasyonuna duyarsız, otorite
-- DB. MSAL login akışı başarılı tamamlandığında client public.touch_last_login()
-- RPC'sini çağırır. RPC SECURITY DEFINER olduğu için BEFORE UPDATE trigger
-- (app.guard_user_self_locale_only — self-update'leri sadece locale'a kısıtlar)
-- bypass edilir; trigger logic'i el sürmeden korunur.
--
-- Idempotent: kolon zaten varsa atla, RPC CREATE OR REPLACE.
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- public.touch_last_login() — caller'ın e-postasını (X-User-Email header) okur,
-- kendi satırının last_login_at'ini NOW()'a set eder. SECURITY DEFINER → trigger
-- bypass. search_path explicit → SECURITY DEFINER + mutable search_path uyarısı
-- çıkmaz (Supabase advisor).
CREATE OR REPLACE FUNCTION public.touch_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := lower(coalesce(app.current_email(), ''));
  IF v_email = '' THEN
    -- No identity (header missing) → silent no-op. Better than erroring on
    -- a benign best-effort write.
    RETURN;
  END IF;
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE lower(email) = v_email;
END;
$$;

-- PostgREST RPC olarak erişilebilir kılan grant. anon + authenticated, login
-- akışı supabase-js üzerinden çağırıyor. NULL email durumunda fonksiyon zaten
-- no-op olduğu için anon'a açık olması güvenli — kötü niyet de yapamaz.
GRANT EXECUTE ON FUNCTION public.touch_last_login() TO anon, authenticated, service_role;

-- PostgREST schema cache reload — yeni RPC'yi hemen tanısın.
NOTIFY pgrst, 'reload schema';
