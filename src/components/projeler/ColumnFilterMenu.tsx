import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Input,
} from "@heroui/react";
import { Filter, Search, X } from "lucide-react";

/**
 * Excel benzeri kolon filtresi (kullanıcı geri bildirimi).
 *
 * Tablo başlığındaki huni ikonuna tıklanınca o kolonun tablodaki BENZERSİZ
 * değerleri çoklu seçim listesi olarak açılır. Birden fazla kolon aynı anda
 * filtrelenebilir — kolonlar arası VE, kolon içi VEYA mantığı (Excel'deki
 * davranışın aynısı).
 *
 * Seçenekler tablodaki gerçek değerlerden üretilir; hiçbir projede olmayan
 * bir değer listede çıkmaz, dolayısıyla kullanıcı boş sonuç veren seçim
 * yapamaz. Uzun listelerde (proje lideri gibi) arama kutusu açılır.
 */
const SEARCH_THRESHOLD = 8;

export interface ColumnFilterOption {
  /** Filtreleme sırasında karşılaştırılan ham değer */
  key: string;
  /** Kullanıcıya gösterilen etiket (statü çevirisi, kod — ad vb.) */
  label: string;
  /** Opsiyonel renk noktası (statü / etiket) */
  color?: string;
  /** O değere sahip kayıt adedi — Excel'deki gibi yoğunluğu gösterir */
  count: number;
}

interface Props {
  /** Kolon başlığı — erişilebilirlik ve boş durum metni için */
  columnName: string;
  options: ColumnFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function ColumnFilterMenu({ columnName, options, selected, onChange }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return options;
    return options.filter((o) => o.label.toLocaleLowerCase("tr").includes(q));
  }, [options, query]);

  const isActive = selected.length > 0;
  const showSearch = options.length > SEARCH_THRESHOLD;

  if (options.length === 0) return null;

  return (
    <Dropdown placement="bottom-start" onClose={() => setQuery("")}>
      <DropdownTrigger>
        <button
          type="button"
          aria-label={t("table.filterColumn", { column: columnName })}
          // stopPropagation: başlık aynı zamanda sıralama tetikliyor, huniye
          // basınca tablo sıralaması değişmesin.
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`ml-1 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors ${
            isActive
              ? "bg-tyro-gold/15 text-tyro-gold"
              : "text-tyro-text-muted/50 hover:bg-tyro-bg hover:text-tyro-text-secondary"
          }`}
        >
          <Filter size={11} strokeWidth={2.5} />
        </button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label={t("table.filterColumn", { column: columnName })}
        closeOnSelect={false}
        selectionMode="multiple"
        selectedKeys={new Set(selected)}
        onSelectionChange={(keys) =>
          onChange(keys === "all" ? options.map((o) => o.key) : Array.from(keys).map(String))
        }
        topContent={
          <div className="flex flex-col gap-1.5 px-1 pb-1 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted">
                {columnName}
              </span>
              {isActive && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => onChange([])}
                  startContent={<X size={11} />}
                  className="h-6 min-w-0 px-1.5 text-[11px] font-semibold text-tyro-text-secondary"
                >
                  {t("common.clear")}
                </Button>
              )}
            </div>
            {showSearch && (
              <Input
                size="sm"
                variant="bordered"
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder={t("common.search")}
                startContent={<Search size={12} className="text-tyro-text-muted" />}
                classNames={{ inputWrapper: "h-7 min-h-7", input: "text-[12px]" }}
              />
            )}
          </div>
        }
        classNames={{ list: "min-w-[220px] max-w-[320px] max-h-[280px] overflow-y-auto" }}
        itemClasses={{ title: "text-[12px]" }}
        emptyContent={
          <span className="px-2 py-1 text-[11px] text-tyro-text-muted">
            {t("common.noResults")}
          </span>
        }
      >
        {visible.map((o) => (
          <DropdownItem
            key={o.key}
            textValue={o.label}
            startContent={
              o.color ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: o.color }}
                />
              ) : undefined
            }
            endContent={
              <span className="shrink-0 text-[11px] tabular-nums text-tyro-text-muted">
                {o.count}
              </span>
            }
          >
            {o.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
