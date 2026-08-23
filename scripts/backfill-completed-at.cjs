/**
 * Geri dolum: status='Achieved' ama completed_at NULL olan kayıtlara
 * tamamlanma tarihini `end_date`'ten yazar.
 *
 *   node scripts/backfill-completed-at.cjs            → KURU ÇALIŞTIRMA (yazmaz)
 *   node scripts/backfill-completed-at.cjs --apply    → gerçekten yazar
 *
 * NEDEN GEREKLİ
 * 2026-04-22 Excel yüklemesi (scripts/import-excel-data.cjs) `completed_at`
 * kolonunu hiç yazmıyordu; o gün yüklenen her kayıt, statüsü "Tamamlandı" olsa
 * bile NULL aldı. Ayrıca kod tamamlanma tarihini yalnızca GEÇİŞ anında
 * damgalıyordu, doğrudan Achieved oluşturulan kayıtta geçiş olmadığı için tarih
 * hiç oluşmuyordu (o kusur artık düzeltildi).
 *
 * NE YAZAR
 * `end_date` = planlanan bitiş tarihi. Gerçek tamamlanma tarihi bilinmiyor;
 * "bugün" yazmak aylar önce bitmiş bir işe yanlış tarih koymak olurdu.
 * Kullanıcı onayıyla planlanan bitiş tarihi vekil olarak kullanılıyor.
 *
 * GÜVENLİK
 * - Varsayılan KURU ÇALIŞTIRMA; yazmak için --apply şart.
 * - Her PATCH `status=eq.Achieved&completed_at=is.null` filtresini de taşıyor:
 *   idempotent, ikinci koşuş hiçbir şeye dokunmaz, dolu tarihi ezmez.
 * - Aynı end_date'e sahip kayıtlar tek çağrıda gruplanır (568 kayıt ≈ 200 çağrı).
 */
const URL = "https://edexisfpfksekeefmxwf.supabase.co/rest/v1";
const APIKEY = "sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19";
const ADMIN_EMAIL = "cenk.sayli@tiryaki.com.tr";
const APPLY = process.argv.includes("--apply");

const headers = {
  apikey: APIKEY,
  Authorization: `Bearer ${APIKEY}`,
  "X-User-Email": ADMIN_EMAIL,
  "Content-Type": "application/json",
};

/** end_date (2026-05-12) → completed_at damgası.
 *  Gün kayması olmasın diye UTC gece yarısı: Türkiye UTC+3, yani aynı gün 03:00. */
const stamp = (endDate) => `${endDate}T00:00:00+00:00`;

async function targets(table) {
  const res = await fetch(
    `${URL}/${table}?select=id,name,status,end_date&status=eq.Achieved&completed_at=is.null`,
    { headers }
  );
  if (!res.ok) throw new Error(`${table} okunamadı: ${res.status} ${await res.text()}`);
  return res.json();
}

async function patchGroup(table, endDate, ids) {
  const list = ids.map((i) => `"${i}"`).join(",");
  const res = await fetch(
    `${URL}/${table}?id=in.(${list})&status=eq.Achieved&completed_at=is.null`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ completed_at: stamp(endDate) }),
    }
  );
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).length;
}

(async () => {
  console.log(APPLY ? "⚠ UYGULAMA MODU — veritabanına yazılacak\n" : "🔍 KURU ÇALIŞTIRMA — hiçbir şey yazılmayacak\n");
  let grand = 0;

  for (const table of ["projeler", "aksiyonlar"]) {
    const rows = await targets(table);
    const eksikTarih = rows.filter((r) => !r.end_date);
    const islenecek = rows.filter((r) => r.end_date);

    console.log(`═══ ${table} ═══`);
    console.log(`  Achieved + completed_at NULL : ${rows.length}`);
    if (eksikTarih.length) console.log(`  ⚠ end_date'i de boş (atlanır)  : ${eksikTarih.length}`);

    const gruplar = new Map();
    for (const r of islenecek) {
      if (!gruplar.has(r.end_date)) gruplar.set(r.end_date, []);
      gruplar.get(r.end_date).push(r.id);
    }
    console.log(`  İşlenecek                    : ${islenecek.length}  (${gruplar.size} farklı tarih)`);
    console.log(`  Örnekler:`);
    for (const r of islenecek.slice(0, 5)) {
      console.log(`    ${r.id}  end_date=${r.end_date} → completed_at=${stamp(r.end_date)}  ${String(r.name).slice(0, 38)}`);
    }

    if (APPLY) {
      let yazilan = 0;
      for (const [endDate, ids] of gruplar) {
        yazilan += await patchGroup(table, endDate, ids);
        process.stdout.write(`\r  yazıldı: ${yazilan}/${islenecek.length}`);
      }
      console.log(`\n  ✓ ${yazilan} kayıt güncellendi`);
      const kalan = await targets(table);
      console.log(`  Doğrulama: kalan NULL = ${kalan.length}` + (kalan.length === eksikTarih.length ? "  ✓ (yalnızca end_date'i boş olanlar)" : "  ⚠ beklenenden fazla"));
      grand += yazilan;
    }
    console.log();
  }

  if (!APPLY) console.log("Uygulamak için: node scripts/backfill-completed-at.cjs --apply");
  else console.log(`✅ Toplam ${grand} kayıt güncellendi.`);
})();
