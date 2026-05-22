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
  /** Tooltip için opsiyonel ünvan */
  title?: string;
  /** Bu üyeye bağlı proje liderlerinin display_name listesi */
  subordinates: string[];
}

export const EXECUTIVE_BOARD: ExecutiveMember[] = [
  {
    name: "Süleyman Tiryakioğlu",
    email: "suleyman.t@tiryaki.com.tr",
    title: "CEO",
    subordinates: ["Süleyman Tiryakioğlu"],
  },
  {
    name: "Bahadır Açık",
    email: "bahadir.acik@tiryaki.com.tr",
    title: "Başkan Yardımcısı / Operasyon",
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
