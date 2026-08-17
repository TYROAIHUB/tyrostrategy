import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, type ReactNode } from "react";
import { AuthGuard } from "@/lib/auth/AuthGuard";
import { usePermissions } from "@/hooks/usePermissions";
import type { RolePermissions } from "@/types";
import { getFirstAccessiblePath } from "@/lib/navOrder";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import OfflineBanner from "@/components/shared/OfflineBanner";

// Lazy load pages
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const WorkspacePage = lazy(() => import("@/pages/WorkspacePage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProjelerPage = lazy(() => import("@/pages/ProjelerPage"));
const AksiyonlarPage = lazy(() => import("@/pages/AksiyonlarPage"));
const KokpitPage = lazy(() => import("@/pages/KokpitPage"));
const GanttPage = lazy(() => import("@/pages/GanttPage"));
// TreePage (WBS) removed
const StrategyMapPage = lazy(() => import("@/pages/StrategyMapPage"));
const TAlignmentPage = lazy(() => import("@/pages/TAlignmentPage"));
// T-Atlas maplibre-gl taşıyor (~850 KB) — lazy kalması şart, sayfaya
// girmeyen kullanıcı indirmesin.
const TAtlasPage = lazy(() => import("@/pages/TAtlasPage"));
const KullanicilarPage = lazy(() => import("@/pages/KullanicilarPage"));
const AyarlarPage = lazy(() => import("@/pages/AyarlarPage"));
const VeriYonetimiPage = lazy(() => import("@/pages/VeriYonetimiPage"));
const ProfilPage = lazy(() => import("@/pages/ProfilPage"));
const GuvenlikPage = lazy(() => import("@/pages/GuvenlikPage"));
const YardimPage = lazy(() => import("@/pages/YardimPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function ProtectedRoute({ pageKey, children }: { pageKey: keyof RolePermissions["pages"]; children: ReactNode }) {
  const { canAccessPage } = usePermissions();
  if (!canAccessPage(pageKey)) {
    // Redirect to the first Sidebar-ordered page this role CAN reach.
    // Avoids sending a Management user who lacks /workspace access
    // to a wrong page; Sidebar's order is the single source of truth
    // (see src/lib/navOrder.ts).
    return <Navigate to={getFirstAccessiblePath(canAccessPage)} replace />;
  }
  return <>{children}</>;
}

/**
 * Root "/" handler — picks the first Sidebar path the current user
 * has permission to open. Sits inside AuthGuard so canAccessPage has
 * a loaded permissions set.
 */
function HomeRedirect() {
  const { canAccessPage } = usePermissions();
  return <Navigate to={getFirstAccessiblePath(canAccessPage)} replace />;
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-tyro-bg">
      <div className="w-8 h-8 border-3 border-tyro-navy/20 border-t-tyro-navy rounded-full animate-spin" />
    </div>
  );
}

function PageSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <ErrorBoundary>
    <OfflineBanner />
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            {/* Root "/" — inside AuthGuard so permissions are loaded.
                HomeRedirect walks Sidebar order and lands on the first
                page this role can actually open. */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/workspace" element={<ProtectedRoute pageKey="anasayfa"><PageSuspense><WorkspacePage /></PageSuspense></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute pageKey="kpi"><PageSuspense><DashboardPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/projeler" element={<ProtectedRoute pageKey="projeler"><PageSuspense><ProjelerPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/aksiyonlar" element={<ProtectedRoute pageKey="aksiyonlar"><PageSuspense><AksiyonlarPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/stratejik-kokpit" element={<ProtectedRoute pageKey="stratejikKokpit"><PageSuspense><KokpitPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/gantt" element={<ProtectedRoute pageKey="gantt"><PageSuspense><GanttPage /></PageSuspense></ProtectedRoute>} />
            {/* WBS/Tree page removed */}
            <Route path="/strategy-map" element={<ProtectedRoute pageKey="tMap"><PageSuspense><StrategyMapPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/t-alignment" element={<ProtectedRoute pageKey="tAlignment"><PageSuspense><TAlignmentPage /></PageSuspense></ProtectedRoute>} />
            {/* T-Atlas yetkisi mevcut pages.kpi anahtarını kullanıyor:
                Admin + Management true, Proje Lideri false — dokümanın
                "Admin ve yönetim rolü" şartıyla birebir aynı. Yeni pageKey
                eklemek role_permissions yazması demekti. */}
            <Route path="/t-atlas" element={<ProtectedRoute pageKey="kpi"><PageSuspense><TAtlasPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/kullanicilar" element={<ProtectedRoute pageKey="kullanicilar"><PageSuspense><KullanicilarPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/veri-yonetimi" element={<ProtectedRoute pageKey="ayarlar"><PageSuspense><VeriYonetimiPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/ayarlar" element={<ProtectedRoute pageKey="ayarlar"><PageSuspense><AyarlarPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/guvenlik" element={<ProtectedRoute pageKey="guvenlik"><PageSuspense><GuvenlikPage /></PageSuspense></ProtectedRoute>} />
            <Route path="/profil" element={<PageSuspense><ProfilPage /></PageSuspense>} />
            <Route path="/yardim" element={<PageSuspense><YardimPage /></PageSuspense>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
    </ErrorBoundary>
  );
}
