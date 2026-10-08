import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UpdateBanner from "../shared/UpdateBanner";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "tr" } }),
}));
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, ...props }: any) => {
      const { animate: _a, transition: _t, initial: _i, exit: _e, ...rest } = props;
      const El = tag as unknown as React.ElementType;
      return <El {...rest}>{children}</El>;
    };
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => passthrough(tag) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AnimatePresence: ({ children }: any) => children,
    useReducedMotion: () => false,
  };
});
vi.mock("@heroui/react", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Button: ({ children, onPress, ...rest }: any) => (
    <button onClick={onPress} {...rest}>{children}</button>
  ),
}));

// Kancayı kontrol edilebilir kılmak için taklit et — şeridin GÖRÜNÜM ve
// ETKİLEŞİM davranışını sınıyoruz, tespit mantığını appVersion testleri sınıyor.
const reload = vi.fn();
let updateAvailable = false;
vi.mock("@/hooks/useAppUpdate", () => ({
  useAppUpdate: () => ({ updateAvailable, reload }),
}));

describe("UpdateBanner", () => {
  it("güncelleme yokken hiçbir şey göstermiyor", () => {
    updateAvailable = false;
    const { container } = render(<UpdateBanner />);
    expect(container.textContent).toBe("");
  });

  it("güncelleme varken başlık, açıklama ve yenile düğmesi çıkıyor", () => {
    updateAvailable = true;
    render(<UpdateBanner />);
    expect(screen.getByText("update.title")).toBeTruthy();
    expect(screen.getByText("update.description")).toBeTruthy();
    expect(screen.getByText("update.action")).toBeTruthy();
  });

  it("yenile düğmesi sayfayı yeniliyor", () => {
    updateAvailable = true;
    reload.mockClear();
    render(<UpdateBanner />);
    fireEvent.click(screen.getByText("update.action"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("kapatılınca kayboluyor — kullanıcı yenilemeye zorlanmıyor", () => {
    updateAvailable = true;
    const { container } = render(<UpdateBanner />);
    fireEvent.click(screen.getByLabelText("update.dismiss"));
    expect(container.textContent).toBe("");
  });

  it("ekran okuyucuya duyuruluyor", () => {
    updateAvailable = true;
    render(<UpdateBanner />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });
});
