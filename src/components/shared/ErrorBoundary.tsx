import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import i18n from "@/lib/i18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Yeni deploy sonrası eski sekmenin tembel chunk'ı yükleyememesi.
 *
 * Uygulama sayfaları `lazy()` ile yükleniyor ve her deploy'da dosya adları
 * değişiyor. Açık kalan bir sekme yeni bir sayfaya geçmek istediğinde artık
 * var olmayan bir dosyayı ister ve import REDDEDİLİR. Bu bir uygulama hatası
 * değil, sadece sekmenin bayatlamış olmasıdır — kullanıcıya kırmızı bir hata
 * ekranı yerine "güncellendi, yenileyin" demek doğrusu.
 *
 * Tarayıcılar bu durumu farklı metinlerle bildiriyor, o yüzden kalıp listesi.
 */
function isStaleChunkError(error: Error | null): boolean {
  if (!error) return false;
  const text = `${error.name} ${error.message}`.toLowerCase();
  return (
    text.includes("dynamically imported module") ||
    text.includes("importing a module script failed") ||
    text.includes("chunkloaderror") ||
    text.includes("failed to fetch dynamically") ||
    text.includes("error loading dynamically imported module")
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      // Bayat sekme — hata değil, güncelleme. Sakin ve yönlendirici bir ekran.
      if (isStaleChunkError(this.state.error)) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-tyro-gold/12 flex items-center justify-center text-tyro-gold">
              <Sparkles size={26} strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-bold text-tyro-text-primary">
              {i18n.t("update.staleTitle")}
            </h2>
            <p className="text-sm text-tyro-text-muted max-w-md">
              {i18n.t("update.staleDescription")}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-tyro-navy text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RefreshCw size={14} />
              {i18n.t("update.action")}
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-tyro-danger/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-tyro-danger" />
          </div>
          <h2 className="text-lg font-bold text-tyro-text-primary">
            {i18n.t("common.errorOccurred")}
          </h2>
          <p className="text-sm text-tyro-text-muted max-w-md">
            {i18n.t("common.errorDescription")}
          </p>
          {this.state.error && (
            <pre className="text-xs text-tyro-text-muted bg-tyro-bg rounded-lg p-3 max-w-lg overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tyro-navy text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={14} />
              {i18n.t("common.tryAgain")}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tyro-border text-tyro-text-primary text-sm font-medium hover:bg-tyro-bg transition-colors"
            >
              {i18n.t("common.refreshPage")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
