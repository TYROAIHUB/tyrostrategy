import { describe, it, expect } from "vitest";
import { isUpdateAvailable, type DeployedVersion } from "@/lib/appVersion";

/**
 * Karar mantığı ağdan AYRI tutuldu; burada ağa çıkmadan sınanıyor.
 * Yanlış pozitif maliyeti yüksek: kullanıcıya boş yere "yenile" demek,
 * güncellemeyi bir etkileşim geç fark etmekten daha rahatsız edici.
 */
const v = (hash: string): DeployedVersion => ({ hash });

describe("isUpdateAvailable", () => {
  it("hash farklıysa güncelleme var", () => {
    expect(isUpdateAvailable("abc1234", v("def5678"))).toBe(true);
  });

  it("hash aynıysa güncelleme yok", () => {
    expect(isUpdateAvailable("abc1234", v("abc1234"))).toBe(false);
  });

  it("yayındaki sürüm OKUNAMADIYSA uyarmıyor", () => {
    // Ağ hatası / çevrimdışılık / henüz yayınlanmamış version.json —
    // belirsizlikte sessiz kalmak, yanlış uyarı vermekten iyi.
    expect(isUpdateAvailable("abc1234", null)).toBe(false);
  });

  it("boş hash'e güvenmiyor", () => {
    expect(isUpdateAvailable("abc1234", v(""))).toBe(false);
  });

  it("geliştirme ortamında hiç uyarmıyor", () => {
    // `dev` hash'i anlamlı değil; her yeniden başlatmada şerit çıkmasın.
    expect(isUpdateAvailable("dev", v("abc1234"))).toBe(false);
  });
});
