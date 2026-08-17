import {
  Factory,
  Anchor,
  Package,
  Building2,
  Zap,
  Construction,
  type LucideIcon,
} from "lucide-react";
import type { AssetClass } from "@/types";

/**
 * Varlık sınıfı → ikon (T-Atlas pin'i ve lejant).
 *
 * Doküman "ikon seti tek renkli ve çizgi tabanlı olmalı" diyor — Lucide tam
 * olarak bu, ayrıca uygulamanın zaten birincil ikon seti (UI kuralı).
 * Renk pin'in çerçevesinden gelir (statü), ikon sadece varlık türünü söyler.
 */
export const ASSET_CLASS_ICON: Record<AssetClass, LucideIcon> = {
  "AST-PROC": Factory,       // Üretim ve işleme tesisleri
  "AST-PORT": Anchor,        // Liman ve deniz altyapısı
  "AST-STOR": Package,       // Depolama ve lojistik
  "AST-ADMIN": Building2,    // İdari ve sosyal yapılar
  "AST-UTIL": Zap,           // Yardımcı tesisler, HSE, teknik sistemler
  "AST-CIVIL": Construction, // Saha ve inşaat altyapısı
};

/** Sınıfı bilinmeyen / boş projeler için nötr ikon. */
export const ASSET_CLASS_FALLBACK_ICON: LucideIcon = Building2;

export function assetClassIcon(code: string | undefined | null): LucideIcon {
  if (!code) return ASSET_CLASS_FALLBACK_ICON;
  return ASSET_CLASS_ICON[code as AssetClass] ?? ASSET_CLASS_FALLBACK_ICON;
}
