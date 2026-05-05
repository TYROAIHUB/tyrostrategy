/**
 * End-to-end CRUD smoke test — UI'dan yaparmış gibi tüm tabloları sırasıyla
 * test eder. RLS reddi, constraint, schema mismatch gibi sorunları yakalamak
 * için. Her revizyon öncesi `node scripts/smoke-test-crud.cjs` çalıştırılır.
 *
 * Test cycle:
 *   1. Dummy proje oluştur
 *   2. Dummy aksiyon oluştur (parent: dummy proje)
 *   3. Dummy user oluştur
 *   4. Dummy tag oluştur
 *   5. Hepsini update et
 *   6. Hepsini delete et (reverse order)
 *
 * Tüm operasyonlar Cenk Admin context'iyle yapılır (X-User-Email header).
 * Herhangi bir step fail olursa exit code 1 + hata detayı.
 */
const URL = "https://edexisfpfksekeefmxwf.supabase.co/rest/v1";
const APIKEY = "sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19";
const ADMIN_EMAIL = "cenk.sayli@tiryaki.com.tr";

const headers = {
  apikey: APIKEY,
  Authorization: `Bearer ${APIKEY}`,
  "Content-Type": "application/json",
  "X-User-Email": ADMIN_EMAIL,
  Prefer: "return=representation",
};

let passed = 0;
let failed = 0;

async function step(name, fn) {
  process.stdout.write(`  ${name.padEnd(40)} `);
  try {
    const result = await fn();
    console.log(`✓ ${result ?? "OK"}`);
    passed++;
    return true;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    failed++;
    return false;
  }
}

async function api(method, path, body) {
  const res = await fetch(URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      detail = JSON.parse(text).message || text;
    } catch { /* not json */ }
    throw new Error(`${res.status} ${detail}`);
  }
  return text ? JSON.parse(text) : null;
}

(async () => {
  console.log("\n=== TYRO Strategy CRUD Smoke Test ===");
  console.log(`Endpoint: ${URL}`);
  console.log(`Acting as: ${ADMIN_EMAIL} (Admin)\n`);

  const PROJE_ID = "P26-9991";
  const AKSIYON_ID = "A26-9991";
  const TEST_EMAIL = "smoke.test.delete.me@tiryaki.com.tr";
  let tagId = null;

  // ── Pre-cleanup (önceki çalıştırmadan kalan varsa) ──
  console.log("Pre-cleanup:");
  await step("delete pre-existing test aksiyon", async () => {
    await api("DELETE", `/aksiyonlar?id=eq.${AKSIYON_ID}`);
    return "204";
  });
  await step("delete pre-existing test proje", async () => {
    await api("DELETE", `/projeler?id=eq.${PROJE_ID}`);
    return "204";
  });
  await step("delete pre-existing test user", async () => {
    await api("DELETE", `/users?email=eq.${TEST_EMAIL}`);
    return "204";
  });
  await step("delete pre-existing test tag", async () => {
    await api("DELETE", `/tag_definitions?name=eq.SMOKE_TEST_TAG`);
    return "204";
  });

  // ── CREATE ──
  console.log("\nCREATE:");
  await step("INSERT proje", async () => {
    const r = await api("POST", "/projeler", {
      id: PROJE_ID,
      name: "SMOKE_TEST_DELETE_ME",
      source: "Türkiye",
      status: "Not Started",
      owner: "Cenk Şayli",
      department: "Stratejik Planlama",
      progress: 0,
      start_date: "2026-05-04",
      end_date: "2026-05-05",
    });
    return `id=${r[0].id}`;
  });

  await step("INSERT aksiyon (parent: proje)", async () => {
    const r = await api("POST", "/aksiyonlar", {
      id: AKSIYON_ID,
      proje_id: PROJE_ID,
      name: "SMOKE_TEST_DELETE_ME",
      owner: "Cenk Şayli",
      progress: 0,
      status: "Not Started",
      start_date: "2026-05-04",
      end_date: "2026-05-05",
      sort_order: 9991,
    });
    return `id=${r[0].id}`;
  });

  await step("INSERT user", async () => {
    const r = await api("POST", "/users", {
      email: TEST_EMAIL,
      display_name: "SMOKE_TEST_DELETE_ME",
      role: "Proje Lideri",
      department: "BT",
      locale: "tr",
      is_active: true,
    });
    return `id=${r[0].id}`;
  });

  await step("INSERT tag", async () => {
    const r = await api("POST", "/tag_definitions", {
      name: "SMOKE_TEST_TAG",
      color: "#10b981",
    });
    tagId = r[0].id;
    return `id=${tagId}`;
  });

  // ── READ ──
  console.log("\nREAD:");
  await step("SELECT proje", async () => {
    const r = await api("GET", `/projeler?id=eq.${PROJE_ID}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `name=${r[0].name}`;
  });
  await step("SELECT aksiyon", async () => {
    const r = await api("GET", `/aksiyonlar?id=eq.${AKSIYON_ID}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `progress=${r[0].progress}`;
  });
  await step("SELECT user", async () => {
    const r = await api("GET", `/users?email=eq.${TEST_EMAIL}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `role=${r[0].role}`;
  });
  await step("SELECT tag", async () => {
    const r = await api("GET", `/tag_definitions?id=eq.${tagId}&select=*`);
    if (r.length !== 1) throw new Error(`expected 1 row, got ${r.length}`);
    return `color=${r[0].color}`;
  });

  // ── UPDATE ──
  console.log("\nUPDATE:");
  await step("UPDATE proje (description, progress, status)", async () => {
    const r = await api("PATCH", `/projeler?id=eq.${PROJE_ID}`, {
      description: "smoke test description",
      progress: 50,
      status: "On Track",
    });
    return `progress=${r[0].progress}`;
  });
  await step("UPDATE aksiyon (progress, status)", async () => {
    const r = await api("PATCH", `/aksiyonlar?id=eq.${AKSIYON_ID}`, {
      progress: 75,
      status: "On Track",
    });
    return `progress=${r[0].progress}`;
  });
  await step("UPDATE user (role: Proje Lideri → Admin)", async () => {
    const r = await api("PATCH", `/users?email=eq.${TEST_EMAIL}`, {
      role: "Admin",
    });
    return `role=${r[0].role}`;
  });
  await step("UPDATE tag (color)", async () => {
    const r = await api("PATCH", `/tag_definitions?id=eq.${tagId}`, {
      color: "#3b82f6",
    });
    return `color=${r[0].color}`;
  });

  // ── DELETE (reverse order — FK constraints) ──
  console.log("\nDELETE:");
  await step("DELETE aksiyon", async () => {
    await api("DELETE", `/aksiyonlar?id=eq.${AKSIYON_ID}`);
    return "204";
  });
  await step("DELETE proje", async () => {
    await api("DELETE", `/projeler?id=eq.${PROJE_ID}`);
    return "204";
  });
  await step("DELETE user", async () => {
    await api("DELETE", `/users?email=eq.${TEST_EMAIL}`);
    return "204";
  });
  await step("DELETE tag", async () => {
    await api("DELETE", `/tag_definitions?id=eq.${tagId}`);
    return "204";
  });

  // ── Verify cleanup ──
  console.log("\nVERIFY CLEANUP:");
  await step("proje gone", async () => {
    const r = await api("GET", `/projeler?id=eq.${PROJE_ID}&select=id`);
    if (r.length !== 0) throw new Error(`still exists: ${JSON.stringify(r)}`);
    return "0 rows";
  });
  await step("user gone", async () => {
    const r = await api("GET", `/users?email=eq.${TEST_EMAIL}&select=id`);
    if (r.length !== 0) throw new Error(`still exists: ${JSON.stringify(r)}`);
    return "0 rows";
  });

  // ── Summary ──
  console.log("\n=== Summary ===");
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (failed > 0) {
    console.log("\n❌ SMOKE TEST FAILED — revizyona devam etme!");
    process.exit(1);
  } else {
    console.log("\n✅ All CRUD operations OK — revizyon sonrası deploy güvenli.");
  }
})().catch((e) => {
  console.error("\n💥 Smoke test crashed:", e.message);
  process.exit(2);
});
