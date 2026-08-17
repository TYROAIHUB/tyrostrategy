import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Crosshair,
  Banknote,
  Globe2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import { formatCapex, formatCapexCompact } from "@/lib/money";
import { assetClassLabel, actionTypeLabel } from "@/config/projectTaxonomy";
import type { AtlasBreakdowns, BreakdownRow, PortfolioMetrics } from "@/lib/investmentPortfolio";
import type { EntityStatus } from "@/types";

/**
 * Yatırım portföyü özeti (doküman §7).
 *
 * Haritanın hemen altında; altı özet kartı ve kırılım panelleri FİLTRELENMİŞ
 * kümeden canlı hesaplanır. Sayılar `computePortfolioMetrics` /
 * `computeBreakdowns`'tan gelir — haritadaki pin kümesiyle aynı kaynak,
 * dolayısıyla "haritada görünen küme ile özetteki sayılar her zaman aynı".
 *
 * Doküman yedi panel listeliyor; bunlar aslında dört kırılımın "adet" ve
 * "CAPEX" görünümleri: durum dağılımı + (ülke/tip/sınıf × adet) +
 * (ülke/tip/sınıf × CAPEX).
 */
interface Props {
  metrics: PortfolioMetrics;
  breakdowns: AtlasBreakdowns;
}

export default function TAtlasSummary({ metrics, breakdowns }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const capexMissing = metrics.projectCount > 0 && metrics.capexEnteredCount === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Altı özet kartı ── */}
      <div>
        <SectionTitle>{t("tatlas.summary.cards")}</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            icon={Crosshair}
            label={t("tatlas.metric.projectCount")}
            value={metrics.projectCount}
          />
          <MetricCard
            icon={Banknote}
            label={t("tatlas.metric.totalCapex")}
            // Tutar kartı sayaç yerine biçimli metin — "1,25 Mn USD" okunur
            display={formatCapexCompact(metrics.totalCapex, locale) || `0 USD`}
            title={formatCapex(metrics.totalCapex, locale)}
            note={
              capexMissing
                ? t("tatlas.metric.capexMissing")
                : metrics.capexEnteredCount < metrics.projectCount
                  ? t("tatlas.metric.capexPartial", {
                      entered: metrics.capexEnteredCount,
                      total: metrics.projectCount,
                    })
                  : undefined
            }
          />
          <MetricCard
            icon={Globe2}
            label={t("tatlas.metric.countryCount")}
            value={metrics.countryCount}
          />
          <MetricCard
            icon={Sparkles}
            label={t("tatlas.metric.newInvestment")}
            value={metrics.newInvestmentCount}
            note={t("tatlas.metric.newInvestmentNote")}
          />
          <MetricCard
            icon={TrendingUp}
            label={t("tatlas.metric.avgProgress")}
            value={metrics.avgProgress}
            suffix="%"
          />
          <MetricCard
            icon={AlertTriangle}
            label={t("tatlas.metric.riskyCount")}
            value={metrics.riskyCount}
            accent={metrics.riskyCount > 0 ? statusColor("High Risk") : undefined}
            note={t("tatlas.metric.riskyNote")}
          />
        </div>
      </div>

      {/* ── Kırılım panelleri ── */}
      <div>
        <SectionTitle>{t("tatlas.summary.breakdowns")}</SectionTitle>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
          <StatusDistributionPanel rows={breakdowns.byStatus} total={metrics.projectCount} />

          <CountPanel
            title={t("tatlas.panel.countByCountry")}
            rows={breakdowns.byCountry}
            labelOf={(k) => k}
          />
          <CountPanel
            title={t("tatlas.panel.countByActionType")}
            rows={breakdowns.byActionType}
            labelOf={(k) => actionTypeLabel(k, t) || k}
          />
          <CountPanel
            title={t("tatlas.panel.countByAssetClass")}
            rows={breakdowns.byAssetClass}
            labelOf={(k) => assetClassLabel(k, t) || k}
          />

          <CapexPanel
            title={t("tatlas.panel.capexByCountry")}
            rows={breakdowns.byCountry}
            labelOf={(k) => k}
            locale={locale}
          />
          <CapexPanel
            title={t("tatlas.panel.capexByActionType")}
            rows={breakdowns.byActionType}
            labelOf={(k) => actionTypeLabel(k, t) || k}
            locale={locale}
          />
          <CapexPanel
            title={t("tatlas.panel.capexByAssetClass")}
            rows={breakdowns.byAssetClass}
            labelOf={(k) => assetClassLabel(k, t) || k}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

// ── Parçalar ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted">
      {children}
    </p>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  display,
  suffix,
  note,
  accent,
  title,
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  /** Sayaç yerine hazır metin (tutar gibi biçimli değerler) */
  display?: string;
  suffix?: string;
  note?: string;
  accent?: string;
  title?: string;
}) {
  return (
    <GlassCard className="rounded-card p-3">
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-tyro-bg"
          style={accent ? { color: accent } : undefined}
        >
          <Icon size={14} className={accent ? undefined : "text-tyro-gold"} />
        </span>
      </div>
      <p
        className="mt-2 text-[18px] font-bold leading-none tabular-nums text-tyro-text-primary"
        style={accent ? { color: accent } : undefined}
        title={title}
      >
        {display !== undefined ? (
          display
        ) : (
          <AnimatedCounter value={value ?? 0} suffix={suffix ?? ""} />
        )}
      </p>
      <p className="mt-1.5 text-[11px] font-semibold text-tyro-text-secondary">{label}</p>
      {note && <p className="mt-0.5 text-[11px] text-tyro-text-muted">{note}</p>}
    </GlassCard>
  );
}

/** Durum dağılımı — yığılmış çubuk + adetler (doküman: "yığılmış çubuk"). */
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
    <Panel title={t("tatlas.panel.statusDistribution")}>
      {segments.length === 0 ? (
        <EmptyRow />
      ) : (
        <>
          <div className="mb-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-tyro-bg">
            {segments.map((s) => (
              <div
                key={s.key}
                className="h-full transition-all duration-700"
                style={{ width: `${s.pct}%`, backgroundColor: s.color, minWidth: s.count ? 3 : 0 }}
                title={`${getStatusLabel(s.key as EntityStatus, t)}: ${s.count}`}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {segments.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-tyro-text-secondary">
                  {getStatusLabel(s.key as EntityStatus, t)}
                </span>
                <span className="text-[11px] font-bold tabular-nums text-tyro-text-primary">
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

/** Adet kırılımı — yatay bar + sayı. */
function CountPanel({
  title,
  rows,
  labelOf,
}: {
  title: string;
  rows: BreakdownRow[];
  labelOf: (key: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <EmptyRow />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2">
              <span
                className="w-[104px] shrink-0 truncate text-[11px] text-tyro-text-secondary"
                title={labelOf(r.key)}
              >
                {labelOf(r.key)}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-tyro-bg">
                <span
                  className="block h-full rounded-full bg-tyro-gold/70 transition-all duration-700"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </span>
              <span className="w-7 shrink-0 text-right text-[11px] font-bold tabular-nums text-tyro-text-primary">
                {r.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** CAPEX kırılımı — USD toplamı. Hiç CAPEX girilmemişse bunu açıkça söyler. */
function CapexPanel({
  title,
  rows,
  labelOf,
  locale,
}: {
  title: string;
  rows: BreakdownRow[];
  labelOf: (key: string) => string;
  locale: string;
}) {
  const { t } = useTranslation();
  const withCapex = rows.filter((r) => r.capex > 0);
  const max = Math.max(1, ...withCapex.map((r) => r.capex));

  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <EmptyRow />
      ) : withCapex.length === 0 ? (
        <p className="py-2 text-[11px] text-tyro-text-muted">{t("tatlas.panel.noCapex")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {withCapex.map((r) => (
            <li key={r.key} className="flex items-center gap-2">
              <span
                className="w-[104px] shrink-0 truncate text-[11px] text-tyro-text-secondary"
                title={labelOf(r.key)}
              >
                {labelOf(r.key)}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-tyro-bg">
                <span
                  className="block h-full rounded-full bg-tyro-navy/60 transition-all duration-700"
                  style={{ width: `${(r.capex / max) * 100}%` }}
                />
              </span>
              <span
                className="shrink-0 text-right text-[11px] font-bold tabular-nums text-tyro-text-primary"
                title={formatCapex(r.capex, locale)}
              >
                {formatCapexCompact(r.capex, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-card p-3.5">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-tyro-text-secondary">
        {title}
      </p>
      {children}
    </div>
  );
}

function EmptyRow() {
  const { t } = useTranslation();
  return <p className="py-2 text-[11px] text-tyro-text-muted">{t("common.noRecords")}</p>;
}
