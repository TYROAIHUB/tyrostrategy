import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Crosshair,
  Banknote,
  Globe2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Hammer,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import { formatCapex, formatCapexCompact } from "@/lib/money";
import { SHOW_CAPEX_ON_ATLAS } from "@/config/tatlasDisplay";
import {
  assetClassLabel,
  actionTypeLabel,
  assetClassCodeAndLabel,
  actionTypeCodeAndLabel,
} from "@/config/projectTaxonomy";
import type { AtlasBreakdowns, BreakdownRow, PortfolioMetrics } from "@/lib/investmentPortfolio";
import type { EntityStatus } from "@/types";

/**
 * Yatırım portföyü özeti (doküman §7).
 *
 * Sayılar FİLTRELENMİŞ kümeden gelir; harita pin'leriyle aynı kaynak,
 * dolayısıyla "haritada görünen küme ile özetteki sayılar her zaman aynı".
 *
 * GÖRÜNÜM: özet kartları rapor sayfasının KPICard bileşeninin AYNISI —
 * kendi kart tasarımımı yazmıyorum. Kullanıcı geri bildirimi netti: elle
 * yazılmış kartlar "generic" duruyordu ve uygulamanın diliyle uyuşmuyordu.
 * Artık aynı GlassCard, aynı tipografi, aynı ikon çipi, aynı ring; renkler de
 * rapor sayfasıyla aynı konvansiyonla TYRO CSS token'ları.
 *
 * Kırılım panelleri boyuta göre renk ayrımı yapıyor (adet panelleri kendi
 * boyut rengi, CAPEX panelleri para yeşili); ikon ve rozetler KPICard ile
 * tutarlı olsun diye nötr çip zemini + renkli ikon kullanıyor.
 */
interface Props {
  metrics: PortfolioMetrics;
  breakdowns: AtlasBreakdowns;
}

/**
 * Metrik renkleri — rapor sayfasındaki KPI kartlarıyla AYNI konvansiyon:
 * doğrudan TYRO CSS token'ları. Hem palet dışına çıkmıyoruz hem tema
 * değişiminde renkler kendiliğinden uyum sağlıyor.
 */
const METRIC_COLOR = {
  project: "var(--tyro-navy)",
  capex: "var(--tyro-success)",
  country: "var(--tyro-info)",
  newInvestment: "var(--tyro-gold)",
  progress: "var(--tyro-navy-light)",
  risk: "var(--tyro-danger)",
} as const;

/** Kırılım panelleri — filtre ikonlarıyla eşleşen boyut renkleri */
const DIM_COLOR = {
  country: METRIC_COLOR.country,
  actionType: "var(--tyro-navy)",
  assetClass: METRIC_COLOR.newInvestment,
  capex: METRIC_COLOR.capex,
} as const;

export default function TAtlasSummary({ metrics, breakdowns }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const capexNote =
    metrics.projectCount === 0
      ? undefined
      : metrics.capexEnteredCount === 0
        ? t("tatlas.metric.capexMissing")
        : metrics.capexEnteredCount < metrics.projectCount
          ? t("tatlas.metric.capexPartial", {
              entered: metrics.capexEnteredCount,
              total: metrics.projectCount,
            })
          : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Altı özet kartı ── */}
      <section>
        <SectionTitle icon={PieChart}>{t("tatlas.summary.cards")}</SectionTitle>
        {/* Rapor sayfasındaki KPI kartlarıyla aynı bileşen ve aynı ızgara
            ritmi — sayfalar arası görünüm tutarlı kalsın. */}
        <div
          className={`grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 ${
            SHOW_CAPEX_ON_ATLAS ? "xl:grid-cols-6" : "xl:grid-cols-5"
          }`}
        >
          <div className="flex">
            <KPICard
              label={t("tatlas.metric.projectCount")}
              value={metrics.projectCount}
              icon={<Crosshair size={20} />}
              color={METRIC_COLOR.project}
              contextText={t("tatlas.metric.projectCountNote")}
            />
          </div>
          {SHOW_CAPEX_ON_ATLAS && (
            <div className="flex">
              <KPICard
                label={t("tatlas.metric.totalCapex")}
                value={metrics.totalCapex}
                displayValue={formatCapexCompact(metrics.totalCapex, locale) || "0 USD"}
                icon={<Banknote size={20} />}
                color={METRIC_COLOR.capex}
                contextText={capexNote ?? formatCapex(metrics.totalCapex, locale)}
              />
            </div>
          )}
          <div className="flex">
            <KPICard
              label={t("tatlas.metric.countryCount")}
              value={metrics.countryCount}
              icon={<Globe2 size={20} />}
              color={METRIC_COLOR.country}
              contextText={t("tatlas.metric.countryCountNote")}
            />
          </div>
          <div className="flex">
            <KPICard
              label={t("tatlas.metric.newInvestment")}
              value={metrics.newInvestmentCount}
              icon={<Sparkles size={20} />}
              color={METRIC_COLOR.newInvestment}
              contextText={t("tatlas.metric.newInvestmentNote")}
            />
          </div>
          <div className="flex">
            {/* progress verildiğinde kart CircularProgress ring'ini gösteriyor */}
            <KPICard
              label={t("tatlas.metric.avgProgress")}
              value={metrics.avgProgress}
              suffix="%"
              icon={<TrendingUp size={20} />}
              color={METRIC_COLOR.progress}
              progress={metrics.avgProgress}
              contextText={t("tatlas.metric.avgProgressNote")}
            />
          </div>
          <div className="flex">
            <KPICard
              label={t("tatlas.metric.riskyCount")}
              value={metrics.riskyCount}
              icon={<AlertTriangle size={20} />}
              color={METRIC_COLOR.risk}
              contextText={t("tatlas.metric.riskyNote")}
            />
          </div>
        </div>
      </section>

      {/* ── Kırılım panelleri ── */}
      <section>
        <SectionTitle icon={Boxes}>{t("tatlas.summary.breakdowns")}</SectionTitle>
        <div
          className={`grid grid-cols-1 gap-3 lg:grid-cols-2 ${
            SHOW_CAPEX_ON_ATLAS ? "xl:grid-cols-3" : "xl:grid-cols-2"
          }`}
        >
          <StatusDistributionPanel rows={breakdowns.byStatus} total={metrics.projectCount} />

          <BreakdownPanel
            icon={Globe2}
            color={DIM_COLOR.country}
            title={t("tatlas.panel.countByCountry")}
            rows={breakdowns.byCountry}
            labelOf={(k) => k}
            mode="count"
            locale={locale}
          />
          <BreakdownPanel
            icon={Hammer}
            color={DIM_COLOR.actionType}
            title={t("tatlas.panel.countByActionType")}
            rows={breakdowns.byActionType}
            labelOf={(k) => actionTypeLabel(k, t) || k}
            tooltipOf={(k) => actionTypeCodeAndLabel(k, t)}
            badgeOf={(k) => k}
            mode="count"
            locale={locale}
          />
          <BreakdownPanel
            icon={Boxes}
            color={DIM_COLOR.assetClass}
            title={t("tatlas.panel.countByAssetClass")}
            rows={breakdowns.byAssetClass}
            labelOf={(k) => assetClassLabel(k, t) || k}
            tooltipOf={(k) => assetClassCodeAndLabel(k, t)}
            badgeOf={(k) => k}
            mode="count"
            locale={locale}
          />

          {/* CAPEX kırılımları — bkz. src/config/tatlasDisplay.ts. Veri
              girilmeye başlandığında o bayrak `true` yapılınca geri gelir. */}
          {SHOW_CAPEX_ON_ATLAS && (
            <>
            <BreakdownPanel
              icon={Globe2}
              color={DIM_COLOR.capex}
              title={t("tatlas.panel.capexByCountry")}
              rows={breakdowns.byCountry}
              labelOf={(k) => k}
              mode="capex"
              locale={locale}
            />
            <BreakdownPanel
              icon={Hammer}
              color={DIM_COLOR.capex}
              title={t("tatlas.panel.capexByActionType")}
              rows={breakdowns.byActionType}
              labelOf={(k) => actionTypeLabel(k, t) || k}
              tooltipOf={(k) => actionTypeCodeAndLabel(k, t)}
              badgeOf={(k) => k}
              mode="capex"
              locale={locale}
            />
            <BreakdownPanel
              icon={Boxes}
              color={DIM_COLOR.capex}
              title={t("tatlas.panel.capexByAssetClass")}
              rows={breakdowns.byAssetClass}
              labelOf={(k) => assetClassLabel(k, t) || k}
              tooltipOf={(k) => assetClassCodeAndLabel(k, t)}
              badgeOf={(k) => k}
              mode="capex"
              locale={locale}
            />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── Bölüm başlığı ── */
function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5">
      <Icon size={13} className="text-tyro-text-muted" />
      <p className="text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted">
        {children}
      </p>
    </div>
  );
}

/* ── Durum dağılımı ── */
function StatusDistributionPanel({ rows, total }: { rows: BreakdownRow[]; total: number }) {
  const { t } = useTranslation();
  const segments = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        pct: total ? (r.count / total) * 100 : 0,
        color: statusColor(r.key as EntityStatus),
      })),
    [rows, total]
  );

  return (
    <Panel icon={PieChart} color={statusColor("On Track")} title={t("tatlas.panel.statusDistribution")}>
      {segments.length === 0 ? (
        <EmptyRow />
      ) : (
        <>
          <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-tyro-bg">
            {segments.map((s) => (
              <div
                key={s.key}
                className="h-full transition-all duration-700"
                style={{ width: `${s.pct}%`, backgroundColor: s.color, minWidth: s.count ? 4 : 0 }}
                title={`${getStatusLabel(s.key as EntityStatus, t)}: ${s.count}`}
              />
            ))}
          </div>
          <ul className="flex flex-col gap-1.5">
            {segments.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[11px] text-tyro-text-secondary">
                  {getStatusLabel(s.key as EntityStatus, t)}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-tyro-text-muted">
                  %{Math.round(s.pct)}
                </span>
                <span
                  className="w-7 shrink-0 text-right text-[12px] font-bold tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.count}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

/* ── Adet / CAPEX kırılımı ── */
function BreakdownPanel({
  icon,
  color,
  title,
  rows,
  labelOf,
  tooltipOf,
  badgeOf,
  mode,
  locale,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  rows: BreakdownRow[];
  labelOf: (key: string) => string;
  /** Satır üzerine gelince gösterilecek tam metin (kod — ad) */
  tooltipOf?: (key: string) => string;
  /** Satır başında gösterilecek kısa kod rozeti */
  badgeOf?: (key: string) => string;
  mode: "count" | "capex";
  locale: string;
}) {
  const { t } = useTranslation();
  const visible = mode === "capex" ? rows.filter((r) => r.capex > 0) : rows;
  const max = Math.max(
    1,
    ...visible.map((r) => (mode === "capex" ? r.capex : r.count))
  );

  return (
    <Panel icon={icon} color={color} title={title}>
      {rows.length === 0 ? (
        <EmptyRow />
      ) : visible.length === 0 ? (
        <p className="py-1.5 text-[11px] text-tyro-text-muted">{t("tatlas.panel.noCapex")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((r) => {
            const val = mode === "capex" ? r.capex : r.count;
            return (
              <li key={r.key} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  {badgeOf && (
                    <span
                      className="shrink-0 rounded bg-tyro-bg px-1 py-px text-[10px] font-bold tabular-nums"
                      style={{ color }}
                    >
                      {badgeOf(r.key)}
                    </span>
                  )}
                  <span
                    className="min-w-0 flex-1 truncate text-[11px] text-tyro-text-secondary"
                    title={tooltipOf ? tooltipOf(r.key) : labelOf(r.key)}
                  >
                    {labelOf(r.key)}
                  </span>
                  <span
                    className="shrink-0 text-[12px] font-bold tabular-nums text-tyro-text-primary"
                    title={mode === "capex" ? formatCapex(r.capex, locale) : undefined}
                  >
                    {mode === "capex" ? formatCapexCompact(r.capex, locale) : r.count}
                  </span>
                </div>
                <span className="block h-1.5 w-full overflow-hidden rounded-full bg-tyro-bg">
                  <span
                    className="block h-full rounded-full transition-all duration-700"
                    style={{ width: `${(val / max) * 100}%`, backgroundColor: color, opacity: 0.8 }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ── Panel kabuğu ── */
function Panel({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-card flex flex-col p-3.5">
      <div className="mb-3 flex items-center gap-2">
        {/* Nötr zemin + renkli ikon: renkler CSS token (var(--tyro-*)) olduğu
            için `${color}16` gibi alfa eklemesi geçersiz CSS üretir. KPICard da
            aynı şekilde davranıyor, görünüm tutarlı kalıyor. */}
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-tyro-bg"
          style={{ color }}
        >
          <Icon size={12} strokeWidth={2.2} />
        </span>
        <p className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wider text-tyro-text-secondary">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function EmptyRow() {
  const { t } = useTranslation();
  return <p className="py-1.5 text-[11px] text-tyro-text-muted">{t("common.noRecords")}</p>;
}
