import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <span className="text-6xl font-extrabold text-tyro-text-muted/30">404</span>
      <h2 className="text-lg font-bold text-tyro-text-primary">
        {t("pages.notFound.title")}
      </h2>
      <p className="text-sm text-tyro-text-muted max-w-md">
        {t("pages.notFound.subtitle")}
      </p>
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-tyro-navy text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <ArrowLeft size={14} />
        {t("pages.notFound.goHome")}
      </button>
    </div>
  );
}
