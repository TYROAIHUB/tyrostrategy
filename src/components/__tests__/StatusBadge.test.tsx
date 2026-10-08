import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../ui/StatusBadge";
import { STATUS_ICON } from "@/config/statusIcons";
import type { EntityStatus } from "@/types";

// Mock i18n — t returns the key
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "tr" } }),
}));

describe("StatusBadge", () => {
  const statuses: EntityStatus[] = ["On Track", "Achieved", "High Risk", "At Risk", "Not Started"];

  it.each(statuses)("renders a label for status '%s'", (status) => {
    render(<StatusBadge status={status} />);
    // getStatusLabel calls t() with the status i18n key, so text content should exist
    const badge = screen.getByText(/status\./);
    expect(badge).toBeInTheDocument();
  });

  /**
   * Renk testleri — rozetin zemini ve metin rengi statüye göre değişiyor.
   *
   * NOT: Bu testler önceden ayrıca renkli bir NOKTA arıyordu
   * (`span.bg-emerald-500` gibi). Nokta 2026-10-08'de kaldırıldı: tüm statüler
   * aynı daireydi ve yalnızca renk ayırt ediyordu, dolayısıyla renk körü
   * kullanıcı statüleri ayıramıyordu. Yerine statüye özel İKON geldi
   * (src/config/statusIcons.ts). Nokta doğrulamaları, aynı niyeti koruyacak
   * şekilde "bu statü kendi işaretini çiziyor" kontrolüne dönüştürüldü.
   */
  const renkSenaryolari: [EntityStatus, string, string][] = [
    ["On Track", "bg-emerald-50", "text-emerald-600"],
    ["Achieved", "bg-blue-50", "text-blue-600"],
    ["High Risk", "bg-red-50", "text-red-600"],
    ["At Risk", "bg-amber-50", "text-amber-600"],
    ["Not Started", "bg-slate-100", "text-tyro-text-muted"],
  ];

  it.each(renkSenaryolari)("applies %s colors and renders its own marker", (status, bg, text) => {
    const { container } = render(<StatusBadge status={status} />);
    const outerSpan = container.querySelector(`span.${bg.replace(/([:.])/g, "\\$1")}`);
    expect(outerSpan).toBeInTheDocument();
    expect(outerSpan).toHaveClass(text);
    // İşaret artık nokta değil ikon — renk dış span'den miras alınıyor.
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders with correct CSS structure (inline-flex, rounded-full, etc.)", () => {
    const { container } = render(<StatusBadge status="On Track" />);
    const outerSpan = container.firstElementChild as HTMLElement;
    expect(outerSpan).toHaveClass("inline-flex");
    expect(outerSpan).toHaveClass("rounded-full");
    expect(outerSpan).toHaveClass("font-semibold");
  });
});

describe("StatusBadge — statüye özel ikon", () => {
  const TUM_STATULER = Object.keys(STATUS_ICON) as EntityStatus[];

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
