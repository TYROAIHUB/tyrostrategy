import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Adapter'ın PATCH gövdesi sözleşmesi.
 *
 * Regresyon: form temizlenen alanı `undefined` gönderiyordu, `projeToDb`'nin
 * `!== undefined` guard'ı da onu gövdeden düşürüyordu. Sonuç, PATCH gövdesinin
 * BOŞ olması — alan ekranda temizlenmiş görünüp veritabanında eski değeriyle
 * kalıyor ve ilk yenilemede geri geliyordu. Sözleşme artık net:
 *   • `undefined` → alan gövdeye GİRMEZ  ("dokunma")
 *   • `null`      → alan gövdeye NULL girer ("temizle")
 */

const captured: Record<string, unknown>[] = [];

vi.mock("@/lib/supabase", () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    for (const m of ["eq", "select", "insert", "delete", "in", "order", "limit"]) {
      chain[m] = () => chain;
    }
    chain.update = (payload: Record<string, unknown>) => { captured.push(payload); return chain; };
    chain.single = () => Promise.resolve({ data: { id: "P26-0002" }, error: null });
    chain.then = (r: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(r);
    chain.catch = () => chain;
    return chain;
  };
  return {
    supabase: { from: () => makeChain() },
    isSupabaseConfigured: true,
    setSupabaseUserContext: () => {},
    getSupabaseUserContext: () => null,
  };
});

async function patchBodyFor(data: unknown): Promise<Record<string, unknown>> {
  const { supabaseAdapter } = await import("@/lib/data/supabaseAdapter");
  captured.length = 0;
  await supabaseAdapter.updateProje("P26-0002", data as never);
  return captured[0] ?? {};
}

describe("supabaseAdapter.updateProje — PATCH gövdesi", () => {
  beforeEach(() => { captured.length = 0; });

  it("girilen yatırım değerlerini gövdeye koyuyor", async () => {
    const body = await patchBodyFor({
      locationId: "loc-1", capexUsd: 1000, assetClass: "AST-PROC", actionType: "ACT-NEW",
    });
    expect(body).toMatchObject({
      location_id: "loc-1", capex_usd: 1000, asset_class: "AST-PROC", action_type: "ACT-NEW",
    });
  });

  it("REGRESYON: null gönderilen alanlar gövdeye NULL olarak giriyor", async () => {
    const body = await patchBodyFor({
      locationId: null, capexUsd: null, assetClass: null, actionType: null, parentObjectiveId: null,
    });
    expect(body.location_id).toBeNull();
    expect(body.capex_usd).toBeNull();
    expect(body.asset_class).toBeNull();
    expect(body.action_type).toBeNull();
    expect(body.parent_proje_id).toBeNull();
  });

  it("undefined alan gövdeye hiç girmiyor — 'dokunma' anlamı korunuyor", async () => {
    const body = await patchBodyFor({ progress: 50, locationId: undefined, capexUsd: undefined });
    expect(body.progress).toBe(50);
    expect("location_id" in body).toBe(false);
    expect("capex_usd" in body).toBe(false);
  });

  it("CAPEX 0 geçerli tutar — düşürülmüyor", async () => {
    const body = await patchBodyFor({ capexUsd: 0 });
    expect(body.capex_usd).toBe(0);
  });

  it("boş string lokasyon UUID'si NULL'a çevriliyor (22P02 koruması)", async () => {
    // Form "seçim yok" durumunu "" ile temsil ediyor; "" bir UUID kolonuna
    // gönderilse Postgres 22P02 (invalid input syntax for uuid) döner.
    const body = await patchBodyFor({ locationId: "" });
    expect(body.location_id).toBeNull();
  });
});
