import { describe, it, expect } from "vitest";
import type { TFunction } from "i18next";
import {
  ASSET_CLASS_CODES,
  ACTION_TYPE_CODES,
  getAssetClassOptions,
  getActionTypeOptions,
  assetClassLabel,
  actionTypeLabel,
  isAssetClass,
  isActionType,
} from "../projectTaxonomy";
import tr from "@/locales/tr.json";
import en from "@/locales/en.json";

// t() stub — key'i geri döndürür, böylece etiket çözümlemesini izleyebiliriz
const tKey = ((key: string) => key) as unknown as TFunction;

describe("taxonomy code lists", () => {
  it("matches the Investment Map dictionary — 6 asset classes, 5 action types", () => {
    expect(ASSET_CLASS_CODES).toHaveLength(6);
    expect(ACTION_TYPE_CODES).toHaveLength(5);
  });

  it("has no duplicate codes", () => {
    expect(new Set(ASSET_CLASS_CODES).size).toBe(ASSET_CLASS_CODES.length);
    expect(new Set(ACTION_TYPE_CODES).size).toBe(ACTION_TYPE_CODES.length);
  });

  it("uses the AST-/ACT- prefixes the DB CHECK constraint expects", () => {
    for (const c of ASSET_CLASS_CODES) expect(c).toMatch(/^AST-[A-Z]+$/);
    for (const c of ACTION_TYPE_CODES) expect(c).toMatch(/^ACT-[A-Z]+$/);
  });
});

describe("i18n coverage", () => {
  it("every asset class code has a TR and EN label", () => {
    for (const code of ASSET_CLASS_CODES) {
      expect(tr.assetClass[code as keyof typeof tr.assetClass], `tr ${code}`).toBeTruthy();
      expect(en.assetClass[code as keyof typeof en.assetClass], `en ${code}`).toBeTruthy();
    }
  });

  it("every action type code has a TR and EN label", () => {
    for (const code of ACTION_TYPE_CODES) {
      expect(tr.actionType[code as keyof typeof tr.actionType], `tr ${code}`).toBeTruthy();
      expect(en.actionType[code as keyof typeof en.actionType], `en ${code}`).toBeTruthy();
    }
  });

  it("has no stray locale entries without a matching code", () => {
    expect(Object.keys(tr.assetClass).sort()).toEqual([...ASSET_CLASS_CODES].sort());
    expect(Object.keys(tr.actionType).sort()).toEqual([...ACTION_TYPE_CODES].sort());
  });
});

describe("option builders", () => {
  it("returns one option per code, carrying both label and code", () => {
    const opts = getAssetClassOptions(tKey);
    expect(opts).toHaveLength(ASSET_CLASS_CODES.length);
    expect(opts[0]).toEqual({ key: "AST-PROC", code: "AST-PROC", label: "assetClass.AST-PROC" });
    expect(getActionTypeOptions(tKey)[0].code).toBe("ACT-NEW");
  });
});

describe("label resolvers", () => {
  it("resolves a known code through i18n", () => {
    expect(assetClassLabel("AST-PORT", tKey)).toBe("assetClass.AST-PORT");
    expect(actionTypeLabel("ACT-REL", tKey)).toBe("actionType.ACT-REL");
  });

  it("returns empty string when the field is unset (optional)", () => {
    expect(assetClassLabel(undefined, tKey)).toBe("");
    expect(assetClassLabel("", tKey)).toBe("");
    expect(actionTypeLabel(null, tKey)).toBe("");
  });

  it("passes unknown codes through instead of hiding bad data", () => {
    expect(assetClassLabel("AST-BILINMEYEN", tKey)).toBe("AST-BILINMEYEN");
    expect(actionTypeLabel("ACT-XYZ", tKey)).toBe("ACT-XYZ");
  });
});

describe("type guards", () => {
  it("accepts valid codes and rejects everything else", () => {
    expect(isAssetClass("AST-CIVIL")).toBe(true);
    expect(isAssetClass("ACT-NEW")).toBe(false);
    expect(isAssetClass(null)).toBe(false);
    expect(isActionType("ACT-SUS")).toBe(true);
    expect(isActionType("AST-PROC")).toBe(false);
    expect(isActionType(42)).toBe(false);
  });
});
