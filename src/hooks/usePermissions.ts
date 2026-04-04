import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRoleStore } from "@/stores/roleStore";
import { useDataStore } from "@/stores/dataStore";
import type { Proje, Aksiyon, RolePermissions } from "@/types";

export function usePermissions() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const perms: RolePermissions = useRoleStore((s) => s.getPermissions(user.role));
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const normalizedName = user.name.toLowerCase().trim();

  // Kullanicinin proje ID'leri (owner veya participant)
  const myProjeIds = useMemo(() => {
    const ids = new Set<string>();

    if (!perms.viewOnlyOwn) {
      // Admin — hepsini gorebilir
      for (const h of projeler) ids.add(h.id);
    } else {
      // viewOnlyOwn aktif → owner veya participant oldugu projeler
      for (const h of projeler) {
        if (
          h.owner?.toLowerCase().trim() === normalizedName ||
          h.participants?.some((p) => p.toLowerCase().trim() === normalizedName)
        ) {
          ids.add(h.id);
        }
      }
    }
    return ids;
  }, [perms.viewOnlyOwn, user.role, normalizedName, projeler]);

  // Kullanicinin aksiyonlari (owner veya kendi hedeflerindeki)
  const myAksiyonIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of aksiyonlar) {
      if (
        a.owner?.toLowerCase().trim() === normalizedName ||
        myProjeIds.has(a.projeId)
      ) {
        ids.add(a.id);
      }
    }
    return ids;
  }, [aksiyonlar, normalizedName, myProjeIds]);

  // ===== Sayfa erisim =====
  const canAccessPage = (pageKey: keyof RolePermissions["pages"]) => perms.pages[pageKey];

  // ===== Veri filtreleme =====
  const filterProjeler = useCallback((list: Proje[]): Proje[] => {
    if (!perms.viewOnlyOwn) return list;
    return list.filter((h) => myProjeIds.has(h.id));
  }, [perms.viewOnlyOwn, myProjeIds]);

  const filterAksiyonlar = useCallback((list: Aksiyon[]): Aksiyon[] => {
    if (!perms.viewOnlyOwn) return list;
    if (user.role === "Kullanıcı") {
      return list.filter((a) => a.owner?.toLowerCase().trim() === normalizedName);
    }
    return list.filter((a) => myAksiyonIds.has(a.id));
  }, [perms.viewOnlyOwn, user.role, normalizedName, myAksiyonIds]);

  // ===== CRUD izinleri =====

  // Proje
  const canCreateProje = perms.proje.create;
  const canEditProje = (projeId: string) => {
    if (!perms.proje.edit) return false;
    if (!perms.editOnlyOwn) return true;
    return myProjeIds.has(projeId);
  };
  const canDeleteProje = (projeId: string) => {
    if (!perms.proje.delete) return false;
    // Cascade: alt aksiyon varsa silinemez
    return !aksiyonlar.some((a) => a.projeId === projeId);
  };
  const getProjeDeleteReason = (projeId: string): string | null => {
    const children = aksiyonlar.filter((a) => a.projeId === projeId);
    if (children.length > 0) {
      return t("permissions.cannotDeleteProject", { count: children.length });
    }
    return null;
  };

  // Aksiyon
  const canCreateAksiyon = perms.aksiyon.create;
  const canEditAksiyon = (aksiyonId: string) => {
    if (!perms.aksiyon.edit) return false;
    if (!perms.editOnlyOwn) return true;
    return myAksiyonIds.has(aksiyonId);
  };
  const canDeleteAksiyon = (_aksiyonId: string) => perms.aksiyon.delete;

  return {
    user,
    perms,

    // Sayfa erisimi
    canAccessPage,
    canAccessKPI: perms.pages.kpi,
    canAccessKullanicilar: perms.pages.kullanicilar,
    canAccessAyarlar: perms.pages.ayarlar,
    canAccessGuvenlik: perms.pages.guvenlik,

    // Proje
    canCreateProje,
    canEditProje,
    canDeleteProje,
    getProjeDeleteReason,

    // Aksiyon
    canCreateAksiyon,
    canEditAksiyon,
    canDeleteAksiyon,

    // Filtreleme
    filterProjeler,
    filterAksiyonlar,

    // Yardimcilar
    myAksiyonIds,
    myProjeIds,
  };
}
