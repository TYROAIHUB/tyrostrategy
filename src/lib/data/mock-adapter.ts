import {
  turkiyeHedefler,
  kurumsalHedefler,
  internationalHedefler,
} from "@/lib/mock-data/cascade-data";
import type { CascadeHedef } from "@/lib/mock-data/cascade-data";
import type { Hedef, Aksiyon, EntityStatus, Source, TagDefinition } from "@/types";
import { getDepartmentByUser } from "@/config/departments";
import { TAG_COLOR_PALETTE } from "@/config/tagColors";

function mapStatus(s: string): EntityStatus {
  const valid: EntityStatus[] = ["On Track", "Achieved", "Behind", "At Risk", "Not Started"];
  return (valid.includes(s as EntityStatus) ? s : "Not Started") as EntityStatus;
}

function computeReviewDate(endDate: string): string {
  try {
    const d = new Date(endDate);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  } catch {
    return endDate;
  }
}

// Add "Cenk Şayli" as participant to some hedefler for workspace demo
const CURRENT_USER = "Cenk Şayli";
function buildParticipants(leader: string, hedefId: string): string[] {
  const base = [leader];
  // Add current user to ~40% of hedefler using deterministic hash
  const hash = hedefId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (hash % 5 < 2 && leader !== CURRENT_USER) {
    base.push(CURRENT_USER);
  }
  return base;
}

// Deterministic tag assignment based on hedef name keywords
// İsme bakarak kısa mock açıklama üret
function generateHedefDescription(name: string, source: Source): string {
  const n = name.toLocaleLowerCase("tr");
  if (n.includes("erp")) return "Kurumsal kaynak planlama sisteminin devreye alınması ve iş süreçlerinin dijitalleştirilmesi.";
  if (n.includes("ihracat") || n.includes("export")) return "Yeni pazarlara açılarak ihracat hacminin ve gelir çeşitliliğinin artırılması.";
  if (n.includes("intranet")) return "Şirket içi iletişimi güçlendirecek dijital portal ve bilgi yönetim platformunun kurulması.";
  if (n.includes("sigorta")) return "Grup şirketleri genelinde sigorta poliçelerinin konsolidasyonu ve risk yönetimi çerçevesinin oluşturulması.";
  if (n.includes("risk")) return "Operasyonel ve finansal risklerin belirlenmesi, ölçülmesi ve azaltılmasına yönelik sistematik çalışma.";
  if (n.includes("sulama")) return "Modern sulama altyapısı ile tarımsal verimliliğin artırılması ve su kaynaklarının etkin kullanımı.";
  if (n.includes("mekanizasyon")) return "Tarımsal üretimde modern makine ve ekipman kullanımının yaygınlaştırılması.";
  if (n.includes("yem") || n.includes("katkı")) return "Yem katkı ürünlerinde yeni pazar fırsatlarının değerlendirilmesi ve satış kanallarının geliştirilmesi.";
  if (n.includes("rejeneratif") || n.includes("tarım")) return "Toprak sağlığını iyileştiren ve sürdürülebilir üretim modellerini destekleyen tarım uygulamaları.";
  if (n.includes("protein") || n.includes("kapasite")) return "Üretim kapasitesinin artırılması ve tesislerin modernize edilmesi.";
  if (n.includes("fıstık") || n.includes("çin")) return "Antep fıstığı ürünlerinin Çin pazarına girişi için pazar araştırması ve dağıtım ağının kurulması.";
  if (n.includes("stok")) return "Stok seviyelerinin optimizasyonu, depo yönetimi ve tedarik zinciri verimliliğinin artırılması.";
  if (n.includes("bütçe") || n.includes("kaynak")) return "Bütçe planlaması ve kaynakların stratejik önceliklere göre tahsisi.";
  if (n.includes("lojistik")) return "Lojistik operasyonlarının iyileştirilmesi ve dağıtım maliyetlerinin düşürülmesi.";
  if (n.includes("kalite") || n.includes("iso")) return "Kalite yönetim sistemlerinin güçlendirilmesi ve uluslararası standartlara uyum.";
  if (n.includes("müşteri")) return "Müşteri memnuniyetinin artırılması ve uzun vadeli müşteri ilişkilerinin güçlendirilmesi.";
  if (n.includes("dijital")) return "Dijital dönüşüm stratejisi kapsamında iş süreçlerinin teknoloji ile entegrasyonu.";
  if (n.includes("operasyon")) return `${source} operasyonlarında verimlilik artışı ve süreç iyileştirme çalışmaları.`;
  return `${source} stratejik hedefleri kapsamında planlanan çalışmaların yürütülmesi ve takibi.`;
}

function generateAksiyonDescription(name: string): string {
  const n = name.toLocaleLowerCase("tr");
  if (n.includes("milestone") || n.includes("discovery")) return "Proje kapsamının belirlenmesi, paydaş görüşmeleri ve mevcut durum analizi.";
  if (n.includes("tasarım")) return "Sistem mimarisi, kullanıcı arayüzü ve teknik tasarım dökümanlarının hazırlanması.";
  if (n.includes("bütçe") || n.includes("onay")) return "Maliyet analizi, bütçe taslağının hazırlanması ve yönetim onayının alınması.";
  if (n.includes("test") || n.includes("pilot")) return "Geliştirilen çözümün pilot ortamda test edilmesi ve geri bildirim toplanması.";
  if (n.includes("eğitim")) return "Kullanıcı eğitimlerinin planlanması ve gerçekleştirilmesi.";
  if (n.includes("içerik")) return "Gerekli içeriklerin oluşturulması, çeviri ve lokalizasyon çalışmalarının yürütülmesi.";
  if (n.includes("tedarikçi") || n.includes("satınalma")) return "Tedarikçi seçimi, teklif değerlendirmesi ve satınalma sürecinin yönetimi.";
  if (n.includes("strateji") || n.includes("belirlenmesi")) return "Stratejik yönlendirmelerin netleştirilmesi ve eylem planının oluşturulması.";
  if (n.includes("prosedür")) return "İş süreçleri için standart prosedürlerin yazılması ve onaylanması.";
  if (n.includes("rapor")) return "İlerleme ve performans raporlarının hazırlanarak paydaşlara sunulması.";
  if (n.includes("analiz") || n.includes("araştırma")) return "Veri toplama, analiz ve değerlendirme çalışmalarının gerçekleştirilmesi.";
  if (n.includes("kurulum") || n.includes("devreye")) return "Sistem kurulumu, konfigürasyonu ve canlıya alma sürecinin yönetimi.";
  if (n.includes("pazar")) return "Hedef pazar araştırması, rekabet analizi ve giriş stratejisinin belirlenmesi.";
  if (n.includes("tebliğ") || n.includes("uygulama")) return "Onaylanan prosedürlerin ilgili birimlere tebliği ve uygulamaya alınması.";
  return "Belirlenen zaman çizelgesine uygun olarak görevin planlanması ve tamamlanması.";
}

function assignTags(_name: string, _source: Source, progress: number, status: string): string[] {
  // Her hedefe durumuna göre tek bir aşama tag'i ata
  if (status === "Not Started" || progress === 0) return ["Ön Çalışma"];
  if (status === "Achieved" || progress >= 80) return ["Uygulama"];
  return ["Geliştirme"];
}

function flattenHedefler(hedefler: CascadeHedef[], source: Source): Hedef[] {
  return hedefler.map((h) => {
    // Compute progress as average of all tasks across all projects
    const allTasks = h.projects.flatMap((p) => p.tasks);
    const totalTasks = allTasks.length;
    const achievedTasks = allTasks.filter((t) => t.status === "Achieved").length;
    const progress = totalTasks > 0 ? Math.round((achievedTasks / totalTasks) * 100) : 0;

    // Use the first project's leader for department, or fall back to hedef leader
    const primaryLeader = h.projects[0]?.leader || h.leader;

    return {
      id: h.id,
      name: h.name,
      source,
      status: mapStatus(h.status),
      owner: h.leader,
      participants: buildParticipants(primaryLeader, h.id),
      department: getDepartmentByUser(primaryLeader)?.name ?? source,
      progress,
      startDate: h.startDate,
      endDate: h.endDate,
      reviewDate: computeReviewDate(h.endDate),
      description: generateHedefDescription(h.name, source),
      tags: assignTags(h.name, source, progress, mapStatus(h.status)),
      createdBy: h.leader,
      createdAt: h.startDate,
    };
  });
}

function flattenAksiyonlar(hedefler: CascadeHedef[]): Aksiyon[] {
  const result: Aksiyon[] = [];
  let sortOrder = 0;
  for (const h of hedefler) {
    for (const p of h.projects) {
      for (const t of p.tasks) {
        const aksiyonStatus = mapStatus(t.status);
        result.push({
          id: t.id,
          hedefId: h.id,
          name: t.name,
          description: generateAksiyonDescription(t.name),
          owner: p.leader || h.leader,
          progress: t.progress,
          status: aksiyonStatus,
          startDate: t.startDate,
          endDate: t.endDate,
          sortOrder: sortOrder++,
          createdBy: h.leader,
          createdAt: t.startDate,
          completedAt: aksiyonStatus === "Achieved" ? t.endDate : undefined,
        });
      }
    }
  }
  return result;
}

const allSources: [CascadeHedef[], Source][] = [
  [turkiyeHedefler, "Türkiye"],
  [kurumsalHedefler, "Kurumsal"],
  [internationalHedefler, "International"],
];

export function getInitialHedefler(): Hedef[] {
  const all = allSources.flatMap(([h, s]) => flattenHedefler(h, s));

  // Assign parentObjectiveId for T-Alignment — realistic multi-group hierarchy
  const bySource = new Map<string, Hedef[]>();
  for (const h of all) {
    const list = bySource.get(h.source) ?? [];
    list.push(h);
    bySource.set(h.source, list);
  }

  for (const [, hedefler] of bySource) {
    if (hedefler.length < 4) continue;

    // Create multiple parent groups per source
    // Group 1: hedefler[0] is parent, [1],[2],[3] are children
    hedefler[1].parentObjectiveId = hedefler[0].id;
    hedefler[2].parentObjectiveId = hedefler[0].id;
    if (hedefler.length > 3) hedefler[3].parentObjectiveId = hedefler[0].id;

    // Group 2: if enough hedefler, hedefler[4] is second parent, [5],[6] children
    if (hedefler.length > 6) {
      hedefler[5].parentObjectiveId = hedefler[4].id;
      hedefler[6].parentObjectiveId = hedefler[4].id;
    }

    // Group 3: if many, hedefler[7] parent, [8],[9] children
    if (hedefler.length > 9) {
      hedefler[8].parentObjectiveId = hedefler[7].id;
      hedefler[9].parentObjectiveId = hedefler[7].id;
    }
    // Remaining hedefler stay standalone (no parent)
  }

  return all;
}

export function getInitialAksiyonlar(): Aksiyon[] {
  return allSources.flatMap(([h]) => flattenAksiyonlar(h));
}

// ===== Parametrik Tag Tanımları =====
const INITIAL_TAG_NAMES = [
  "Ön Çalışma", "Geliştirme", "Uygulama",
];

export function getInitialTagDefinitions(): TagDefinition[] {
  return INITIAL_TAG_NAMES.map((name, i) => ({
    id: `tag-${i + 1}`,
    name,
    color: TAG_COLOR_PALETTE[i % TAG_COLOR_PALETTE.length],
  }));
}
