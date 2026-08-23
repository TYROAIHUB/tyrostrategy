import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { ChevronDown, RotateCcw, Boxes, Hammer, Globe2, CircleDot, type LucideIcon } from "lucide-react";
import {
  assetClassCodeAndLabel,
  actionTypeCodeAndLabel,
} from "@/config/projectTaxonomy";
import { getStatusLabel } from "@/lib/constants";
import { statusColor } from "@/lib/colorUtils";
import type { AtlasFilters, AtlasFilterOptions } from "@/lib/investmentPortfolio";
import { hasActiveFilters } from "@/lib/investmentPortfolio";
import type { EntityStatus } from "@/types";
import TAtlasLegend from "./TAtlasLegend";

/**
 * Filtre satırı (doküman §7).
 *
 * Uygulamanın yerleşik filtre desenini kullanıyor: Dropdown + flat Button
 * (ikon + ChevronDown), seçim varken buton renklenir — Projeler sayfasındaki
 * statü/etiket filtreleriyle birebir aynı dil. İlk sürümde HeroUI `Select`
 * kullanmıştım; sabit genişlikli trigger uzun etiketleri kırpıyordu
 * ("Yardımcı Tesisler, HSE ve Teknik Sistemler" görünmüyordu). Dropdown
 * popover'ı trigger'dan bağımsız genişleyebildiği için tam ad sığıyor.
 *
 * Sabit seçim listelerinde KOD — AD birlikte gösteriliyor: kodlar Excel ve
 * raporlarda birincil anahtar, kullanıcı hangi kodu seçtiğini görmek istiyor.
 *
 * Mantık burada değil: grup içi VEYA / gruplar arası VE `applyAtlasFilters`
 * içinde. Bu bileşen yalnızca seçimi yönetir.
 */
interface Props {
  filters: AtlasFilters;
  options: AtlasFilterOptions;
  onChange: (next: AtlasFilters) => void;
  /** Filtre sonrası haritada kalan proje adedi */
  resultCount: number;
}

export default function TAtlasFilters({ filters, options, onChange, resultCount }: Props) {
  const { t } = useTranslation();

  const setGroup = useCallback(
    (group: keyof AtlasFilters, keys: "all" | Set<React.Key>) => {
      const next =
        keys === "all"
          ? [...(options[group] as string[])]
          : Array.from(keys).map(String).filter(Boolean);
      onChange({ ...filters, [group]: next });
    },
    [filters, options, onChange]
  );

  const reset = useCallback(() => {
    onChange({ assetClasses: [], actionTypes: [], countries: [], statuses: [] });
  }, [onChange]);

  const active = hasActiveFilters(filters);

  return (
    <div className="glass-card rounded-card px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* ── Varlık sınıfı ── */}
        <FilterDropdown
          icon={Boxes}
          label={t("common.assetClass")}
          selected={filters.assetClasses}
          options={options.assetClasses}
          renderOption={(code) => assetClassCodeAndLabel(code, t)}
          onSelectionChange={(k) => setGroup("assetClasses", k)}
        />

        {/* ── Yatırım tipi ── */}
        <FilterDropdown
          icon={Hammer}
          label={t("common.actionType")}
          selected={filters.actionTypes}
          options={options.actionTypes}
          renderOption={(code) => actionTypeCodeAndLabel(code, t)}
          onSelectionChange={(k) => setGroup("actionTypes", k)}
        />

        {/* ── Ülke ── */}
        <FilterDropdown
          icon={Globe2}
          label={t("tatlas.filter.country")}
          selected={filters.countries}
          options={options.countries}
          renderOption={(c) => c}
          onSelectionChange={(k) => setGroup("countries", k)}
        />

        {/* ── Statü ── Renkli nokta ile, StatusBadge paletiyle aynı */}
        <FilterDropdown
          icon={CircleDot}
          label={t("common.status")}
          selected={filters.statuses}
          options={options.statuses}
          renderOption={(s) => getStatusLabel(s as EntityStatus, t)}
          dotColorOf={(s) => statusColor(s as EntityStatus)}
          onSelectionChange={(k) => setGroup("statuses", k)}
        />

        <Button
          size="sm"
          variant="light"
          onPress={reset}
          isDisabled={!active}
          startContent={<RotateCcw size={13} />}
          className="h-8 font-semibold text-tyro-text-secondary"
        >
          {t("tatlas.filter.reset")}
        </Button>

        {/* Lejant — Sıfırla'nın SAĞINDA, aynı satırda.
            basis-full'u kaldırmak yetmedi: lejant kalan boşluktan geniş
            olduğu için flex-wrap onu yine alt satıra atıyordu. Çözüm →
            `min-w-0 flex-1` ile kalan alanı veriyoruz ve lejant taşarsa
            KENDİ İÇİNDE yatay kayıyor. Böylece hiçbir genişlikte satır
            değiştirmiyor. */}
        <span aria-hidden className="h-5 w-px shrink-0 rounded-full bg-tyro-border/60" />
        <div className="min-w-0 flex-1">
          <TAtlasLegend />
        </div>

        {/* Filtrenin etkisi — haritadaki pin kümesiyle bu sayı her zaman aynı */}
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-tyro-text-muted">
          {t("tatlas.filter.resultCount", { count: resultCount })}
        </span>
      </div>

      {/* Seçili değerler — tam adlarıyla, kırpılmadan. Çok seçim yapıldığında
          buton etiketine sığmıyor; kullanıcı neyi filtrelediğini burada görür. */}
      {active && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-tyro-border/20 pt-2">
          {filters.assetClasses.map((c) => (
            <Chip key={`a-${c}`} onRemove={() => setGroup("assetClasses", new Set(filters.assetClasses.filter((x) => x !== c)))}>
              {assetClassCodeAndLabel(c, t)}
            </Chip>
          ))}
          {filters.actionTypes.map((c) => (
            <Chip key={`t-${c}`} onRemove={() => setGroup("actionTypes", new Set(filters.actionTypes.filter((x) => x !== c)))}>
              {actionTypeCodeAndLabel(c, t)}
            </Chip>
          ))}
          {filters.countries.map((c) => (
            <Chip key={`c-${c}`} onRemove={() => setGroup("countries", new Set(filters.countries.filter((x) => x !== c)))}>
              {c}
            </Chip>
          ))}
          {filters.statuses.map((s) => (
            <Chip
              key={`s-${s}`}
              color={statusColor(s as EntityStatus)}
              onRemove={() => setGroup("statuses", new Set(filters.statuses.filter((x) => x !== s)))}
            >
              {getStatusLabel(s as EntityStatus, t)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tek filtre grubu ── */
function FilterDropdown({
  icon: Icon,
  label,
  selected,
  options,
  renderOption,
  dotColorOf,
  onSelectionChange,
}: {
  icon: LucideIcon;
  label: string;
  selected: string[];
  options: string[];
  renderOption: (key: string) => string;
  dotColorOf?: (key: string) => string;
  onSelectionChange: (keys: "all" | Set<React.Key>) => void;
}) {
  const count = selected.length;
  const isActive = count > 0;

  return (
    <Dropdown placement="bottom-start">
      <DropdownTrigger>
        <Button
          size="sm"
          variant="flat"
          isDisabled={options.length === 0}
          startContent={<Icon size={14} />}
          endContent={<ChevronDown size={14} />}
          className={`h-8 font-semibold ${isActive ? "border border-tyro-gold/40 bg-tyro-gold/10 text-tyro-gold" : ""}`}
        >
          {/* Tek seçimde değerin kendisini yaz — kullanıcı butona bakınca
              neyi filtrelediğini görsün. Çoklu seçimde adede düş. */}
          {count === 1 ? truncate(renderOption(selected[0]), 28) : count > 1 ? `${label} · ${count}` : label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={label}
        closeOnSelect={false}
        selectionMode="multiple"
        selectedKeys={new Set(selected)}
        onSelectionChange={onSelectionChange}
        // Popover trigger genişliğinden bağımsız — uzun etiketler tam görünür
        classNames={{ list: "min-w-[260px] max-w-[380px]" }}
        itemClasses={{ title: "text-[12px] whitespace-normal leading-snug" }}
      >
        {options.map((key) => (
          <DropdownItem
            key={key}
            textValue={renderOption(key)}
            startContent={
              dotColorOf ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColorOf(key) }}
                />
              ) : undefined
            }
          >
            {renderOption(key)}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

/* ── Seçili değer çipi ── */
function Chip({
  children,
  color,
  onRemove,
}: {
  children: React.ReactNode;
  color?: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors hover:opacity-80"
      style={
        color
          ? { borderColor: `${color}55`, backgroundColor: `${color}14`, color }
          : undefined
      }
    >
      {color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      <span className={color ? "" : "text-tyro-text-secondary"}>{children}</span>
      <span aria-hidden className={color ? "" : "text-tyro-text-muted"}>
        ×
      </span>
    </button>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
