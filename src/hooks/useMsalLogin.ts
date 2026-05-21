import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "@/lib/auth/msalConfig";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore, fetchAllFromSupabase } from "@/stores/dataStore";
import { setSupabaseUserContext } from "@/lib/supabase";
import { supabaseAdapter } from "@/lib/data/supabaseAdapter";
import { isSupabaseMode } from "@/lib/supabaseMode";

/** Detect mobile / tablet browsers where popups are unreliable */
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}

/** Wait for users to appear in the store (Supabase may still be loading) */
function waitForUsers(maxMs = 5000): Promise<typeof useDataStore.getState extends () => infer R ? R["users"] : never> {
  return new Promise((resolve) => {
    const current = useDataStore.getState().users;
    if (current.length > 0) return resolve(current);
    const unsub = useDataStore.subscribe((s) => {
      if (s.users.length > 0) { unsub(); resolve(s.users); }
    });
    setTimeout(() => { unsub(); resolve(useDataStore.getState().users); }, maxMs);
  });
}

export function resolveUser(email: string, users: { email: string; displayName: string; role: string; locale?: string }[]) {
  return users.find((u) => u.email.toLowerCase() === email);
}

export function applyUser(user: { email?: string; displayName: string; role: string; locale?: string }) {
  const ui = useUIStore.getState();
  // Guard every setter with a "did it actually change?" check.
  // Without this, AuthGuard's users-array effect could loop: users
  // change → applyUser → setLocale → syncUserLocale → dataStore.updateUser
  // → users array new reference → AuthGuard re-fires → applyUser → …
  // The equality-check turns each setter into a no-op when the values
  // are already correct, breaking the cycle.
  if (ui.mockUserName !== user.displayName) ui.setMockUserName(user.displayName);
  if (ui.mockUserRole !== user.role) ui.setMockUserRole(user.role);
  if (user.locale && ui.locale !== user.locale) ui.setLocale(user.locale as "tr" | "en");
  if (!ui.mockLoggedIn) ui.setMockLoggedIn(true);
  if (user.email) {
    // Tell Supabase who we are — the fetch wrapper will attach an
    // X-User-Email header on every subsequent request. RLS policies
    // (migration 006 + 008) resolve role from this header.
    setSupabaseUserContext(user.email);
    // Persist email — module-level boot code (dataStore.ts) F5'te bu
    // key'i okuyup context'i hemen set ediyor, user array'i beklemeden.
    // Migration 018 RLS policy'leri current_email NULL ise hiç satır
    // döndürmediği için bu şart.
    localStorage.setItem("tyro-mock-email", user.email);
  }
}

export function useMsalLogin() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. If MSAL already has a cached account, try silent token acquisition first.
      const cachedAccounts = instance.getAllAccounts();
      let email: string | null = null;

      if (cachedAccounts.length > 0) {
        try {
          const silent = await instance.acquireTokenSilent({
            ...loginRequest,
            account: cachedAccounts[0],
          });
          email = (silent.account.username || "").toLowerCase().trim();
        } catch (silentErr) {
          if (!(silentErr instanceof InteractionRequiredAuthError)) {
            console.warn("[MSAL] Silent acquisition failed, falling back to interactive", silentErr);
          }
        }
      }

      // 2. If silent didn't work, use redirect on mobile, popup on desktop
      if (!email) {
        if (isMobile()) {
          // Redirect flow — page will reload after auth, AuthGuard handles the rest
          await instance.loginRedirect(loginRequest);
          return; // page navigates away
        }
        const result = await instance.loginPopup(loginRequest);
        email = (result.account.username || "").toLowerCase().trim();
      }

      // 3. X-User-Email header'ını ÖNCE set et — migration 018 RLS policy'leri
      // current_email NULL ise 0 satır döndürüyor. Aşağıdaki fetchAllFromSupabase
      // resolveUser için users array'ini doldurmak zorunda; header olmadan 0
      // dönerdi ve "Bu hesap sisteme tanımlanmamış" hatasına düşerdik.
      // applyUser ilerleyen satırlarda bunu tekrar çağırıyor — idempotent.
      setSupabaseUserContext(email);

      // 4. Users verisi yükle — dataStore module-level fetch /login'de
      // atlandığı için store boş olabilir. Eğer zaten doluysa (F5 + tekrar
      // login gibi edge case) waitForUsers anında resolve eder, extra fetch
      // olmaz. Boşsa fetchAllFromSupabase'i çağırıp hepsini tek seferde
      // tazeliyoruz — bu hem users'ı (resolveUser için şart) hem de login
      // sonrası home ekranında lazım olan projeler/aksiyonlar/tag'leri yükler.
      if (useDataStore.getState().users.length === 0) {
        await fetchAllFromSupabase();
      }
      const users = await waitForUsers(); // Safety net — ya store'dan ya fetch'ten dolu döner
      const user = resolveUser(email, users);

      if (!user) {
        setError(`Bu hesap sisteme tanımlanmamış: ${email}`);
        // Context'i temizle — gelecek isteklerde yanlış email kullanılmasın
        setSupabaseUserContext(null);
        // Clear MSAL session — use redirect on mobile
        if (isMobile()) {
          await instance.logoutRedirect({ onRedirectNavigate: () => false }).catch(() => {});
        } else {
          await instance.logoutPopup({ onRedirectNavigate: () => false }).catch(() => {});
        }
        setLoading(false);
        return;
      }

      applyUser(user);
      // Audit: kullanıcının last_login_at'ini server NOW() ile güncelle
      // (migration 028 RPC). Fire-and-forget — adapter hata olursa konsola
      // warn yazar, login akışını ASLA bloklamaz. Mock modunda no-op.
      if (isSupabaseMode) {
        void supabaseAdapter.touchLastLogin();
      }
      // Land on "/" — HomeRedirect picks the first Sidebar-ordered page
      // the role can open (Yönetim rolü sadece Görünümler'e yetkili ise
      // /dashboard'a düşer gibi). See src/lib/navOrder.ts.
      navigate("/");
    } catch (err: unknown) {
      const msalErr = err as { errorCode?: string; name?: string; message?: string };
      // Ignore user-cancelled interactions
      if (
        msalErr?.errorCode === "user_cancelled" ||
        msalErr?.errorCode === "popup_window_error"
      ) {
        // User closed the popup — no error to show
      } else if (msalErr?.errorCode === "interaction_in_progress") {
        console.warn("[MSAL] Interaction in progress, retrying silently...");
        setError("Giriş işlemi devam ediyor, lütfen bekleyin…");
        setTimeout(() => setError(null), 2000);
      } else {
        setError("Microsoft girişi başarısız. Lütfen tekrar deneyin.");
        console.error("[MSAL] login error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
