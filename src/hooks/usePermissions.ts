import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRoleStore } from "@/stores/roleStore";
import { useDataStore } from "@/stores/dataStore";
import type { Hedef, Aksiyon, RolePermissions } from "@/types";

export function usePermissions() {
  const user = useCurrentUser();
  const perms: RolePermissions = useRoleStore((s) => s.getPermissions(user.role));
  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const normalizedName = user.name.toLowerCase().trim();

  // Kullanicinin hedef ID'leri (owner veya participant)
  const myHedefIds = useMemo(() => {
    const ids = new Set<string>();

    if (!perms.viewOnlyOwn) {
      // Admin — hepsini gorebilir
      for (const h of hedefler) ids.add(h.id);
    } else if (user.role === "Proje Lideri") {
      // Proje lideri → owner veya participant oldugu hedefler
      for (const h of hedefler) {
        if (
          h.owner?.toLowerCase().trim() === normalizedName ||
          h.participants?.some((p) => p.toLowerCase().trim() === normalizedName)
        ) {
          ids.add(h.id);
        }
      }
    } else {
      // Kullanici → aksiyonlarinin hedefleri
      for (const a of aksiyonlar) {
        if (a.owner?.toLowerCase().trim() === normalizedName) {
          ids.add(a.hedefId);
        }
      }
    }
    return ids;
  }, [perms.viewOnlyOwn, user.role, normalizedName, hedefler, aksiyonlar]);

  // Kullanicinin aksiyonlari (owner veya kendi hedeflerindeki)
  const myAksiyonIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of aksiyonlar) {
      if (
        a.owner?.toLowerCase().trim() === normalizedName ||
        myHedefIds.has(a.hedefId)
      ) {
        ids.add(a.id);
      }
    }
    return ids;
  }, [aksiyonlar, normalizedName, myHedefIds]);

  // ===== Sayfa erisim =====
  const canAccessPage = (pageKey: keyof RolePermissions["pages"]) => perms.pages[pageKey];

  // ===== Veri filtreleme =====
  const filterHedefler = (list: Hedef[]): Hedef[] => {
    if (!perms.viewOnlyOwn) return list;
    return list.filter((h) => myHedefIds.has(h.id));
  };

  const filterAksiyonlar = (list: Aksiyon[]): Aksiyon[] => {
    if (!perms.viewOnlyOwn) return list;
    if (user.role === "Kullanıcı") {
      // Kullanici sadece kendi aksiyonlarini gorur (owner)
      return list.filter((a) => a.owner?.toLowerCase().trim() === normalizedName);
    }
    // Proje Lideri — kendi hedeflerindeki aksiyonlar
    return list.filter((a) => myAksiyonIds.has(a.id));
  };

  // ===== CRUD izinleri =====

  // Hedef
  const canCreateHedef = perms.hedef.create;
  const canEditHedef = (_hedefId: string) => perms.hedef.edit;
  const canDeleteHedef = (hedefId: string) => {
    if (!perms.hedef.delete) return false;
    // Cascade: alt aksiyon varsa silinemez
    return !aksiyonlar.some((a) => a.hedefId === hedefId);
  };
  const getHedefDeleteReason = (hedefId: string): string | null => {
    const childCount = aksiyonlar.filter((a) => a.hedefId === hedefId).length;
    if (childCount > 0) return `Bu hedefin altında ${childCount} aksiyon var. Önce aksiyonları silin.`;
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

    // Hedef
    canCreateHedef,
    canEditHedef,
    canDeleteHedef,
    getHedefDeleteReason,

    // Aksiyon
    canCreateAksiyon,
    canEditAksiyon,
    canDeleteAksiyon,

    // Filtreleme
    filterHedefler,
    filterAksiyonlar,

    // Yardimcilar
    myAksiyonIds,
    myHedefIds,
  };
}
