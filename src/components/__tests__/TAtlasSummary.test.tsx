import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TAtlasSummary from "../tatlas/TAtlasSummary";
import { SHOW_CAPEX_ON_ATLAS } from "@/config/tatlasDisplay";
import type { AtlasBreakdowns, PortfolioMetrics } from "@/lib/investmentPortfolio";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "tr" } }),
}));

// framer-motion: animasyonsuz elementlere indir (KPICard testindeki desenin aynısı)
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, ...props }: any) => {
      const { animate: _a, transition: _t, whileHover: _h, initial: _i, ...rest } = props;
      const El = tag as unknown as React.ElementType;
      return <El {...rest}>{children}</El>;
    };
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => passthrough(tag) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AnimatePresence: ({ children }: any) => children,
    animate: (_from: number, to: number, opts: { onUpdate?: (v: number) => void }) => {
      opts.onUpdate?.(to);
      return { stop: () => undefined };
    },
  };
});

const metrics: PortfolioMetrics = {
  projectCount: 12,
  totalCapex: 5_000_000,
  capexEnteredCount: 3,
  countryCount: 4,
  newInvestmentCount: 2,
  avgProgress: 45,
  riskyCount: 3,
};

const breakdowns: AtlasBreakdowns = {
  byStatus: [{ key: "On Track", count: 8, capex: 3_000_000 }],
  byCountry: [{ key: "Türkiye", count: 7, capex: 2_000_000 }],
  byActionType: [{ key: "ACT-NEW", count: 5, capex: 1_500_000 }],
  byAssetClass: [{ key: "AST-PORT", count: 4, capex: 1_000_000 }],
};

describe("TAtlasSummary — CAPEX gizleme", () => {
  it("bayrak kapalıyken CAPEX kartı ve panelleri GÖRÜNMÜYOR", () => {
    // Kullanıcı isteği: Yatırım Haritası'nda CAPEX gösterilmesin.
    // Bayrak açılırsa bu test kendini uyarlar (aşağıdaki else dalı).
    render(<TAtlasSummary metrics={metrics} breakdowns={breakdowns} />);

    if (SHOW_CAPEX_ON_ATLAS) {
      expect(screen.queryByText("tatlas.metric.totalCapex")).not.toBeNull();
      return;
    }
    expect(screen.queryByText("tatlas.metric.totalCapex")).toBeNull();
    expect(screen.queryByText("tatlas.panel.capexByCountry")).toBeNull();
    expect(screen.queryByText("tatlas.panel.capexByActionType")).toBeNull();
    expect(screen.queryByText("tatlas.panel.capexByAssetClass")).toBeNull();
  });

  it("CAPEX dışındaki kartlar ve paneller yerinde", () => {
    // Gizleme, sayfanın geri kalanını götürmesin.
    render(<TAtlasSummary metrics={metrics} breakdowns={breakdowns} />);
    for (const k of [
      "tatlas.metric.projectCount",
      "tatlas.metric.countryCount",
      "tatlas.metric.newInvestment",
      "tatlas.metric.avgProgress",
      "tatlas.metric.riskyCount",
      "tatlas.panel.countByCountry",
      "tatlas.panel.countByActionType",
      "tatlas.panel.countByAssetClass",
    ]) {
      expect(screen.queryByText(k), `${k} görünmeli`).not.toBeNull();
    }
  });

  it("REGRESYON: JSX yorumu metin olarak basılmıyor", () => {
    // Daha önce rapor sayfasında JSX çocuk bağlamına `//` ile yorum yazılmış ve
    // yorumun kendisi ekrana basılmıştı. Aynı hata burada tekrarlanmasın.
    const { container } = render(<TAtlasSummary metrics={metrics} breakdowns={breakdowns} />);
    const metin = container.textContent ?? "";
    expect(metin).not.toContain("SHOW_CAPEX");
    expect(metin).not.toContain("{/*");
    expect(metin).not.toContain("Kurum kuralı");
    expect(metin).not.toMatch(/(^|\s)\/\/\s/);
  });

  it("kart ızgarası gizlenen kart yerine boşluk bırakmıyor", () => {
    const { container } = render(<TAtlasSummary metrics={metrics} breakdowns={breakdowns} />);
    const grid = container.querySelector(".items-stretch");
    expect(grid).not.toBeNull();
    expect(grid!.className).toContain(SHOW_CAPEX_ON_ATLAS ? "xl:grid-cols-6" : "xl:grid-cols-5");
    // Kart adedi de kolon sayısıyla uyumlu olmalı
    expect(grid!.children.length).toBe(SHOW_CAPEX_ON_ATLAS ? 6 : 5);
  });
});
