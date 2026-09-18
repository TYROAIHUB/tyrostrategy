/**
 * Investment Map Excel yüklemesi — SADECE üç alan.
 *
 *   node scripts/load-investment-map.cjs             → KURU ÇALIŞTIRMA
 *   node scripts/load-investment-map.cjs --apply     → gerçekten yazar
 *   node scripts/load-investment-map.cjs --file X    → başka bir Excel
 *
 * Kullanıcı kararı (2026-09-18): Excel'deki lokasyon, varlık sınıfı ve yatırım
 * tipi değerleri projelere yazılacak. SADECE bu üç alan — proje adı, lideri ve
 * DURUMU Excel'de bulunsa bile DOKUNULMAZ. (Excel'in "Durum" kolonu bilerek
 * yok sayılıyor; statü uygulamada aksiyonlardan türetiliyor.)
 *
 * AKIŞ
 *   1. "Şehir, Ülke" metnini ayrıştır, benzersiz lokasyonları çıkar.
 *   2. `locations` tablosunda olmayanları oluştur (büyük-küçük harf ve Türkçe
 *      karakter toleranslı karşılaştırma — tablodaki tekil indeks de öyle).
 *   3. Her projeye location_id + asset_class + action_type yaz.
 *
 * GÜVENLİK
 *   • Varsayılan KURU ÇALIŞTIRMA; yazmak için --apply şart.
 *   • Taksonomi kodları CHECK kısıtına karşı önceden doğrulanır.
 *   • Eşleşmeyen Project Code varsa yazma yapılmaz, liste basılır.
 *   • Yazmadan önce eski değerler dbbackup/investment-map-onceki-<zaman>.json
 *     dosyasına dökülür (geri alınabilirlik).
 *   • İdempotent: her koşuşta güncel durumdan hesaplanır; ikinci koşuşta
 *     değişecek kayıt kalmaz.
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const URL = "https://edexisfpfksekeefmxwf.supabase.co/rest/v1";
const K = "sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19";
const H = { apikey: K, Authorization: `Bearer ${K}`, "X-User-Email": "cenk.sayli@tiryaki.com.tr", "Content-Type": "application/json" };

const APPLY = process.argv.includes("--apply");
const fileArg = process.argv.indexOf("--file");
const EXCEL = fileArg !== -1 && process.argv[fileArg + 1]
  ? process.argv[fileArg + 1]
  : "/Users/cenk/Downloads/Yatırım Projeleri Listesi_ Investment_Map.xlsx";
const SHEET = "Yatırım Projeleri Listesi";

const ASSET_CODES = new Set(["AST-PROC", "AST-PORT", "AST-STOR", "AST-ADMIN", "AST-UTIL", "AST-CIVIL"]);
const ACTION_CODES = new Set(["ACT-NEW", "ACT-EXP", "ACT-UPG", "ACT-SUS", "ACT-REL"]);

/** Türkçe karakterleri katlayan karşılaştırma anahtarı — locations tablosundaki
 *  tekil indeks de lower(btrim(...)) yaptığı için eşdeğer davranıyor. */
const norm = (s) =>
  String(s || "").toLowerCase()
    .replace(/i̇/g, "i").replace(/[ıİ]/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
    .replace(/[öÖ]/g, "o").replace(/[üÜ]/g, "u").replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]/g, "");
const locKey = (country, city) => `${norm(country)}|${norm(city)}`;

async function api(pathAndQuery, init) {
  const res = await fetch(`${URL}/${pathAndQuery}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${init?.method || "GET"} ${pathAndQuery} → ${res.status} ${(await res.text()).slice(0, 250)}`);
  return res.json();
}
async function all(table, select) {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const page = await api(`${table}?select=${select}&limit=1000&offset=${off}`);
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

(async () => {
  console.log(APPLY ? "⚠ UYGULAMA MODU — veritabanına yazılacak\n" : "🔍 KURU ÇALIŞTIRMA — hiçbir şey yazılmayacak\n");
  console.log(`  Excel: ${EXCEL}`);

  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(EXCEL).Sheets[SHEET], { defval: "" });
  console.log(`  Excel satırı: ${rows.length}\n`);

  // ── Ayrıştır + doğrula ───────────────────────────────────────────────
  const hatalar = [];
  const parsed = rows.map((r, i) => {
    const satir = i + 2; // başlık satırı 1
    const id = String(r["Project Code"]).trim();
    const assetClass = String(r["Asset Class"]).trim().toUpperCase();
    const actionType = String(r["Project Action Type"]).trim().toUpperCase();
    const raw = String(r["Lokasyon"]).trim();
    const virgul = raw.lastIndexOf(",");
    const city = virgul === -1 ? raw : raw.slice(0, virgul).trim();
    const country = virgul === -1 ? "" : raw.slice(virgul + 1).trim();

    if (!id) hatalar.push(`satır ${satir}: Project Code boş`);
    if (!ASSET_CODES.has(assetClass)) hatalar.push(`satır ${satir} (${id}): geçersiz Asset Class "${assetClass}"`);
    if (!ACTION_CODES.has(actionType)) hatalar.push(`satır ${satir} (${id}): geçersiz Action Type "${actionType}"`);
    if (!country || !city) hatalar.push(`satır ${satir} (${id}): lokasyon "Şehir, Ülke" biçiminde değil → "${raw}"`);
    return { satir, id, assetClass, actionType, country, city, raw };
  });

  const projeler = new Map((await all("projeler", "id,name,location_id,asset_class,action_type")).map((p) => [p.id, p]));
  for (const p of parsed) {
    if (p.id && !projeler.has(p.id)) hatalar.push(`satır ${p.satir}: ${p.id} veritabanında YOK`);
  }
  if (hatalar.length) {
    console.log(`❌ ${hatalar.length} doğrulama hatası — hiçbir şey yazılmadı:`);
    hatalar.forEach((h) => console.log(`   ${h}`));
    process.exit(1);
  }
  console.log("  ✓ Doğrulama geçti: tüm kodlar geçerli, tüm projeler bulundu\n");

  // ── Lokasyonlar ──────────────────────────────────────────────────────
  const mevcut = new Map((await all("locations", "id,country,city")).map((l) => [locKey(l.country, l.city), l]));
  const gerekli = new Map();
  for (const p of parsed) {
    const k = locKey(p.country, p.city);
    if (!gerekli.has(k)) gerekli.set(k, { country: p.country, city: p.city, projeler: [] });
    gerekli.get(k).projeler.push(p.id);
  }
  const acilacak = [...gerekli.entries()].filter(([k]) => !mevcut.has(k));
  console.log(`═══ LOKASYONLAR ═══`);
  console.log(`  Excel'de benzersiz : ${gerekli.size}`);
  console.log(`  Zaten tanımlı      : ${gerekli.size - acilacak.length}`);
  console.log(`  Yeni açılacak      : ${acilacak.length}`);
  for (const [, v] of acilacak) console.log(`     + ${v.country} / ${v.city}   (${v.projeler.length} proje)`);

  if (APPLY && acilacak.length) {
    const created = await api("locations", {
      method: "POST",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify(acilacak.map(([, v]) => ({ country: v.country, city: v.city }))),
    });
    for (const l of created) mevcut.set(locKey(l.country, l.city), l);
    console.log(`  ✓ ${created.length} lokasyon oluşturuldu`);
  } else if (!APPLY) {
    // Kuru çalıştırma da GERÇEKÇİ olmalı: lokasyonlar henüz açılmadığı için
    // `hedefLocId` boş kalıyor ve önizleme lokasyon farkını hiç göstermiyordu
    // (17 diyordu, uygulamada 22 olacaktı). Açılacak lokasyonlara geçici bir
    // kimlik verip farkı gerçek akışla aynı şekilde hesaplıyoruz.
    for (const [k, v] of acilacak) {
      mevcut.set(k, { id: `(yeni: ${v.country}/${v.city})`, country: v.country, city: v.city });
    }
  }

  // ── Projeler: SADECE üç alan ─────────────────────────────────────────
  const degisecek = [];
  for (const p of parsed) {
    const db = projeler.get(p.id);
    const loc = mevcut.get(locKey(p.country, p.city));
    const hedefLocId = loc ? loc.id : null;
    const fark = [];
    if (hedefLocId && db.location_id !== hedefLocId) fark.push("lokasyon");
    if (db.asset_class !== p.assetClass) fark.push(`varlık sınıfı ${db.asset_class || "—"}→${p.assetClass}`);
    if (db.action_type !== p.actionType) fark.push(`yatırım tipi ${db.action_type || "—"}→${p.actionType}`);
    if (fark.length) degisecek.push({ ...p, db, hedefLocId, fark });
  }

  console.log(`\n═══ PROJELER — sadece location_id + asset_class + action_type ═══`);
  console.log(`  Değişecek: ${degisecek.length} / ${parsed.length}`);
  for (const d of degisecek) {
    console.log(`     ${d.id}  ${d.fark.join(" | ")}   ${d.raw}`);
  }
  const ezilen = degisecek.filter((d) => d.fark.some((f) => /→/.test(f) && !/—→/.test(f)));
  if (ezilen.length) {
    console.log(`\n  ⚠ MEVCUT DEĞERİN ÜZERİNE YAZILACAK (${ezilen.length}):`);
    ezilen.forEach((d) => console.log(`     ${d.id}: ${d.fark.filter((f) => /→/.test(f) && !/—→/.test(f)).join(", ")}`));
  }

  if (!APPLY) {
    console.log(`\nUygulamak için: node scripts/load-investment-map.cjs --apply`);
    return;
  }
  if (!degisecek.length) { console.log("\n✅ Değişecek kayıt yok."); return; }

  // Geri alınabilirlik
  const dir = path.join(__dirname, "..", "dbbackup");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
  const geriAl = path.join(dir, `investment-map-onceki-${stamp}.json`);
  fs.writeFileSync(geriAl, JSON.stringify(degisecek.map((d) => ({
    id: d.id,
    onceki: { location_id: d.db.location_id, asset_class: d.db.asset_class, action_type: d.db.action_type },
    yeni: { location_id: d.hedefLocId, asset_class: d.assetClass, action_type: d.actionType },
  })), null, 2), "utf-8");
  console.log(`\n  ↩ Eski değerler kaydedildi: ${geriAl}`);

  let yazilan = 0;
  for (const d of degisecek) {
    await api(`projeler?id=eq.${d.id}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=representation" },
      // SADECE üç alan gönderiliyor — başka hiçbir kolona dokunulmuyor.
      body: JSON.stringify({ location_id: d.hedefLocId, asset_class: d.assetClass, action_type: d.actionType }),
    });
    yazilan++;
    process.stdout.write(`\r  yazıldı: ${yazilan}/${degisecek.length}`);
  }
  console.log(`\n  ✓ ${yazilan} proje güncellendi`);

  // Doğrulama
  const son = new Map((await all("projeler", "id,location_id,asset_class,action_type")).map((p) => [p.id, p]));
  const locById = new Map([...mevcut.values()].map((l) => [l.id, l]));
  let uyumsuz = 0;
  for (const p of parsed) {
    const db = son.get(p.id);
    const beklenen = mevcut.get(locKey(p.country, p.city));
    if (db.asset_class !== p.assetClass || db.action_type !== p.actionType ||
        (beklenen && db.location_id !== beklenen.id)) {
      uyumsuz++;
      console.log(`   ⚠ ${p.id} beklenenle uyuşmuyor: ${db.asset_class}/${db.action_type}/${locById.get(db.location_id)?.city ?? "—"}`);
    }
  }
  console.log(`  Doğrulama: ${parsed.length - uyumsuz}/${parsed.length} proje beklenen değerlerde` + (uyumsuz === 0 ? "  ✓" : "  ⚠"));
  process.exit(uyumsuz === 0 ? 0 : 1);
})();
