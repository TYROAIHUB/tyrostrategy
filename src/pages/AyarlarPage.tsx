import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Select, SelectItem, Switch, Button, Popover, PopoverTrigger, PopoverContent, Tabs, Tab } from "@heroui/react";
import { Plus, Trash2, Pencil, Check, X, Tag, Settings, Bell, Plug, Info } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { hexToHSL } from "@/lib/colorUtils";
import PageHeader from "@/components/layout/PageHeader";
import ColorPicker from "@/components/ui/ColorPicker";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toast } from "@/stores/toastStore";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";
import { isSupabaseMode } from "@/hooks/useSupabaseData";

export default function AyarlarPage() {
  const { t } = useTranslation();
  const { locale, setLocale, companyName, setCompanyName, allowMultipleTags, setAllowMultipleTags } = useUIStore();
  const sidebarTheme = useSidebarTheme();
  // Bildirimler kaldırıldı — fonksiyonel değildi

  // Tag management state
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);
  const projeler = useDataStore((s) => s.projeler);
  const addTagDefinition = useDataStore((s) => s.addTagDefinition);
  const updateTagDefinition = useDataStore((s) => s.updateTagDefinition);
  const deleteTagDefinition = useDataStore((s) => s.deleteTagDefinition);
  const renameTag = useDataStore((s) => s.renameTag);

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const getUsageCount = (tagName: string) =>
    projeler.filter((h) => h.tags?.includes(tagName)).length;

  const handleAddTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const exists = tagDefinitions.some(
      (td) => td.name.toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr")
    );
    if (exists) {
      toast.error(t("settings.tagNameDuplicate"));
      return;
    }
    addTagDefinition({ name: trimmed, color: newTagColor });
    toast.success(t("settings.tagCreated"), { message: trimmed });
    setNewTagName("");
    setNewTagColor(DEFAULT_TAG_COLOR);
  };

  const handleDeleteTag = (id: string, name: string) => {
    const count = getUsageCount(name);
    const msg = count > 0
      ? `${t("settings.tagDeleteConfirm")} ${t("settings.tagInUseWarning", { count })}`
      : t("settings.tagDeleteConfirm");
    setConfirmMessage(msg);
    setConfirmAction(() => () => {
      deleteTagDefinition(id);
      toast.success(t("settings.tagDeleted"), { message: name });
    });
    setConfirmOpen(true);
  };

  const startEditing = (tag: { id: string; name: string }) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const saveEditing = (id: string, oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (trimmed !== oldName) {
      const exists = tagDefinitions.some(
        (td) => td.id !== id && td.name.toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr")
      );
      if (exists) {
        toast.error(t("settings.tagNameDuplicate"));
        return;
      }
      renameTag(oldName, trimmed);
    }
    toast.success(t("settings.tagUpdated"), {
      message: trimmed,
      details: trimmed !== oldName
        ? [{ label: "Eski Ad", value: oldName }, { label: "Yeni Ad", value: trimmed }]
        : [{ label: "Değişiklik", value: "Renk güncellendi" }],
    });
    setEditingId(null);
  };

  // ===== TAB CONTENTS =====

  const accentColor = sidebarTheme.accentColor ?? "#c8922a";

  const generalTab = (
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* ── Kuruluş Bilgileri ── */}
      <SettingsCard title="Kuruluş Bilgileri">
        <SettingsRow label={t("settings.appName")} description="Uygulamanın sistem adı (salt okunur)">
          <span className="text-[13px] font-semibold text-tyro-text-primary">TYRO Strategy</span>
        </SettingsRow>
        <SettingsRow label="Şirket Adı" description="Uygulama genelinde görüntülenen şirket adı">
          <Input
            value={companyName}
            onValueChange={setCompanyName}
            variant="bordered"
            size="sm"
            className="w-[200px]"
            classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
          />
        </SettingsRow>
      </SettingsCard>

      {/* ── Numara Serisi ── */}
      <SettingsCard title="Numara Serisi Şablonu">
        <SettingsRow label="Proje ID" description="Örn: P26-0001">
          <span className="text-[13px] font-mono font-semibold text-tyro-text-secondary tabular-nums">P{"{"}<span style={{ color: accentColor }}>YY</span>{"}"}-{"{"}<span style={{ color: accentColor }}>NNNN</span>{"}"}</span>
        </SettingsRow>
        <SettingsRow label="Aksiyon ID" description="Örn: A26-0001">
          <span className="text-[13px] font-mono font-semibold text-tyro-text-secondary tabular-nums">A{"{"}<span style={{ color: accentColor }}>YY</span>{"}"}-{"{"}<span style={{ color: accentColor }}>NNNN</span>{"}"}</span>
        </SettingsRow>
        <p className="text-[10px] text-tyro-text-muted px-5 pb-3">YY = Oluşturulma yılı, NNNN = Otomatik sıra numarası</p>
      </SettingsCard>

      {/* ── Kurallar ── */}
      <SettingsCard title="Kurallar">
        <SettingsRow label="Çoklu etiket" description="Kapalıyken projelere yalnızca tek etiket atanabilir">
          <Switch isSelected={allowMultipleTags} onValueChange={setAllowMultipleTags} size="sm" />
        </SettingsRow>
      </SettingsCard>

      {/* ── Entegrasyon ── */}
      <SettingsCard title="Entegrasyonlar">
        <SettingsRow label="Supabase (PostgreSQL)" description="Veritabanı ve gerçek zamanlı veri servisi">
          {isSupabaseMode ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Bağlı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tyro-bg text-tyro-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-tyro-text-muted" /> Mock Veri
            </span>
          )}
        </SettingsRow>
        <SettingsRow label="Azure AD (MSAL)" description="Kurumsal kimlik doğrulama servisi">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Demo Modu
          </span>
        </SettingsRow>
        <SettingsRow label="Veri Sağlayıcı" description="Aktif veri kaynağı modu">
          <span className="text-[13px] font-mono font-semibold text-tyro-text-primary tabular-nums">
            {isSupabaseMode ? "supabase" : "mock"}
          </span>
        </SettingsRow>
      </SettingsCard>

      {/* ── Hakkında ── */}
      <SettingsCard title={t("settings.about")}>
        <SettingsRow label="Uygulama" description="Stratejik proje yönetim platformu">
          <span className="text-[13px] font-semibold text-tyro-text-primary">TYRO Strategy</span>
        </SettingsRow>
        <SettingsRow label={t("settings.version")} description="Mevcut uygulama sürümü">
          <span className="text-[13px] font-mono font-semibold text-tyro-text-primary tabular-nums">1.0.0</span>
        </SettingsRow>
        <SettingsRow label="Platform" description="Kullanılan teknoloji yığını">
          <span className="text-[12px] font-medium text-tyro-text-secondary">React · HeroUI · Supabase · Vite</span>
        </SettingsRow>
        <SettingsRow label="Geliştirici" description="Uygulama geliştirme ortağı">
          <span className="text-[13px] font-semibold text-tyro-text-primary">TTECH Business Solutions</span>
        </SettingsRow>
        <SettingsRow label="Kuruluş" description="Lisans sahibi kuruluş">
          <span className="text-[13px] font-semibold text-tyro-text-primary">{companyName}</span>
        </SettingsRow>
      </SettingsCard>
    </div>
  );

  const tagsTab = (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="glass-card rounded-card p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-tyro-gold" />
            <h2 className="text-base font-bold text-tyro-text-primary">{t("settings.tagManagement")}</h2>
          </div>
          <span className="text-[11px] text-tyro-text-muted">{tagDefinitions.length} etiket</span>
        </div>
        <p className="text-[12px] text-tyro-text-muted mb-4">{t("settings.tagManagementDesc")}</p>

        {/* Tag list */}
        <div className="flex flex-col gap-1.5 mb-4 max-h-[500px] overflow-y-auto">
          {tagDefinitions.map((tag) => {
            const isEditing = editingId === tag.id;
            const usageCount = getUsageCount(tag.name);
            return (
              <div
                key={tag.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-tyro-bg/60 hover:bg-tyro-bg border border-transparent hover:border-tyro-border/30 transition-colors group"
              >
                {/* Color picker popover */}
                <Popover placement="bottom-start">
                  <PopoverTrigger>
                    <button
                      type="button"
                      className="w-6 h-6 rounded-full shrink-0 cursor-pointer border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: tag.color }}
                      title={t("settings.tagColor")}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="p-3">
                    <p className="text-[11px] font-semibold text-tyro-text-secondary mb-2">{t("settings.tagColor")}</p>
                    <ColorPicker
                      value={tag.color}
                      onChange={(color) => updateTagDefinition(tag.id, { color })}
                    />
                  </PopoverContent>
                </Popover>

                {/* Name — edit or display */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Input
                      size="sm"
                      variant="bordered"
                      value={editName}
                      onValueChange={setEditName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing(tag.id, tag.name);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      classNames={{ base: "flex-1", inputWrapper: "h-7 min-h-7" }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveEditing(tag.id, tag.name)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-success hover:bg-tyro-success/10 cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[13px] font-medium text-tyro-text-primary flex-1 min-w-0 truncate">
                      {tag.name}
                    </span>
                    {usageCount > 0 && (
                      <span className="text-[11px] text-tyro-text-muted shrink-0">
                        {usageCount} proje
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(tag)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-text-muted hover:text-tyro-text-primary hover:bg-tyro-bg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id, tag.name)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-text-muted hover:text-tyro-danger hover:bg-red-50 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new tag */}
        <div className="flex items-center gap-2 pt-3 border-t border-tyro-border/30">
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <button
                type="button"
                className="w-7 h-7 rounded-full shrink-0 cursor-pointer border-2 border-dashed border-tyro-border hover:border-tyro-gold transition-colors"
                style={{ backgroundColor: newTagColor }}
                title={t("settings.tagColor")}
              />
            </PopoverTrigger>
            <PopoverContent className="p-3">
              <p className="text-[11px] font-semibold text-tyro-text-secondary mb-2">{t("settings.tagColor")}</p>
              <ColorPicker value={newTagColor} onChange={setNewTagColor} />
            </PopoverContent>
          </Popover>
          <Input
            size="sm"
            variant="bordered"
            placeholder={t("settings.tagNamePlaceholder")}
            value={newTagName}
            onValueChange={setNewTagName}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); }}
            classNames={{ base: "flex-1", inputWrapper: "h-8 min-h-8" }}
          />
          <Button
            size="sm"
            color="primary"
            variant="flat"
            isIconOnly
            onPress={handleAddTag}
            isDisabled={!newTagName.trim()}
            className="rounded-lg"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t("pages.settings.title")}
        subtitle={t("pages.settings.subtitle")}
      />

      <Tabs
        aria-label="Ayarlar sekmeleri"
        variant="underlined"
        color="primary"
        classNames={{
          tabList: "gap-6 border-b border-tyro-border/50 pb-0",
          tab: "px-1 h-10 text-[13px] font-semibold",
          cursor: "h-[2px]",
          panel: "pt-5",
        }}
        style={{ "--heroui-primary": hexToHSL(sidebarTheme.accentColor) } as React.CSSProperties}
      >
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-2">
              <Settings size={15} />
              <span>{t("settings.general")}</span>
            </div>
          }
        >
          {generalTab}
        </Tab>
        <Tab
          key="tags"
          title={
            <div className="flex items-center gap-2">
              <Tag size={15} />
              <span>{t("settings.tagManagement")}</span>
              <span className="ml-0.5 text-[11px] bg-tyro-gold/15 text-tyro-gold px-1.5 py-0.5 rounded-full font-bold">
                {tagDefinitions.length}
              </span>
            </div>
          }
        >
          {tagsTab}
        </Tab>
      </Tabs>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        message={confirmMessage}
      />
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-3 border-b border-tyro-border/15">
        <h2 className="text-[13px] font-bold text-tyro-text-primary">{title}</h2>
      </div>
      <div className="divide-y divide-tyro-border/10">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-tyro-text-primary">{label}</p>
        {description && <p className="text-[11px] text-tyro-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
