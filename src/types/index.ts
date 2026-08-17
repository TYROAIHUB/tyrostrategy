// ===== Domain Model: Proje → Aksiyon (2 seviye) =====

export type EntityStatus = "On Track" | "Achieved" | "High Risk" | "At Risk" | "Not Started" | "Cancelled" | "On Hold";
export type Source = "Türkiye" | "Kurumsal" | "International" | "LALE" | "Organik";
export type ProjectStatus = "active" | "planned" | "completed" | "delayed";

// ===== Yatırım portföyü taksonomisi (migration 033) =====
// İki bağımsız eksen. Kodlar DB'de CHECK constraint ile de kilitli;
// etiketler i18n'de (assetClass.* / actionType.*), liste
// src/config/projectTaxonomy.ts'de.
/** Varlık sınıfı — yatırımın fiziksel varlık türü */
export type AssetClass =
  | "AST-PROC"   // Üretim ve İşleme Tesisleri
  | "AST-PORT"   // Liman ve Deniz Altyapısı
  | "AST-STOR"   // Depolama ve Lojistik Tesisleri
  | "AST-ADMIN"  // İdari ve Sosyal Yapılar
  | "AST-UTIL"   // Yardımcı Tesisler, HSE ve Teknik Sistemler
  | "AST-CIVIL"; // Saha ve İnşaat Altyapısı

/** Yatırım tipi — yatırımın niteliği */
export type ProjectActionType =
  | "ACT-NEW"    // Yeni Yapım / Yeni Kurulum
  | "ACT-EXP"    // Genişleme / Kapasite Artışı
  | "ACT-UPG"    // Modernizasyon / Entegrasyon
  | "ACT-SUS"    // İdame / Yenileme / Büyük Bakım
  | "ACT-REL";   // Taşıma / Yeniden Konumlandırma
export type Priority = "critical" | "high" | "medium" | "low";

// ===== RBAC =====
// "Kullanıcı" rolü 2026-04-24'te kaldırıldı (migration 019).
// 3 rol yeterli: Admin, Proje Lideri, Management.
export type UserRole = "Admin" | "Proje Lideri" | "Management";

export interface CrudPermission {
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface PagePermissions {
  anasayfa: boolean;
  kpi: boolean;
  raporKonfigurasyonu: boolean;
  projeler: boolean;
  aksiyonlar: boolean;
  gantt: boolean;
  stratejikKokpit: boolean;
  tMap: boolean;
  tAlignment: boolean;
  kullanicilar: boolean;
  ayarlar: boolean;
  guvenlik: boolean;
}

export interface RolePermissions {
  pages: PagePermissions;
  proje: CrudPermission;
  aksiyon: CrudPermission;
  editOnlyOwn: boolean;
  viewOnlyOwn: boolean;
}

// ===== Proje (genişletilmiş — eski Proje alanları eklendi) =====
export interface Proje {
  id: string;
  name: string;
  description?: string;
  source: Source;
  status: EntityStatus;
  owner: string;
  participants: string[];
  department: string;
  progress: number;
  startDate: string;
  endDate: string;
  reviewDate?: string;
  tags?: string[];             // Etiketler — filtreleme & kategorizasyon
  /** Opsiyonel lokasyon referansı → LocationDefinition.id (migration 032).
   *  Zorunlu değil: undefined = lokasyon girilmemiş. Ayarlar > Lokasyon'da
   *  tanımlı ülke/şehir çiftlerinden seçilir. */
  locationId?: string;
  /** Opsiyonel yatırım tutarı, USD (migration 033). undefined = girilmemiş. */
  capexUsd?: number;
  /** Opsiyonel varlık sınıfı (migration 033) — sabit seçim */
  assetClass?: AssetClass;
  /** Opsiyonel yatırım tipi (migration 033) — sabit seçim */
  actionType?: ProjectActionType;
  parentObjectiveId?: string;  // Ana proje ID — null ise bağımsız/ana proje
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  completedAt?: string;
}

// ===== Tag Tanımı — parametrik etiketler (ad + renk) =====
export interface TagDefinition {
  id: string;
  name: string;
  color: string; // hex "#D4A017"
}

// ===== Lokasyon Tanımı — ülke + şehir aynı satırda (migration 031) =====
// Ayarlar > Lokasyon sekmesinden yönetilir, proje formunda opsiyonel seçilir.
// İsim `Location` değil `LocationDefinition`: DOM'un global `Location`
// tipiyle (window.location) çakışmasın ve TagDefinition ile simetrik olsun.
export interface LocationDefinition {
  id: string;
  country: string;
  city: string;
}

// ===== Aksiyon (eski Görev — direkt hedefe bağlı) =====
export interface Aksiyon {
  id: string;
  projeId: string;
  name: string;
  description?: string;
  owner: string;
  status: EntityStatus;
  progress: number;
  startDate: string;
  endDate: string;
  sortOrder?: number;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  completedAt?: string;
}

// ===== Advanced Filter Types =====
export interface AdvancedFilters {
  statuses?: string[];
  sources?: string[];
  departments?: string[];
  owners?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  reviewDateFrom?: string;
  reviewDateTo?: string;
  progressMin?: number;
  progressMax?: number;
  aksiyonStatuses?: string[];
  aksiyonOwners?: string[];
  aksiyonProgressMin?: number;
  aksiyonProgressMax?: number;
}

// ===== Application User =====
export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  department: string;
  role: UserRole;
  locale: "tr" | "en";
  title?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Audit alanı (migration 028): kullanıcının en son başarılı login zamanı.
   *  Server-side public.touch_last_login() RPC tarafından NOW() ile set edilir;
   *  client clock'a bağlı değil. Null = hiç giriş yapmamış. */
  lastLoginAt?: string | null;
}

// ===== App Settings (key-value) =====
export interface AppSetting {
  key: string;
  value: unknown;
}

// ===== Backward compatibility aliases =====
/** @deprecated Use Aksiyon instead */
export type Gorev = Aksiyon;
/** @deprecated Proje seviyesi kaldırıldı */
export type Proje = Proje;

// ===== Legacy types (used by existing mock-data files) =====

export interface Project {
  id: string;
  name: string;
  department: string;
  status: ProjectStatus;
  progress: number;
  owner: string;
  deadline: string;
  description?: string;
  priority?: Priority;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  assigneeInitials: string;
  deadline?: string;
  progress?: number;
  tags?: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

export interface TreeNode {
  id: string;
  name: string;
  type: "plan" | "proje" | "aksiyon" | "proje" | "gorev";
  progress?: number;
  status?: string;
  children?: TreeNode[];
}

export interface GanttTask {
  id: number;
  text: string;
  start: Date;
  end: Date;
  progress: number;
  type?: string;
  parent?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  color: string;
}

export interface ChartDataPoint {
  month: string;
  budget: number;
  spend: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface SearchItem {
  id: string;
  name: string;
  sub: string;
  category: "objectives" | "actions" | "users" | "pages";
}
