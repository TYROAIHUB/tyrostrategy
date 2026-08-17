import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KPICard from "../dashboard/KPICard";

// framer-motion: animasyonsuz basit elementlere indir. `animate` AnimatedCounter
// tarafından kullanılıyor — son değeri hemen yazan bir sahte veriyoruz.
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

describe("KPICard", () => {
  const base = {
    label: "Proje sayısı",
    value: 26,
    icon: "Target",
    color: "var(--tyro-navy)",
  };

  it("renders the label and the animated value", () => {
    render(<KPICard {...base} />);
    expect(screen.getByText("Proje sayısı")).toBeInTheDocument();
    expect(screen.getByText("26")).toBeInTheDocument();
  });

  it("renders a suffix with the counter", () => {
    render(<KPICard {...base} value={53} suffix="%" />);
    expect(screen.getByText("53%")).toBeInTheDocument();
  });

  // ── T-Atlas için eklenen iki prop ──

  it("prefers displayValue over the animated counter", () => {
    // AnimatedCounter tam sayıya yuvarlıyor; biçimli tutarlar bu yolla basılır
    render(<KPICard {...base} value={1250000} displayValue="1,25 Mn USD" />);
    expect(screen.getByText("1,25 Mn USD")).toBeInTheDocument();
    expect(screen.queryByText("1250000")).not.toBeInTheDocument();
  });

  it("accepts an icon element instead of an iconMap key", () => {
    render(<KPICard {...base} icon={<svg data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("still resolves string icon keys (existing dashboard call sites)", () => {
    const { container } = render(<KPICard {...base} icon="AlertTriangle" />);
    // iconMap girdileri Lucide svg'leri olarak render edilir
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("shows contextText when provided", () => {
    render(<KPICard {...base} contextText="Haritada gösterilen" />);
    expect(screen.getByText("Haritada gösterilen")).toBeInTheDocument();
  });

  it("renders the progress ring percentage when progress is given", () => {
    render(<KPICard {...base} progress={53} />);
    expect(screen.getByText("53%")).toBeInTheDocument();
  });

  it("renders a target next to the value", () => {
    render(<KPICard {...base} value={12} target={26} />);
    expect(screen.getByText("/ 26")).toBeInTheDocument();
  });
});
