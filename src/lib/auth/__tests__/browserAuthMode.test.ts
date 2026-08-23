import { describe, it, expect } from "vitest";
import { prefersRedirect, POPUP_BLOCKED_CODES } from "@/lib/auth/browserAuthMode";

const UA = {
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  iPadLegacy: "Mozilla/5.0 (iPad; CPU OS 12_1 like Mac OS X) AppleWebKit/605.1.15 Version/12.0 Mobile/15E148 Safari/604.1",
  iPhone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1",
  android: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
  macChrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  winEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  winChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  macFirefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
  iosChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 CriOS/124.0 Mobile/15E148 Safari/604.1",
};

describe("prefersRedirect", () => {
  it("REGRESYON: masaüstü Safari yönlendirme kullanıyor", () => {
    // Kullanıcı bildirimi: Safari'de "Bağlan"a basınca hiç pencere açılmıyor,
    // ekran "Microsoft pencerenizi kontrol edin"de takılı kalıyordu.
    expect(prefersRedirect(UA.macSafari, 0)).toBe(true);
  });

  it("REGRESYON: iPad masaüstü kimliğiyle gelse de yakalanıyor", () => {
    // iPadOS 13+ Safari VARSAYILAN olarak "Macintosh" diyor. Eski regex `iPad`
    // aradığı için iPad'i de popup akışına sokuyordu.
    expect(prefersRedirect(UA.macSafari, 5)).toBe(true);
  });

  it("eski iPad kimliği, iPhone ve Android", () => {
    expect(prefersRedirect(UA.iPadLegacy, 5)).toBe(true);
    expect(prefersRedirect(UA.iPhone, 5)).toBe(true);
    expect(prefersRedirect(UA.android, 5)).toBe(true);
  });

  it("iOS Chrome da yönlendirme (altında WebKit var)", () => {
    expect(prefersRedirect(UA.iosChrome, 5)).toBe(true);
  });

  it("masaüstü Chrome / Edge / Firefox POPUP akışında KALIYOR", () => {
    // Bunlar zaten sorunsuz çalışıyor; davranışlarını değiştirmiyoruz.
    expect(prefersRedirect(UA.macChrome, 0)).toBe(false);
    expect(prefersRedirect(UA.winEdge, 0)).toBe(false);
    expect(prefersRedirect(UA.winChrome, 0)).toBe(false);
    expect(prefersRedirect(UA.macFirefox, 0)).toBe(false);
  });
});

describe("POPUP_BLOCKED_CODES", () => {
  it("engellenme kodlarını içeriyor", () => {
    for (const c of ["popup_window_error", "empty_window_error", "block_iframe_reload"]) {
      expect(POPUP_BLOCKED_CODES.has(c)).toBe(true);
    }
  });

  it("kullanıcı iptalini engellenme SAYMIYOR", () => {
    // Vazgeçen kullanıcıyı zorla Microsoft'a yönlendirmemeliyiz.
    expect(POPUP_BLOCKED_CODES.has("user_cancelled")).toBe(false);
  });
});
