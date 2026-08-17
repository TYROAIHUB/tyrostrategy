import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Button } from "@heroui/react";
import { MapPin, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toast } from "@/stores/toastStore";
import type { LocationDefinition } from "@/types";

/**
 * Ayarlar > Lokasyon sekmesi — ülke + şehir çiftlerinin CRUD ekranı.
 *
 * Kayıtlar `locations` tablosunda tutulur (migration 031); ülke ve şehir aynı
 * satırda. Buradaki tanımlar proje formundaki lokasyon seçimini besleyecek —
 * proje tarafında lokasyon ZORUNLU DEĞİL.
 *
 * Mutasyonlar dataStore üzerinden optimistic gider; hata olursa
 * syncToSupabase context-aware toast atar ("Lokasyon "Türkiye / Ankara"
 * oluşturma başarısız: yetkiniz yok").
 */
export default function LocationSettings() {
  const { t } = useTranslation();

  const locations = useDataStore((s) => s.locations);
  const addLocation = useDataStore((s) => s.addLocation);
  const updateLocation = useDataStore((s) => s.updateLocation);
  const deleteLocation = useDataStore((s) => s.deleteLocation);

  const [newCountry, setNewCountry] = useState("");
  const [newCity, setNewCity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCountry, setEditCountry] = useState("");
  const [editCity, setEditCity] = useState("");
  const [pendingDelete, setPendingDelete] = useState<LocationDefinition | null>(null);

  /** Aynı ülke+şehir çifti zaten var mı? DB'de de unique index var (031) —
   *  bu kontrol kullanıcıya anında geri bildirim vermek için. Türkçe casing
   *  (İ/ı) doğru karşılaştırılsın diye toLocaleLowerCase("tr"). */
  const isDuplicate = useCallback(
    (country: string, city: string, excludeId?: string): boolean => {
      const c = country.trim().toLocaleLowerCase("tr");
      const s = city.trim().toLocaleLowerCase("tr");
      return locations.some(
        (l) =>
          l.id !== excludeId &&
          l.country.trim().toLocaleLowerCase("tr") === c &&
          l.city.trim().toLocaleLowerCase("tr") === s
      );
    },
    [locations]
  );

  const handleAdd = useCallback(() => {
    const country = newCountry.trim();
    const city = newCity.trim();
    if (!country || !city) {
      toast.error(t("settings.locationRequired"));
      return;
    }
    if (isDuplicate(country, city)) {
      toast.error(t("settings.locationDuplicate"));
      return;
    }
    addLocation({ country, city });
    toast.success(t("settings.locationCreated"), { message: `${country} / ${city}` });
    setNewCountry("");
    setNewCity("");
  }, [newCountry, newCity, isDuplicate, addLocation, t]);

  const startEdit = useCallback((loc: LocationDefinition) => {
    setEditingId(loc.id);
    setEditCountry(loc.country);
    setEditCity(loc.city);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditCountry("");
    setEditCity("");
  }, []);

  const saveEdit = useCallback(
    (loc: LocationDefinition) => {
      const country = editCountry.trim();
      const city = editCity.trim();
      if (!country || !city) {
        toast.error(t("settings.locationRequired"));
        return;
      }
      if (isDuplicate(country, city, loc.id)) {
        toast.error(t("settings.locationDuplicate"));
        return;
      }
      // Değişiklik yoksa sessizce kapat — gereksiz DB yazımı yapmıyoruz
      if (country === loc.country && city === loc.city) {
        cancelEdit();
        return;
      }
      updateLocation(loc.id, { country, city });
      toast.success(t("settings.locationUpdated"), { message: `${country} / ${city}` });
      cancelEdit();
    },
    [editCountry, editCity, isDuplicate, updateLocation, cancelEdit, t]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    deleteLocation(pendingDelete.id);
    toast.success(t("settings.locationDeleted"), {
      message: `${pendingDelete.country} / ${pendingDelete.city}`,
    });
    setPendingDelete(null);
  }, [pendingDelete, deleteLocation, t]);

  const canAdd = newCountry.trim().length > 0 && newCity.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="glass-card rounded-card p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-tyro-gold" />
            <h2 className="text-base font-bold text-tyro-text-primary">
              {t("settings.locationManagement")}
            </h2>
          </div>
          <span className="text-[11px] text-tyro-text-muted">
            {locations.length} {t("settings.locationCount")}
          </span>
        </div>
        <p className="text-[12px] text-tyro-text-muted mb-4">
          {t("settings.locationManagementDesc")}
        </p>

        {/* Kolon başlıkları — iki alanın aynı satırda olduğunu görsel olarak kurar */}
        {locations.length > 0 && (
          <div className="hidden sm:flex items-center gap-2.5 px-3 pb-1.5">
            <span className="text-[11px] font-semibold text-tyro-text-muted flex-1">
              {t("settings.locationCountry")}
            </span>
            <span className="text-[11px] font-semibold text-tyro-text-muted flex-1">
              {t("settings.locationCity")}
            </span>
            {/* Aksiyon butonlarının genişliği kadar boşluk */}
            <span className="w-16 shrink-0" />
          </div>
        )}

        {/* Lokasyon listesi */}
        <div className="flex flex-col gap-1.5 mb-4 max-h-[500px] overflow-y-auto">
          {locations.length === 0 && (
            <p className="text-[12px] text-tyro-text-muted py-6 text-center">
              {t("settings.noLocations")}
            </p>
          )}

          {locations.map((loc) => {
            const isEditing = editingId === loc.id;
            return (
              <div
                key={loc.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-tyro-bg/60 hover:bg-tyro-bg border border-transparent hover:border-tyro-border/30 transition-colors group"
              >
                {isEditing ? (
                  <>
                    <Input
                      size="sm"
                      variant="bordered"
                      value={editCountry}
                      onValueChange={setEditCountry}
                      aria-label={t("settings.locationCountry")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(loc);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      classNames={{ base: "flex-1", inputWrapper: "h-8 min-h-8" }}
                      autoFocus
                    />
                    <Input
                      size="sm"
                      variant="bordered"
                      value={editCity}
                      onValueChange={setEditCity}
                      aria-label={t("settings.locationCity")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(loc);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      classNames={{ base: "flex-1", inputWrapper: "h-8 min-h-8" }}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => saveEdit(loc)}
                        aria-label={t("common.save")}
                        className="w-7 h-7 min-w-7 text-tyro-success"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={cancelEdit}
                        aria-label={t("common.cancel")}
                        className="w-7 h-7 min-w-7 text-tyro-text-muted"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] font-semibold text-tyro-text-primary flex-1 min-w-0 truncate">
                      {loc.country}
                    </span>
                    <span className="text-[13px] font-medium text-tyro-text-secondary flex-1 min-w-0 truncate">
                      {loc.city}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => startEdit(loc)}
                        aria-label={t("common.edit")}
                        className="w-7 h-7 min-w-7 text-tyro-text-muted data-[hover=true]:text-tyro-text-primary sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => setPendingDelete(loc)}
                        aria-label={t("common.delete")}
                        className="w-7 h-7 min-w-7 text-tyro-text-muted data-[hover=true]:text-tyro-danger sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Yeni lokasyon — ülke + şehir aynı satırda */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-tyro-border/30">
          <Input
            size="sm"
            variant="bordered"
            placeholder={t("settings.locationCountryPlaceholder")}
            value={newCountry}
            onValueChange={setNewCountry}
            aria-label={t("settings.locationCountry")}
            onKeyDown={(e) => { if (e.key === "Enter" && canAdd) handleAdd(); }}
            classNames={{ base: "flex-1", inputWrapper: "h-9 min-h-9" }}
          />
          <Input
            size="sm"
            variant="bordered"
            placeholder={t("settings.locationCityPlaceholder")}
            value={newCity}
            onValueChange={setNewCity}
            aria-label={t("settings.locationCity")}
            onKeyDown={(e) => { if (e.key === "Enter" && canAdd) handleAdd(); }}
            classNames={{ base: "flex-1", inputWrapper: "h-9 min-h-9" }}
          />
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={handleAdd}
            isDisabled={!canAdd}
            startContent={<Plus size={15} />}
            className="rounded-lg h-9 font-semibold shrink-0"
          >
            {t("settings.locationAdd")}
          </Button>
        </div>

        <p className="text-[11px] text-tyro-text-muted mt-3">
          {t("settings.locationOptionalNote")}
        </p>
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        message={
          pendingDelete
            ? `${t("settings.locationDeleteConfirm")} (${pendingDelete.country} / ${pendingDelete.city})`
            : t("settings.locationDeleteConfirm")
        }
      />
    </div>
  );
}
