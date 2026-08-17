import type { TFunction } from "i18next";
import type { AssetClass, ProjectActionType } from "@/types";

/**
 * Yatırım portföyü kategorizasyon sözlüğü.
 *
 * Değerler InvestmentMap kavramsal tasarım dokümanındaki "Kategorizasyon
 * sözlüğü" bölümünden birebir alındı. İki eksen BİRBİRİNDEN BAĞIMSIZ:
 * Asset Class yatırımın fiziksel varlık türünü, Action Type yatırımın
 * niteliğini tanımlar — bir proje hem "yeni yapım" hem "üretim tesisi"
 * olabilir.
 *
 * Kodlar tek kaynak: DB'de migration 033 CHECK constraint'i aynı listeyi
 * tutuyor. Buraya yeni bir kod eklerken migration da güncellenmeli, yoksa
 * INSERT 23514 ile döner.
 *
 * Etiketler i18n'de: `assetClass.<KOD>` / `actionType.<KOD>`.
 */

export const ASSET_CLASS_CODES = [
  "AST-PROC",
  "AST-PORT",
  "AST-STOR",
  "AST-ADMIN",
  "AST-UTIL",
  "AST-CIVIL",
] as const satisfies readonly AssetClass[];

export const ACTION_TYPE_CODES = [
  "ACT-NEW",
  "ACT-EXP",
  "ACT-UPG",
  "ACT-SUS",
  "ACT-REL",
] as const satisfies readonly ProjectActionType[];

export interface TaxonomyOption<T extends string> {
  key: T;
  /** Aktif dildeki tam ad — "Üretim ve İşleme Tesisleri" */
  label: string;
  /** Kısa kod — dar tablolarda gösterilir, tooltip'te tam ad verilir */
  code: T;
}

export function getAssetClassOptions(t: TFunction): TaxonomyOption<AssetClass>[] {
  return ASSET_CLASS_CODES.map((code) => ({
    key: code,
    code,
    label: t(`assetClass.${code}` as "assetClass.AST-PROC"),
  }));
}

export function getActionTypeOptions(t: TFunction): TaxonomyOption<ProjectActionType>[] {
  return ACTION_TYPE_CODES.map((code) => ({
    key: code,
    code,
    label: t(`actionType.${code}` as "actionType.ACT-NEW"),
  }));
}

/** Kod → aktif dildeki tam ad. Kod yoksa/bilinmiyorsa boş string. */
export function assetClassLabel(code: string | undefined | null, t: TFunction): string {
  if (!code) return "";
  if (!(ASSET_CLASS_CODES as readonly string[]).includes(code)) return code;
  return t(`assetClass.${code}` as "assetClass.AST-PROC");
}

/** Kod → aktif dildeki tam ad. Kod yoksa/bilinmiyorsa boş string. */
export function actionTypeLabel(code: string | undefined | null, t: TFunction): string {
  if (!code) return "";
  if (!(ACTION_TYPE_CODES as readonly string[]).includes(code)) return code;
  return t(`actionType.${code}` as "actionType.ACT-NEW");
}

/** Bir kodun sabit listede olup olmadığını doğrular (DB CHECK'i ile aynı küme). */
export function isAssetClass(v: unknown): v is AssetClass {
  return typeof v === "string" && (ASSET_CLASS_CODES as readonly string[]).includes(v);
}

export function isActionType(v: unknown): v is ProjectActionType {
  return typeof v === "string" && (ACTION_TYPE_CODES as readonly string[]).includes(v);
}
