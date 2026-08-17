import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectItem, Button } from "@heroui/react";
import { RotateCcw } from "lucide-react";
import { assetClassLabel, actionTypeLabel } from "@/config/projectTaxonomy";
import { getStatusLabel } from "@/lib/constants";
import { hexToHSL } from "@/lib/colorUtils";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import type { AtlasFilters, AtlasFilterOptions } from "@/lib/investmentPortfolio";
import { hasActiveFilters } from "@/lib/investmentPortfolio";

/**
 * Filtre satırı (doküman §7).
 *
 * Dört çoklu seçim grubu + sıfırlama. Grup İÇİNDE VEYA, gruplar ARASINDA VE —
 * mantık `applyAtlasFilters` içinde; bu bileşen yalnızca seçimi yönetiyor.
 *
 * Seçenekler portföyde FİİLEN bulunan değerlerden geliyor (boş sonuç veren
 * seçim sunmuyoruz) — projeler sayfasındaki departman dropdown'ı ile aynı
 * yaklaşım.
 */
interface Props {
  filters: AtlasFilters;
  options: AtlasFilterOptions;
  onChange: (next: AtlasFilters) => void;
  /** Filtre uygulandıktan sonra kalan proje adedi — kullanıcı etkiyi görsün */
  resultCount: number;
}

export default function TAtlasFilters({ filters, options, onChange, resultCount }: Props) {
  const { t } = useTranslation();
  const theme = useSidebarTheme();

  const setGroup = useCallback(
    (group: keyof AtlasFilters, keys: "all" | Set<React.Key>) => {
      // HeroUI "all" gönderebiliyor — o durumda tüm seçenekleri işaretliyoruz
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

  const selectClassNames = {
    trigger: "border-tyro-border h-9 min-h-9",
    value: "text-[12px] font-semibold text-tyro-text-primary",
    label: "text-[11px]",
  };

  return (
    <div className="glass-card rounded-card px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t("common.assetClass")}
          selectionMode="multiple"
          selectedKeys={new Set(filters.assetClasses)}
          onSelectionChange={(k) => setGroup("assetClasses", k)}
          placeholder={t("common.assetClass")}
          variant="bordered"
          size="sm"
          isDisabled={options.assetClasses.length === 0}
          className="w-full sm:w-[190px]"
          classNames={selectClassNames}
          renderValue={(items) => (
            <span className="text-[12px] font-semibold">
              {t("common.assetClass")}
              {items.length > 0 ? ` · ${items.length}` : ""}
            </span>
          )}
        >
          {options.assetClasses.map((code) => (
            <SelectItem key={code} textValue={assetClassLabel(code, t)}>
              {assetClassLabel(code, t)}
            </SelectItem>
          ))}
        </Select>

        <Select
          aria-label={t("common.actionType")}
          selectionMode="multiple"
          selectedKeys={new Set(filters.actionTypes)}
          onSelectionChange={(k) => setGroup("actionTypes", k)}
          placeholder={t("common.actionType")}
          variant="bordered"
          size="sm"
          isDisabled={options.actionTypes.length === 0}
          className="w-full sm:w-[175px]"
          classNames={selectClassNames}
          renderValue={(items) => (
            <span className="text-[12px] font-semibold">
              {t("common.actionType")}
              {items.length > 0 ? ` · ${items.length}` : ""}
            </span>
          )}
        >
          {options.actionTypes.map((code) => (
            <SelectItem key={code} textValue={actionTypeLabel(code, t)}>
              {actionTypeLabel(code, t)}
            </SelectItem>
          ))}
        </Select>

        <Select
          aria-label={t("tatlas.filter.country")}
          selectionMode="multiple"
          selectedKeys={new Set(filters.countries)}
          onSelectionChange={(k) => setGroup("countries", k)}
          placeholder={t("tatlas.filter.country")}
          variant="bordered"
          size="sm"
          isDisabled={options.countries.length === 0}
          className="w-full sm:w-[150px]"
          classNames={selectClassNames}
          renderValue={(items) => (
            <span className="text-[12px] font-semibold">
              {t("tatlas.filter.country")}
              {items.length > 0 ? ` · ${items.length}` : ""}
            </span>
          )}
        >
          {options.countries.map((c) => (
            <SelectItem key={c} textValue={c}>
              {c}
            </SelectItem>
          ))}
        </Select>

        <Select
          aria-label={t("common.status")}
          selectionMode="multiple"
          selectedKeys={new Set(filters.statuses)}
          onSelectionChange={(k) => setGroup("statuses", k)}
          placeholder={t("common.status")}
          variant="bordered"
          size="sm"
          isDisabled={options.statuses.length === 0}
          className="w-full sm:w-[150px]"
          classNames={selectClassNames}
          renderValue={(items) => (
            <span className="text-[12px] font-semibold">
              {t("common.status")}
              {items.length > 0 ? ` · ${items.length}` : ""}
            </span>
          )}
        >
          {options.statuses.map((s) => (
            <SelectItem key={s} textValue={getStatusLabel(s, t)}>
              {getStatusLabel(s, t)}
            </SelectItem>
          ))}
        </Select>

        <Button
          size="sm"
          variant="light"
          onPress={reset}
          isDisabled={!active}
          startContent={<RotateCcw size={13} />}
          className="h-9 font-semibold text-tyro-text-secondary"
          style={{ "--heroui-primary": hexToHSL(theme.accentColor) } as React.CSSProperties}
        >
          {t("tatlas.filter.reset")}
        </Button>

        {/* Filtrenin etkisi — haritadaki küme ile bu sayı her zaman aynı */}
        <span className="ml-auto shrink-0 text-[11px] font-semibold text-tyro-text-muted tabular-nums">
          {t("tatlas.filter.resultCount", { count: resultCount })}
        </span>
      </div>
    </div>
  );
}
