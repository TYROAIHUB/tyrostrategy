/**
 * İcra Kurulu Üyeleri — kullanıcı (proje lideri) bağlılık listesi.
 *
 * Kullanıcı isteği 2026-05-22: Rapor Konfigürasyonu → Proje Dağılım
 * Matrisi'nde "İcra Kurulu" sekmesi eklenir. Her satır bir İcra Kurulu
 * üyesi; o satırın hücreleri = ÜYEYE BAĞLI proje liderlerinin owner
 * olduğu projelerin statü dağılımı.
 *
 * Veri kaynağı: `Downloads/tyrostrategy_kullanicilar_2026-05-15.xlsx`
 * "Bağlı Olduğu İcra Kurulu Üyesi" sütunu (49 user × 9 executive).
 *
 * Kararlı eşleme: subordinates listesi proje.owner ile birebir karşılaştırılır
 * (DB'deki users.display_name = Excel'deki "Ad Soyad" = proje.owner string).
 * Email opsiyonel — ileride DB-side migrate yaparsak canonical key olarak
 * kullanılabilir, şu an sadece bilgi amaçlı.
 *
 * Geçici çözüm: kullanıcı "şimdilik A planıyla, sonra DB-side yapılır" dedi.
 * Personel değişikliği olursa bu dosya güncellenip push gerekir.
 */

export interface ExecutiveMember {
  /** UI'da görünen ad. proje.owner ile direkt karşılaştırılır */
  name: string;
  /** Canonical email — gelecek migration için işaret */
  email: string;
  /** Tooltip için opsiyonel ünvan — uzun tanım ("Başkan Yardımcısı / Operasyon") */
  title?: string;
  /**
   * Matris satırında ADIN YERİNE gösterilecek kısa ünvan ("CEO", "COO").
   *
   * Kullanıcı isteği 2026-09-30: Proje Dağılım Matrisi'nin Üst Yönetim
   * sekmesinde kişi adı yerine ünvan görünsün. `title` uzun tanımlar tuttuğu
   * ve tooltip'te kullanıldığı için ayrı bir alan açıldı; ikisi bir arada
   * yaşıyor. Boş bırakılan üyede satır yine ADI gösterir, yani liste eksik
   * kısaltmayla bozulmaz.
   */
  shortTitle?: string;
  /** Bu üyeye bağlı proje liderlerinin display_name listesi */
  subordinates: string[];
}

export const EXECUTIVE_BOARD: ExecutiveMember[] = [
  {
    name: "Süleyman Tiryakioğlu",
    email: "suleyman.t@tiryaki.com.tr",
    title: "CEO",
    shortTitle: "CEO",
    subordinates: ["Süleyman Tiryakioğlu"],
  },
  {
    name: "Bahadır Açık",
    email: "bahadir.acik@tiryaki.com.tr",
    title: "Başkan Yardımcısı / Operasyon",
    shortTitle: "COO",
    subordinates: [
      "Arzu Miray Çelen",
      "Bahadır Açık",
      "Burcu Gözen",
      "Büşra Kaplan",
      "Cenk Şayli",
      "Emre Yüzbaşıoğlu",
      "İlhan Telci",
      "Kerime İkizler",
      "Nazlı Çetin",
      "Nevzat Çakmak",
      "Pınar Kürtünlüoğlu",
      "Timur Karaman",
    ],
  },
  {
    name: "Fatih Tiryakioğlu",
    email: "fatih.tiryakioglu@tiryaki.com.tr",
    title: "Başkan Yardımcısı / Uluslararası",
    subordinates: ["Fatih Tiryakioğlu", "Serkan Can"],
  },
  {
    name: "Murat Boğahan",
    email: "murat.bogahan@tiryaki.com.tr",
    title: "Başkan Yardımcısı / İnsan Kaynakları",
    subordinates: [
      "Ahmet Kalkan",
      "Dilek Moral Balcan",
      "Emrah Erenler",
      "Halil Özturk",
      "Murat Boğahan",
      "Tarkan Yılmaz",
    ],
  },
  {
    name: "Tekin Mengüç",
    email: "tekin.menguc@tiryaki.com.tr",
    title: "Başkan Yardımcısı / Tiryaki Türkiye",
    subordinates: [
      "Barış Şentürk",
      "Emin Oktay",
      "Enver Tanrıverdioğlu",
      "Gulnur Kalyoncu",
      "Kazım Dolaşık",
      "Ozan Yeşilyer",
      "Recep Mergen",
      "Tamer Latifoğlu",
      "Taylan Eğilmez",
      "Tekin Mengüç",
    ],
  },
  {
    name: "Türkay Tatar",
    email: "turkay.tatar@tiryaki.com.tr",
    title: "Başkan Yardımcısı / Finans ve Mali İşler",
    subordinates: ["Devrim Aşkın", "Mete Sayın", "Türkay Tatar", "Uğurcan Patlar"],
  },
  {
    name: "Rene Osorio",
    email: "rene.osorio@sunrisefoods.com",
    title: "Sunrise Foods Yönetimi",
    subordinates: [
      "Derya Boztunç",
      "Ecem Ekinci",
      "Emre Padar",
      "Kübra Dömbek",
      "Kürşat Cengiz",
      "Murat Solak",
      "Raif Karacı",
      "Şahin Kabataş",
      "Ufuk Tosun",
    ],
  },
  {
    name: "Talip Kahyaoğlu",
    email: "talip.kahyaoglu@tiryaki.com.tr",
    title: "Ar-Ge / Yatırım",
    subordinates: ["Elif Balcı", "Serkan Kançağı", "Yiğit Karacı"],
  },
  {
    name: "Arzu Örsel",
    email: "arzu.orsel@tiryaki.com.tr",
    title: "Kurumsal İletişim ve Sürdürülebilirlik Direktörü",
    subordinates: ["Arzu Örsel"],
  },
];

/** Proje.owner adına göre bağlı olduğu İcra Kurulu üyesini döner. */
export function findExecutiveByOwner(ownerName: string | undefined | null): ExecutiveMember | null {
  if (!ownerName) return null;
  const trimmed = ownerName.trim();
  if (!trimmed) return null;
  for (const exec of EXECUTIVE_BOARD) {
    if (exec.subordinates.includes(trimmed)) return exec;
  }
  return null;
}

/**
 * Matris satırında gösterilecek etiket: kısa ünvan varsa o, yoksa adın kendisi.
 *
 * Eşleştirme anahtarı DAİMA `name` olarak kalıyor (satır açma/kapama ve
 * proje.owner karşılaştırması ona bağlı); değişen yalnızca GÖSTERİM.
 */
export function executiveLabel(name: string): string {
  return EXECUTIVE_BOARD.find((e) => e.name === name)?.shortTitle ?? name;
}

/**
 * Tooltip metni. Kişinin ADI BİLEREK GÖSTERİLMEZ (kullanıcı isteği
 * 2026-09-30: "Bahadır açık yazmasın orada üzerine gelince de").
 * Uzun ünvan varsa o, yoksa kısa ünvan. İkisi de yoksa geriye ad kalıyor —
 * ama o durumda satır zaten adı gösteriyor, yeni bir bilgi açığa çıkmıyor.
 */
export function executiveTooltip(name: string): string {
  const exec = EXECUTIVE_BOARD.find((e) => e.name === name);
  if (!exec) return name;
  return exec.title ?? exec.shortTitle ?? exec.name;
}
