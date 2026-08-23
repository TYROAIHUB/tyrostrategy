/**
 * Tüm veritabanının salt-okunur yedeği.
 *
 *   node scripts/db-backup.cjs            → dbbackup/<UTC-zaman>/ altına yazar
 *   node scripts/db-backup.cjs --out DIR  → hedef klasörü değiştirir
 *
 * PostgREST üzerinden gider (smoke testiyle aynı publishable key + Admin
 * X-User-Email context'i), yani RLS'in Admin'e gösterdiği her satır alınır.
 * SADECE GET yapar — hiçbir şey yazmaz, silmez.
 *
 * Tablo listesi elle yazılmıyor: PostgREST'in OpenAPI tanımından okunuyor,
 * böylece sonradan eklenen tablolar da kendiliğinden yedeğe giriyor.
 *
 * Çıktı:
 *   dbbackup/<zaman>/<tablo>.json   — satır dizisi, olduğu gibi
 *   dbbackup/<zaman>/manifest.json  — tablo başına satır sayısı + özet
 *
 * NOT: Çıktı klasörü .gitignore'da. Yedek repoya gitmez.
 */
const fs = require("fs");
const path = require("path");

const URL = "https://edexisfpfksekeefmxwf.supabase.co/rest/v1";
const APIKEY = "sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19";
const ADMIN_EMAIL = "cenk.sayli@tiryaki.com.tr";
const PAGE_SIZE = 1000; // PostgREST'in varsayılan üst sınırı

const headers = {
  apikey: APIKEY,
  Authorization: `Bearer ${APIKEY}`,
  "X-User-Email": ADMIN_EMAIL,
  Accept: "application/json",
};

function outDir() {
  const i = process.argv.indexOf("--out");
  if (i !== -1 && process.argv[i + 1]) return path.resolve(process.argv[i + 1]);
  // Dosya adında ':' olmasın (macOS Finder ve Windows sevmiyor)
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
  return path.join(__dirname, "..", "dbbackup", stamp);
}

/**
 * Tablo listesi: migration dosyalarındaki CREATE TABLE ifadelerinden türetilir.
 *
 * PostgREST'in OpenAPI kökü (`GET /rest/v1/`) tablo listesini verebilirdi ama
 * secret API key istiyor; elimizde yalnızca publishable key var. Migration'lar
 * append-only olduğu için bu liste de kendiliğinden güncel kalıyor: yeni bir
 * tablo eklendiğinde yedeğe de girer, elle bakım gerekmez.
 */
function listTables() {
  const dir = path.join(__dirname, "..", "supabase", "migrations");
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_0-9]+)/gi;
  const found = new Set();
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
    const sql = fs.readFileSync(path.join(dir, f), "utf-8");
    for (const m of sql.matchAll(re)) found.add(m[1].toLowerCase());
  }
  // `CREATE TABLE x AS SELECT ...` kalıbı regex'e "as"i tablo adı gibi
  // gösteriyor; SQL anahtar sözcüklerini ayıklıyoruz.
  const KEYWORDS = new Set(["as", "if", "not", "exists", "select", "public"]);
  return [...found].filter((t) => !KEYWORDS.has(t)).sort();
}

/** Bir tablonun TÜM satırlarını sayfalayarak çeker. */
async function fetchAll(table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await fetch(`${URL}/${table}?select=*&limit=${PAGE_SIZE}&offset=${offset}`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

(async () => {
  const dir = outDir();
  fs.mkdirSync(dir, { recursive: true });
  console.log(`📦 Yedek klasörü: ${dir}\n`);

  const tables = listTables();
  console.log(`${tables.length} tablo/view bulundu\n`);

  const manifest = {
    takenAt: new Date().toISOString(),
    source: URL,
    identity: ADMIN_EMAIL,
    note: "PostgREST üzerinden salt-okunur yedek; RLS'in Admin'e gösterdiği satırlar.",
    tables: {},
  };
  let total = 0;
  const failures = [];
  const empties = [];

  for (const table of tables) {
    process.stdout.write(`  ${table.padEnd(34)} `);
    try {
      const rows = await fetchAll(table);
      fs.writeFileSync(path.join(dir, `${table}.json`), JSON.stringify(rows, null, 2), "utf-8");
      manifest.tables[table] = rows.length;
      total += rows.length;
      // 0 satır iki şey olabilir: tablo gerçekten boş, YA DA tabloda SELECT
      // politikası yok ve RLS sessizce boş döndürüyor (HTTP 200!). İkisini
      // publishable key ile ayırt etmek imkânsız, bu yüzden işaretliyoruz —
      // yoksa "yedek alındı" sanıp aslında hiçbir şey almamış oluruz.
      if (rows.length === 0) {
        empties.push(table);
        console.log(`✓ 0 satır  ⚠ boş — tablo gerçekten boş olabilir ya da RLS engelliyor olabilir`);
      } else {
        console.log(`✓ ${rows.length} satır`);
      }
    } catch (e) {
      manifest.tables[table] = { error: e.message };
      failures.push(`${table}: ${e.message}`);
      console.log(`✗ ${e.message}`);
    }
  }

  manifest.totalRows = total;
  manifest.failed = failures;
  manifest.emptyTables = empties;
  manifest.scope =
    "PostgREST + RLS kapsamı: Admin rolünün API üzerinden OKUYABİLDİĞİ satırlar. " +
    "SELECT politikası olmayan bir tablo HTTP 200 ile BOŞ döner — emptyTables " +
    "listesindeki tablolar bu yüzden şüpheli sayılmalı. Bayt düzeyinde tam yedek " +
    "için Supabase Dashboard yedeği ya da DB şifresiyle pg_dump gerekir.";
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`\n=== Özet ===`);
  console.log(`  Tablo : ${tables.length}`);
  console.log(`  Satır : ${total}`);
  console.log(`  Hata  : ${failures.length}`);
  if (empties.length) console.log(`  Boş   : ${empties.join(", ")}  (RLS engellemesi de olabilir)`);
  console.log(`\n  Kapsam: Admin'in API üzerinden okuyabildiği satırlar (RLS uygulanır).`);
  console.log(`          Bayt düzeyinde tam yedek için pg_dump / Dashboard yedeği gerekir.`);
  console.log(`\n${failures.length === 0 ? "✅" : "⚠"} Yedek: ${dir}`);
  // Erişilemeyen tablo yedeğin eksik olduğunu gösterir — sessizce geçmiyoruz.
  process.exit(failures.length === 0 ? 0 : 1);
})();
