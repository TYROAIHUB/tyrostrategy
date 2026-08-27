/**
 * Aksiyon sorumlusunu projenin liderine eşitler.
 *
 *   node scripts/normalize-aksiyon-owner.cjs           → KURU ÇALIŞTIRMA
 *   node scripts/normalize-aksiyon-owner.cjs --apply   → gerçekten yazar
 *
 * NEDEN
 * Kurum kuralı: aksiyonun sorumlusu HER ZAMAN projenin lideridir. Uygulama
 * içinden oluşturulan aksiyonlar zaten proje liderini devralıyor; sapma
 * yalnızca 2026-04-22 Excel yüklemesinden gelen kayıtlarda var (Excel'de
 * aksiyon başına ayrı sorumlu yazıyordu).
 *
 * GERİ ALINABİLİRLİK
 * Yazmadan önce ESKİ değerleri `dbbackup/aksiyon-owner-onceki-<zaman>.json`
 * dosyasına döküyor. Geri almak isterseniz o dosyadaki id→owner çiftleri yeter.
 * Ayrıca `node scripts/db-backup.cjs` ile tam yedek alınması önerilir.
 *
 * İDEMPOTENT: her koşuşta güncel durumdan hesaplıyor; ikinci koşuşta
 * değiştirilecek kayıt kalmadığı için hiçbir şeye dokunmaz.
 */
const fs = require("fs");
const path = require("path");

const URL = "https://edexisfpfksekeefmxwf.supabase.co/rest/v1";
const K = "sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19";
const H = { apikey: K, Authorization: `Bearer ${K}`, "X-User-Email": "cenk.sayli@tiryaki.com.tr", "Content-Type": "application/json" };
const APPLY = process.argv.includes("--apply");

async function all(table, select) {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${URL}/${table}?select=${select}&limit=1000&offset=${off}`, { headers: H });
    if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

(async () => {
  console.log(APPLY ? "⚠ UYGULAMA MODU — veritabanına yazılacak\n" : "🔍 KURU ÇALIŞTIRMA — hiçbir şey yazılmayacak\n");
  const projeler = await all("projeler", "id,owner,name");
  const aksiyonlar = await all("aksiyonlar", "id,proje_id,owner,name");
  const lider = new Map(projeler.map((p) => [p.id, p.owner]));

  const hedef = aksiyonlar.filter((a) => lider.has(a.proje_id) && a.owner !== lider.get(a.proje_id));
  const gruplar = new Map(); // yeni sorumlu → id listesi
  for (const a of hedef) {
    const yeni = lider.get(a.proje_id);
    if (!gruplar.has(yeni)) gruplar.set(yeni, []);
    gruplar.get(yeni).push(a.id);
  }

  const projeSayisi = new Set(hedef.map((a) => a.proje_id)).size;
  console.log(`  Değişecek aksiyon : ${hedef.length}`);
  console.log(`  Etkilenen proje   : ${projeSayisi}`);
  console.log(`  Farklı yeni değer : ${gruplar.size}\n  Örnekler:`);
  for (const a of hedef.slice(0, 8)) {
    console.log(`    ${a.id}  ${a.proje_id}  ${a.owner}  →  ${lider.get(a.proje_id)}`);
  }

  if (!APPLY) {
    console.log("\nUygulamak için: node scripts/normalize-aksiyon-owner.cjs --apply");
    return;
  }
  if (hedef.length === 0) { console.log("\n✅ Değişecek kayıt yok."); return; }

  // Geri alınabilirlik: eski değerleri diske yaz
  const dir = path.join(__dirname, "..", "dbbackup");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
  const geriAl = path.join(dir, `aksiyon-owner-onceki-${stamp}.json`);
  fs.writeFileSync(geriAl, JSON.stringify(hedef.map((a) => ({ id: a.id, proje_id: a.proje_id, onceki_owner: a.owner })), null, 2), "utf-8");
  console.log(`\n  ↩ Eski değerler kaydedildi: ${geriAl}`);

  let yazilan = 0;
  for (const [yeni, ids] of gruplar) {
    for (let i = 0; i < ids.length; i += 100) {
      const dilim = ids.slice(i, i + 100);
      const res = await fetch(`${URL}/aksiyonlar?id=in.(${dilim.map((x) => `"${x}"`).join(",")})`, {
        method: "PATCH",
        headers: { ...H, Prefer: "return=representation" },
        body: JSON.stringify({ owner: yeni }),
      });
      if (!res.ok) throw new Error(`PATCH ${res.status} ${(await res.text()).slice(0, 200)}`);
      yazilan += (await res.json()).length;
      process.stdout.write(`\r  yazıldı: ${yazilan}/${hedef.length}`);
    }
  }
  console.log(`\n  ✓ ${yazilan} aksiyon güncellendi`);

  const kontrol = (await all("aksiyonlar", "id,proje_id,owner")).filter((a) => lider.has(a.proje_id) && a.owner !== lider.get(a.proje_id));
  console.log(`  Doğrulama: kalan sapma = ${kontrol.length}` + (kontrol.length === 0 ? "  ✓" : "  ⚠"));
})();
