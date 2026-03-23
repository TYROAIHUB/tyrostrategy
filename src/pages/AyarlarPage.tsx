import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Select, SelectItem, Switch } from "@heroui/react";
import { useUIStore } from "@/stores/uiStore";
import PageHeader from "@/components/layout/PageHeader";

export default function AyarlarPage() {
  const { t } = useTranslation();
  const { locale, setLocale } = useUIStore();
  const [emailNotif, setEmailNotif] = useState(true);
  const [browserNotif, setBrowserNotif] = useState(false);

  return (
    <div>
      <PageHeader
        title={t("pages.settings.title")}
        subtitle={t("pages.settings.subtitle")}
      />

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Genel */}
        <div className="glass-card rounded-card p-6">
          <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.general")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("settings.appName")}</label>
              <Input
                value="TYRO Strategy"
                isReadOnly
                variant="bordered"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.language")}</label>
              <Select
                selectedKeys={[locale]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as "tr" | "en";
                  if (val) setLocale(val);
                }}
                variant="bordered"
              >
                <SelectItem key="tr">{t("profile.turkish")}</SelectItem>
                <SelectItem key="en">{t("profile.english")}</SelectItem>
              </Select>
            </div>
          </div>
        </div>

        {/* Bildirimler */}
        <div className="glass-card rounded-card p-6">
          <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.notifications")}</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-tyro-text-primary">{t("settings.emailNotifications")}</p>
                <p className="text-xs text-tyro-text-muted">{t("settings.emailNotificationsDesc")}</p>
              </div>
              <Switch isSelected={emailNotif} onValueChange={setEmailNotif} size="sm" />
            </div>
            <div className="h-px bg-tyro-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-tyro-text-primary">{t("settings.browserNotifications")}</p>
                <p className="text-xs text-tyro-text-muted">{t("settings.browserNotificationsDesc")}</p>
              </div>
              <Switch isSelected={browserNotif} onValueChange={setBrowserNotif} size="sm" />
            </div>
          </div>
        </div>

        {/* Entegrasyon */}
        <div className="glass-card rounded-card p-6">
          <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.integration")}</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-tyro-text-primary">{t("settings.azureAdStatus")}</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600">
                {t("settings.demoMode")}
              </span>
            </div>
            <div className="h-px bg-tyro-border" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-tyro-text-primary">{t("settings.dataverseConnection")}</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tyro-bg text-tyro-text-muted">
                {t("settings.notConfigured")}
              </span>
            </div>
          </div>
        </div>

        {/* Hakkında */}
        <div className="glass-card rounded-card p-6">
          <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.about")}</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-tyro-text-secondary">{t("settings.version")}</p>
              <p className="text-sm font-medium text-tyro-text-primary">1.0.0</p>
            </div>
            <div className="h-px bg-tyro-border" />
            <p className="text-xs text-tyro-text-muted text-center mt-2">
              TTECH Business Solutions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
