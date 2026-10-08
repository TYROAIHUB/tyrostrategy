import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import StatusBadge from "../ui/StatusBadge";
import { STATUS_ICON } from "@/config/statusIcons";
import type { EntityStatus } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "tr" } }),
}));
vi.mock("@heroui/react", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Tooltip: ({ children }: any) => children,
}));

const TUM_STATULER = Object.keys(STATUS_ICON) as EntityStatus[];

describe("StatusBadge — statüye özel ikon", () => {
  it("yedi statünün hepsi bir ikon çiziyor", () => {
    for (const s of TUM_STATULER) {
      const { container } = render(<StatusBadge status={s} />);
      expect(container.querySelector("svg"), `${s} ikonsuz`).not.toBeNull();
    }
  });

  it("REGRESYON: ikonlar birbirinden FARKLI — renge bakmadan ayırt edilebilmeli", () => {
    // Önceden hepsi aynı dolu daireydi, yalnızca renk ayırt ediyordu;
    // renk körü kullanıcı statüleri ayıramıyordu (WCAG: bilgi yalnızca
    // renkle taşınmamalı).
    const yollar = TUM_STATULER.map((s) => {
      const { container } = render(<StatusBadge status={s} />);
      return container.querySelector("svg")!.innerHTML;
    });
    expect(new Set(yollar).size).toBe(TUM_STATULER.length);
  });

  it("etiket metni hâlâ gösteriliyor — ikon metnin yerine geçmiyor", () => {
    const { container } = render(<StatusBadge status="Achieved" />);
    expect(container.textContent?.trim()).toBeTruthy();
  });
});
