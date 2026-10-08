import {
  Circle,
  TrendingUp,
  TriangleAlert,
  OctagonAlert,
  CircleCheck,
  CirclePause,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import type { EntityStatus } from "@/types";

/**
 * Statü → ikon eşlemesi. TEK KAYNAK.
 *
 * Kullanıcı isteği 2026-10-08: proje/aksiyon durumunun göründüğü her yerde
 * statüye ait bir ikon olsun. Önceden tüm statüler AYNI dolu daireydi ve
 * yalnızca rengi değişiyordu; bu hem hızlı taramada ayırt ediciliği
 * düşürüyordu hem de renk körü kullanıcı için statüler birbirinden
 * ayrılamıyordu (WCAG: bilgi yalnızca renkle taşınmamalı).
 *
 * İkonlar SİLUETİ birbirinden farklı olacak şekilde seçildi — 11px'te bile
 * renge bakmadan ayırt edilebilsinler:
 *   daire (boş) · yukarı ok · üçgen · sekizgen · tik · duraklat · eğik çizgi
 */
export const STATUS_ICON: Record<EntityStatus, LucideIcon> = {
  /** Henüz başlanmamış — içi boş daire, "hiçbir şey yok" */
  "Not Started": Circle,
  /** Yolunda — yukarı ok, plana uygun ilerliyor */
  "On Track": TrendingUp,
  /** Riskte — üçgen uyarı */
  "At Risk": TriangleAlert,
  /** Yüksek riskte — sekizgen (dur levhası); üçgenden bariz farklı siluet */
  "High Risk": OctagonAlert,
  /** Tamamlandı — tik */
  Achieved: CircleCheck,
  /** Askıda — duraklatma; kullanıcının manuel kararı */
  "On Hold": CirclePause,
  /** İptal — eğik çizgi (yasak işareti) */
  Cancelled: CircleSlash,
};

/** Bilinmeyen statüde de bir şey çizilebilsin — tiplerde olmayan veri gelirse. */
export function statusIcon(status: EntityStatus | string | undefined | null): LucideIcon {
  return STATUS_ICON[status as EntityStatus] ?? Circle;
}
