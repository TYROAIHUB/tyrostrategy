import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import { formatCapex, formatCapexCompact } from "@/lib/money";
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
 * Görsel düzen notları (kullanıcı geri bildirimi: ilk sürüm yüzeyseldi —
 * hepsi aynı altın ikon, hizasız yazı, özensiz renk):
 *   • Her metriğin KENDİ rengi var; ikon o renkte tonlu bir çip içinde
 *   • Değer / etiket / not sabit bir dikey ritimde hizalı
 *   • Kırılım panelleri boyuta göre renk ayrımı yapıyor: adet panelleri
 *     kendi boyut rengini, CAPEX panelleri para yeşilini kullanıyor
 *   • Satır etiketleri sabit genişlikte, sayılar tabular-nums ve sağa dayalı
 */
interface Props {
  metrics: PortfolioMetrics;
  breakdowns: AtlasBreakdowns;
}

/** Metrik renkleri — statusColor paletiyle aynı aileden, her kart ayrı ton.
 *  MapLibre/inline stil bağlamında CSS değişkeni okunamadığı için literal hex;
 *  uygulamada colorUtils ve SOURCE_COLORS ile kurulmuş desen bu. */
const METRIC_COLOR = {
  project: "#1e3a5f", // tyro-navy
  capex: "#10b981", // emerald — para
  country: "#3b82f6", // mavi — coğrafya
  newInvestment: "#8b5cf6", // mor — yeni
  progress: "#c8922a", // tyro-gold
  risk: "#ef4444", // kırmızı — statusColor("High Risk") ile aynı
} as const;

/** Kırılım boyutlarının renkleri — filtre ikonlarıyla eşleşir */
const DIM_COLOR = {
  country: METRIC_COLOR.country,
  actionType: METRIC_COLOR.newInvestment,
  assetClass: METRIC_COLOR.progress,
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            icon={Crosshair}
            color={METRIC_COLOR.project}
            label={t("tatlas.metric.projectCount")}
            value={metrics.projectCount}
          />
          <MetricCard
            icon={Banknote}
            color={METRIC_COLOR.capex}
            label={t("tatlas.metric.totalCapex")}
            display={formatCapexCompact(metrics.totalCapex, locale) || "0 USD"}
            title={formatCapex(metrics.totalCapex, locale)}
            note={capexNote}
          />
          <MetricCard
            icon={Globe2}
            color={METRIC_COLOR.country}
            label={t("tatlas.metric.countryCount")}
            value={metrics.countryCount}
          />
          <MetricCard
            icon={Sparkles}
            color={METRIC_COLOR.newInvestment}
            label={t("tatlas.metric.newInvestment")}
            value={metrics.newInvestmentCount}
            note={t("tatlas.metric.newInvestmentNote")}
          />
          <MetricCard
            icon={TrendingUp}
            color={METRIC_COLOR.progress}
            label={t("tatlas.metric.avgProgress")}
            value={metrics.avgProgress}
            suffix="%"
            progress={metrics.avgProgress}
          />
          <MetricCard
            icon={AlertTriangle}
            color={METRIC_COLOR.risk}
            label={t("tatlas.metric.riskyCount")}
            value={metrics.riskyCount}
            note={t("tatlas.metric.riskyNote")}
            emphasize={metrics.riskyCount > 0}
          />
        </div>
      </section>

      {/* ── Kırılım panelleri ── */}
      <section>
        <SectionTitle icon={Boxes}>{t("tatlas.summary.breakdowns")}</SectionTitle>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
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

/* ── Özet kartı ── */
function MetricCard({
  icon: Icon,
  color,
  label,
  value,
  display,
  suffix,
  note,
  title,
  progress,
  emphasize,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  value?: number;
  /** Sayaç yerine hazır metin (biçimli tutarlar) */
  display?: string;
  suffix?: string;
  note?: string;
  title?: string;
  /** Verildiğinde kartın altına ince bir ilerleme çubuğu çizilir */
  progress?: number;
  /** Değeri kendi renginde vurgula (ör. riskli proje > 0) */
  emphasize?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass-card rounded-card relative flex flex-col overflow-hidden p-3.5"
    >
      {/* Sol kenarda metrik rengi — kartlar bir bakışta ayrışsın */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: color, opacity: 0.75 }}
      />

      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}16`, color }}
      >
        <Icon size={14} strokeWidth={2.2} />
      </span>

      <p
        className="mt-2.5 text-[19px] font-bold leading-none tabular-nums"
        style={{ color: emphasize ? color : undefined }}
        title={title}
      >
        {display !== undefined ? (
          <span className={emphasize ? undefined : "text-tyro-text-primary"}>{display}</span>
        ) : (
          <span className={emphasize ? undefined : "text-tyro-text-primary"}>
            <AnimatedCounter value={value ?? 0} suffix={suffix ?? ""} />
          </span>
        )}
      </p>

      <p className="mt-1.5 text-[11px] font-semibold leading-snug text-tyro-text-secondary">
        {label}
      </p>
      {/* Not satırı her kartta aynı yükseklikte yer tutar → değerler hizalı kalır */}
      <p className="mt-0.5 min-h-[14px] text-[11px] leading-snug text-tyro-text-muted">
        {note ?? ""}
      </p>

      {progress !== undefined && (
        <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-tyro-bg">
          <span
            className="block h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }}
          />
        </span>
      )}
    </motion.div>
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
                      className="shrink-0 rounded px-1 py-px text-[10px] font-bold tabular-nums"
                      style={{ backgroundColor: `${color}16`, color }}
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
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}16`, color }}
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
