import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Tooltip } from "@heroui/react";
import { X, ArrowLeft, ArrowUpRight, MapPin, AlertTriangle, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { statusColor } from "@/lib/colorUtils";
import { formatDate } from "@/lib/dateUtils";
import { formatCapex } from "@/lib/money";
import {
  assetClassLabel,
  actionTypeLabel,
  assetClassCodeAndLabel,
  actionTypeCodeAndLabel,
} from "@/config/projectTaxonomy";
import { assetClassIcon } from "@/config/assetClassIcons";
import { formatLocationLabel } from "@/lib/locations";
import type { AtlasPoint } from "@/lib/investmentPortfolio";
import type { Proje } from "@/types";

/**
 * Pin popup kartı (doküman §6).
 *
 * Kartın TÜM içeriği proje kaydından okunur — harita tarafında hiçbir alan
 * yeniden girilmez. "Proje detayını aç" sağ paneli açar; sayfa terk edilmediği
 * için filtreler ve zoom korunur.
 *
 * TASARIM KARARLARI (kullanıcı raporu: "kartın isminde metinler sığmıyor"):
 *
 * 1. HİÇBİR BİLGİ KIRPILMIYOR. Önceki sürüm iki taksonomi eksenini tek satırda
 *    birleştirip `truncate` ediyordu; "AST-PORT — Liman ve Deniz Altyapısı ·
 *    ACT-…" diye kesiliyordu. Artık her eksen kendi satırında, kod bir mono
 *    rozet + ad serbest sarmalı metin olarak duruyor.
 * 2. BAŞLIK HİYERARŞİSİ: kimlik (proje ID) → ad (2 satıra kadar sarar, kesilmez)
 *    → statü. Ad kartın en büyük öğesi; kullanıcı önce neye baktığını görüyor.
 * 3. STATÜ, uygulamanın kendi `StatusBadge`'i — düz metin satırı değil. Renk ve
 *    ifade her ekranda aynı, tooltip'i de eşiği açıklıyor.
 * 4. Etiket/değer satırlarında değerler SARMALI (truncate yok); etiket kolonu
 *    sabit genişlikte, sayılar tabular.
 * 5. Escape kartı kapatır; kart `role="dialog"` ve erişilebilir bir adla
 *    duyuruluyor.
 */
interface Props {
  points: AtlasPoint[];
  /** Koordinat ülke merkezinden türetildiyse kullanıcıya söylüyoruz */
  approximate: boolean;
  onClose: () => void;
  onOpenProje: (proje: Proje) => void;
}

export default function TAtlasPinPopup({ points, approximate, onClose, onOpenProje }: Props) {
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(
    points.length === 1 ? points[0].proje.id : null
  );

  const active = selectedId ? points.find((p) => p.proje.id === selectedId) : undefined;
  const isList = !active;

  // Escape: kümede tek proje varsa kartı kapat, listeden gelindiyse listeye dön
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (active && points.length > 1) setSelectedId(null);
      else onClose();
    },
    [active, points.length, onClose]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div
      role="dialog"
      aria-label={t("tatlas.popup.ariaLabel")}
      className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-3 sm:w-[340px]"
    >
      <div className="flex max-h-[340px] flex-col overflow-hidden rounded-card border border-tyro-border/40 bg-tyro-surface/97 shadow-2xl backdrop-blur-xl sm:max-h-[calc(100%-1.5rem)]">
        {isList ? (
          <ClusterList points={points} onSelect={setSelectedId} onClose={onClose} />
        ) : (
          <ProjectCard
            point={active}
            approximate={approximate}
            locale={i18n.language}
            showBack={points.length > 1}
            onBack={() => setSelectedId(null)}
            onClose={onClose}
            onOpenProje={onOpenProje}
          />
        )}
      </div>
    </div>
  );
}

/* ── Aynı koordinatta birden fazla proje ── */
function ClusterList({
  points,
  onSelect,
  onClose,
}: {
  points: AtlasPoint[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <header className="flex shrink-0 items-start justify-between gap-2 px-4 pb-2.5 pt-3.5">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-tyro-text-primary">
            <MapPin size={14} className="shrink-0 text-tyro-gold" />
            <span className="min-w-0 break-words">{formatLocationLabel(points[0].location)}</span>
          </span>
          <p className="mt-0.5 text-[11px] text-tyro-text-muted">
            {t("tatlas.popup.groupCount", { count: points.length })}
          </p>
        </div>
        <IconButton label={t("common.close")} onPress={onClose} icon={<X size={14} />} />
      </header>

      <Divider className="shrink-0 bg-tyro-border/25" />

      <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {points.map(({ proje }) => {
          const Icon = assetClassIcon(proje.assetClass);
          const color = statusColor(proje.status);
          return (
            <li key={proje.id}>
              <button
                type="button"
                onClick={() => onSelect(proje.id)}
                className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-tyro-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-tyro-gold/50"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 bg-tyro-surface"
                  style={{ borderColor: color, color }}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-tyro-text-primary">
                    {proje.name}
                  </span>
                  <span className="block text-[11px] tabular-nums text-tyro-text-muted">
                    {proje.id} · %{proje.progress}
                  </span>
                </span>
                <ChevronRight
                  size={14}
                  className="shrink-0 text-tyro-text-muted/40 transition-colors group-hover:text-tyro-navy"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ── Tek proje künyesi ── */
function ProjectCard({
  point,
  approximate,
  locale,
  showBack,
  onBack,
  onClose,
  onOpenProje,
}: {
  point: AtlasPoint;
  approximate: boolean;
  locale: string;
  showBack: boolean;
  onBack: () => void;
  onClose: () => void;
  onOpenProje: (proje: Proje) => void;
}) {
  const { t } = useTranslation();
  const { proje, location } = point;
  const color = statusColor(proje.status);
  const AssetIcon = assetClassIcon(proje.assetClass);

  return (
    <>
      {/* Statü şeridi — kart açılır açılmaz durum okunur (doküman §6/1) */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: color }} />

      <header className="shrink-0 px-4 pb-3 pt-3">
        {/* Kimlik + aksiyonlar */}
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold tabular-nums text-tyro-text-muted">
            {proje.id}
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            {showBack && (
              <IconButton label={t("common.goBack")} onPress={onBack} icon={<ArrowLeft size={14} />} />
            )}
            <IconButton label={t("common.close")} onPress={onClose} icon={<X size={14} />} />
          </div>
        </div>

        {/* Ad — kartın birincil öğesi, iki satıra kadar sarar, KESİLMEZ */}
        <button
          type="button"
          onClick={() => onOpenProje(proje)}
          title={proje.name}
          className="block w-full cursor-pointer text-left text-[14px] font-bold leading-snug text-tyro-text-primary transition-colors hover:text-tyro-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-tyro-gold/50"
        >
          <span className="line-clamp-2 break-words">{proje.name}</span>
        </button>

        <div className="mt-2">
          <StatusBadge status={proje.status} />
        </div>
      </header>

      <Divider className="shrink-0 bg-tyro-border/25" />

      {/* Künye — değerler sarmalı, hiçbir bilgi kırpılmıyor */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2.5">
        <dl className="flex flex-col gap-2">
          {/* Taksonomi: her eksen kendi satırında, kod mono rozet olarak */}
          <TaxonomyRow
            label={t("common.assetClass")}
            code={proje.assetClass}
            name={assetClassLabel(proje.assetClass, t)}
            title={assetClassCodeAndLabel(proje.assetClass, t)}
            icon={<AssetIcon size={11} strokeWidth={2.2} />}
          />
          <TaxonomyRow
            label={t("common.actionType")}
            code={proje.actionType}
            name={actionTypeLabel(proje.actionType, t)}
            title={actionTypeCodeAndLabel(proje.actionType, t)}
          />

          <Row label={t("common.location")} value={formatLocationLabel(location) || "—"} />
          <Row label={t("common.source")} value={proje.source} />
          <Row label={t("common.owner")} value={proje.owner || "—"} />
          <Row
            label={t("common.capex")}
            value={formatCapex(proje.capexUsd, locale) || "—"}
            numeric
          />
          <Row label={t("common.endDate")} value={formatDate(proje.endDate)} numeric />
        </dl>

        {/* İlerleme */}
        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[11px] font-medium text-tyro-text-muted">
              {t("common.progress")}
            </span>
            <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
              %{proje.progress}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={proje.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-tyro-bg"
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${proje.progress}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {approximate && (
          <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-700">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            {t("tatlas.popup.approximate")}
          </p>
        )}
      </div>

      {/* Ana aksiyon — tam genişlik, footer'da sabit */}
      <div className="shrink-0 border-t border-tyro-border/25 p-2.5">
        <Button
          size="sm"
          variant="flat"
          fullWidth
          onPress={() => onOpenProje(proje)}
          startContent={<ArrowUpRight size={14} />}
          className="h-9 font-semibold"
        >
          {t("tatlas.popup.openDetail")}
        </Button>
      </div>
    </>
  );
}

/* ── Taksonomi satırı: [KOD] Ad ── */
function TaxonomyRow({
  label,
  code,
  name,
  title,
  icon,
}: {
  label: string;
  code: string | undefined;
  name: string;
  title: string;
  icon?: React.ReactNode;
}) {
  if (!code) {
    return <Row label={label} value="—" />;
  }
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="w-[76px] shrink-0 pt-0.5 text-[11px] text-tyro-text-muted">{label}</dt>
      <dd className="min-w-0 flex-1">
        <Tooltip content={title} size="sm" placement="left">
          <span className="flex cursor-default flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-tyro-bg px-1.5 py-px text-[10px] font-bold tabular-nums text-tyro-text-secondary">
              {icon}
              {code}
            </span>
            <span className="break-words text-right text-[12px] font-medium text-tyro-text-primary">
              {name}
            </span>
          </span>
        </Tooltip>
      </dd>
    </div>
  );
}

/* ── Etiket / değer satırı — değer sarmalı ── */
function Row({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="w-[76px] shrink-0 text-[11px] text-tyro-text-muted">{label}</dt>
      <dd
        className={`min-w-0 flex-1 break-words text-right text-[12px] font-medium text-tyro-text-primary ${
          numeric ? "tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/* ── Küçük ikon butonu ── */
function IconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Tooltip content={label} size="sm" closeDelay={0}>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        aria-label={label}
        onPress={onPress}
        className="h-7 w-7 min-w-7 text-tyro-text-muted"
      >
        {icon}
      </Button>
    </Tooltip>
  );
}
