/**
 * Haftalık statü tazeleme — anasayfadaki "Verileri yenile" butonunun
 * sunucu tarafı ikizi.
 *
 *   npx tsx scripts/refresh-statuses.ts            → KURU ÇALIŞTIRMA
 *   npx tsx scripts/refresh-statuses.ts --apply    → gerçekten yazar
 *
 * NEDEN VAR
 * Aksiyon ve proje statüleri TAKVİME bağlı: bir aksiyon ilerlemesi
 * güncellenmese bile gün geçtikçe beklenen ilerlemenin gerisine düşer ve
 * statüsü değişmesi gerekir. Kimse butona basmazsa bu bayatlar. Bu script
 * her pazartesi 08:00'de (.github/workflows/weekly-status-refresh.yml)
 * kendiliğinden çalışıp aynı hesabı yapar.
 *
 * TEK KAYNAK
 * Formülün kendisi src/lib/statusRules.ts'te ve uygulama da (dataStore'daki
 * `refreshDerivedStatuses`) TAM OLARAK aynı fonksiyonu çağırıyor. Kural SQL'e
 * ya da buraya kopyalanmadı; kopyalansaydı biri değişip diğeri unutulduğunda
 * zamanlanmış iş uygulamayla kavga ederdi.
 *
 * Eşikler `app_settings` tablosundan okunur (behind_threshold / atrisk_threshold)
 * — Ayarlar ekranından değiştirildiğinde bu iş de otomatik olarak yeni eşiklere
 * göre çalışır.
 */
import { planStatusRefresh, type AksiyonShape, type ProjeShape, type StatusThresholds } from "../src/lib/statusRules";

const URL = "https://edexisfpfksekeefmxwf.supabase.co/rest/v1";
const KEY = "sb_publishable_D2Dl6nNjsOUBOwm_WdX5DQ_IsfJ-v19";
const ADMIN_EMAIL = "cenk.sayli@tiryaki.com.tr";
const APPLY = process.argv.includes("--apply");

const H: Record<string, string> = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "X-User-Email": ADMIN_EMAIL,
  "Content-Type": "application/json",
};

const DEFAULT_THRESHOLDS: StatusThresholds = { behindThreshold: 15, atRiskThreshold: 5 };

async function api<T>(q: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${URL}/${q}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${q} → ${res.status} ${(await res.text()).slice(0, 250)}`);
  return res.json() as Promise<T>;
}

async function all<T>(table: string, select: string): Promise<T[]> {
  const out: T[] = [];
  for (let off = 0; ; off += 1000) {
    const page = await api<T[]>(`${table}?select=${select}&limit=1000&offset=${off}`);
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

interface DbAksiyon { id: string; proje_id: string; name: string; status: string; progress: number; start_date: string; end_date: string; completed_at: string | null; }
interface DbProje { id: string; name: string; status: string; progress: number; completed_at: string | null; }
interface DbSetting { key: string; value: unknown; }

/** app_settings'ten eşikleri oku; satır yoksa uygulamanın varsayılanına düş. */
async function thresholds(): Promise<StatusThresholds> {
  const rows = await all<DbSetting>("app_settings", "key,value");
  const oku = (k: string, fallback: number) => {
    const row = rows.find((r) => r.key === k);
    const n = Number(row?.value);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    behindThreshold: oku("behind_threshold", DEFAULT_THRESHOLDS.behindThreshold),
    atRiskThreshold: oku("atrisk_threshold", DEFAULT_THRESHOLDS.atRiskThreshold),
  };
}

async function main(): Promise<void> {
  console.log(APPLY ? "⚠ UYGULAMA MODU — veritabanına yazılacak\n" : "🔍 KURU ÇALIŞTIRMA — hiçbir şey yazılmayacak\n");

  const esikler = await thresholds();
  console.log(`  Eşikler (app_settings): gecikme > ${esikler.behindThreshold} puan → High Risk, > ${esikler.atRiskThreshold} → At Risk`);

  const [dbProjeler, dbAksiyonlar] = await Promise.all([
    all<DbProje>("projeler", "id,name,status,progress,completed_at"),
    all<DbAksiyon>("aksiyonlar", "id,proje_id,name,status,progress,start_date,end_date,completed_at"),
  ]);
  console.log(`  Veri: ${dbProjeler.length} proje, ${dbAksiyonlar.length} aksiyon\n`);

  // DB (snake_case) → kuralın beklediği şekil (camelCase)
  const projeler: ProjeShape[] = dbProjeler.map((p) => ({
    id: p.id, name: p.name, status: p.status as ProjeShape["status"],
    progress: p.progress, completedAt: p.completed_at ?? undefined,
  }));
  const aksiyonlar: AksiyonShape[] = dbAksiyonlar.map((a) => ({
    id: a.id, projeId: a.proje_id, name: a.name, status: a.status as AksiyonShape["status"],
    progress: a.progress, startDate: a.start_date, endDate: a.end_date,
    completedAt: a.completed_at ?? undefined,
  }));

  const plan = planStatusRefresh(projeler, aksiyonlar, esikler);

  console.log(`═══ PLAN ═══`);
  console.log(`  Aksiyon değişikliği : ${plan.aksiyonlar.length}`);
  console.log(`  Proje değişikliği   : ${plan.projeler.length}`);
  for (const c of plan.aksiyonlar.slice(0, 15)) {
    console.log(`     ${c.id}  → ${c.status}${c.completedAt === null ? "  (tarih temizlenir)" : c.completedAt ? "  (tarih basılır)" : ""}  ${c.name.slice(0, 40)}`);
  }
  if (plan.aksiyonlar.length > 15) console.log(`     … +${plan.aksiyonlar.length - 15} aksiyon daha`);
  for (const c of plan.projeler.slice(0, 15)) {
    console.log(`     ${c.id}  → ${c.status} %${c.progress}  ${c.name.slice(0, 40)}`);
  }
  if (plan.projeler.length > 15) console.log(`     … +${plan.projeler.length - 15} proje daha`);

  if (!APPLY) {
    console.log(`\nUygulamak için: npx tsx scripts/refresh-statuses.ts --apply`);
    return;
  }
  if (plan.aksiyonlar.length === 0 && plan.projeler.length === 0) {
    console.log(`\n✅ Her şey güncel — yazılacak bir şey yok.`);
    return;
  }

  let yazilan = 0;
  for (const c of plan.aksiyonlar) {
    await api(`aksiyonlar?id=eq.${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: c.status,
        ...(c.completedAt !== undefined ? { completed_at: c.completedAt } : {}),
      }),
    });
    yazilan++;
  }
  for (const c of plan.projeler) {
    await api(`projeler?id=eq.${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        progress: c.progress,
        status: c.status,
        ...(c.completedAt !== undefined ? { completed_at: c.completedAt } : {}),
      }),
    });
    yazilan++;
  }
  console.log(`\n  ✓ ${yazilan} kayıt güncellendi`);

  // İdempotans doğrulaması: ikinci plan boş çıkmalı. Çıkmıyorsa kural
  // yakınsamıyor demektir — sessizce geçmek yerine işi kırmızıya düşürüyoruz.
  const [p2, a2] = await Promise.all([
    all<DbProje>("projeler", "id,name,status,progress,completed_at"),
    all<DbAksiyon>("aksiyonlar", "id,proje_id,name,status,progress,start_date,end_date,completed_at"),
  ]);
  const kontrol = planStatusRefresh(
    p2.map((p) => ({ id: p.id, name: p.name, status: p.status as ProjeShape["status"], progress: p.progress, completedAt: p.completed_at ?? undefined })),
    a2.map((a) => ({ id: a.id, projeId: a.proje_id, name: a.name, status: a.status as AksiyonShape["status"], progress: a.progress, startDate: a.start_date, endDate: a.end_date, completedAt: a.completed_at ?? undefined })),
    esikler,
  );
  const kalan = kontrol.aksiyonlar.length + kontrol.projeler.length;
  console.log(`  Doğrulama: ikinci geçişte kalan değişiklik = ${kalan}` + (kalan === 0 ? "  ✓ yakınsadı" : "  ⚠ YAKINSAMADI"));
  if (kalan !== 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ Statü tazeleme başarısız:", err);
  process.exit(1);
});
