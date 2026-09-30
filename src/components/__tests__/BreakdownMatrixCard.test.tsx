import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import BreakdownMatrixCard from "../dashboard/BreakdownMatrixCard";
import type { Proje } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "tr" } }),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/hooks/useSidebarTheme", () => ({ useSidebarTheme: () => ({ accentColor: "#c8922a" }) }));
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, ...props }: any) => {
      const { animate: _a, transition: _t, whileHover: _h, initial: _i, exit: _e, layout: _l, ...rest } = props;
      const El = tag as unknown as React.ElementType;
      return <El {...rest}>{children}</El>;
    };
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => passthrough(tag) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AnimatePresence: ({ children }: any) => children,
    animate: (_f: number, to: number, o: { onUpdate?: (v: number) => void }) => { o.onUpdate?.(to); return { stop: () => undefined }; },
  };
});

/** Bahadır Açık'a bağlı bir proje lideri (executiveBoard.ts subordinates listesinden). */
const ASTI = "Cenk Şayli";

function proje(over: Partial<Proje> = {}): Proje {
  return {
    id: "P26-0001", name: "Proje", source: "Kurumsal", status: "On Track",
    owner: ASTI, participants: [], department: "IT", progress: 50,
    startDate: "2026-01-01", endDate: "2026-12-31", ...over,
  } as Proje;
}

describe("BreakdownMatrixCard — üst yönetim satırı", () => {
  it("REGRESYON: kişi adı HİÇBİR YERDE görünmüyor — tooltip'ler dahil", () => {
    // Kullanıcı isteği: matriste "Bahadır Açık" ne satırda ne de üzerine
    // gelince görünsün. Hücre tooltip'leri de satır anahtarını basıyordu;
    // bu test o sızıntının geri gelmesini engelliyor.
    const { container } = render(
      <BreakdownMatrixCard projeler={[proje(), proje({ id: "P26-0002", status: "At Risk" })]} />,
    );
    // innerHTML title="" niteliklerini de kapsar
    expect(container.innerHTML).not.toContain("Bahadır");
    expect(container.textContent).not.toContain("Bahadır");
  });

  it("satırda kısa ünvan gösteriliyor", () => {
    const { container } = render(<BreakdownMatrixCard projeler={[proje()]} />);
    expect(container.textContent).toContain("COO");
  });
});
