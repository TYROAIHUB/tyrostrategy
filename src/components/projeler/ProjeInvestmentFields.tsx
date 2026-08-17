import { useMemo } from "react";
import { Controller, type Control, type FieldErrors, type FieldValues } from "react-hook-form";
import { Input, Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  getAssetClassOptions,
  getActionTypeOptions,
  assetClassCodeAndLabel,
  actionTypeCodeAndLabel,
} from "@/config/projectTaxonomy";
import { CAPEX_CURRENCY } from "@/lib/money";

/**
 * Yatırım alanları — CAPEX (USD) + Varlık sınıfı + Yatırım tipi.
 *
 * Üçü de OPSİYONEL ve hem ProjeForm (oluştur/düzenle) hem
 * StepProjeBasics (sihirbaz) tarafından kullanılıyor. Tek bileşen olması
 * iki formun görsel/davranışsal olarak ayrışmasını engelliyor — lokasyon
 * alanında iki yere ayrı ayrı yazdığımız JSX'in tekrarı olmasın diye.
 *
 * Form değerleri:
 *   • capexUsd    → STRING tutulur ("1.250.000" gibi girdi kabul edilsin),
 *                   submit'te parseCapexInput ile number'a çevrilir
 *   • assetClass  → "" | AST-*
 *   • actionType  → "" | ACT-*
 *
 * `labelClassName` iki formun farklı label ölçeğine uyum için: ProjeForm
 * 11px, wizard 12px kullanıyor.
 */
/**
 * `Control<FieldValues>` kullanıyoruz çünkü react-hook-form'da Control<T>
 * invariant: ProjeForm ve Wizard'ın şemaları farklı olduğu için generic bir
 * <T> ile iki çağrı yeri de tip hatası veriyor. Çağıranlar tek bir açık cast
 * ile geçiyor (aşağıdaki FIELD_* isimleri iki şemada da birebir aynı).
 */
interface Props {
  control: Control<FieldValues>;
  errors?: FieldErrors<FieldValues>;
  /** Wizard 12px, ProjeForm 11px label kullanıyor */
  labelClassName?: string;
}

const FIELD_CAPEX = "capexUsd";
const FIELD_ASSET = "assetClass";
const FIELD_ACTION = "actionType";

export default function ProjeInvestmentFields({
  control,
  errors,
  labelClassName = "block text-[11px] font-semibold text-tyro-text-secondary mb-1",
}: Props) {
  const { t } = useTranslation();
  const assetOptions = useMemo(() => getAssetClassOptions(t), [t]);
  const actionOptions = useMemo(() => getActionTypeOptions(t), [t]);

  const capexError = errors?.[FIELD_CAPEX]?.message as string | undefined;

  return (
    <>
      {/* ── CAPEX (USD) ── */}
      <Controller
        name={FIELD_CAPEX}
        control={control}
        render={({ field }) => (
          <div>
            <label className={labelClassName}>{t("forms.objective.capex")}</label>
            <Input
              value={(field.value as string) ?? ""}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={t("forms.objective.capexPlaceholder")}
              variant="bordered"
              size="sm"
              // Mobilde sayısal klavye açılsın; type="number" DEĞİL çünkü
              // kullanıcı "1.250.000" gibi ayırıcılı yazabilmeli
              inputMode="decimal"
              isInvalid={!!capexError}
              errorMessage={capexError}
              endContent={
                <span className="text-[11px] font-semibold text-tyro-text-muted shrink-0">
                  {CAPEX_CURRENCY}
                </span>
              }
              classNames={{
                inputWrapper: "border-tyro-border",
                input: "font-semibold text-tyro-text-primary tabular-nums",
              }}
            />
          </div>
        )}
      />

      {/* ── Varlık sınıfı + Yatırım tipi ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name={FIELD_ASSET}
          control={control}
          render={({ field }) => (
            <div>
              <label className={labelClassName}>{t("forms.objective.assetClass")}</label>
              <Select
                selectedKeys={field.value ? [field.value as string] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string | undefined;
                  field.onChange(val ?? "");
                }}
                variant="bordered"
                size="sm"
                classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
                placeholder={t("forms.objective.assetClassPlaceholder")}
                // Seçili değer kod ile birlikte görünsün (kullanıcı isteği)
                renderValue={(items) => (
                  <span className="truncate text-[13px] font-semibold">
                    {assetClassCodeAndLabel(String(items[0]?.key ?? ""), t)}
                  </span>
                )}
              >
                {assetOptions.map((opt) => (
                  <SelectItem key={opt.key} textValue={`${opt.code} ${opt.label}`}>
                    <span className="flex items-baseline gap-2">
                      <span className="shrink-0 rounded bg-tyro-bg px-1 py-px text-[10px] font-bold tabular-nums text-tyro-text-secondary">
                        {opt.code}
                      </span>
                      <span className="text-[13px] font-medium">{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </Select>
              {field.value && (
                <button
                  type="button"
                  onClick={() => field.onChange("")}
                  className="mt-1 text-[11px] font-semibold text-tyro-text-muted hover:text-tyro-danger cursor-pointer"
                >
                  {t("forms.objective.assetClassClear")}
                </button>
              )}
            </div>
          )}
        />

        <Controller
          name={FIELD_ACTION}
          control={control}
          render={({ field }) => (
            <div>
              <label className={labelClassName}>{t("forms.objective.actionType")}</label>
              <Select
                selectedKeys={field.value ? [field.value as string] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string | undefined;
                  field.onChange(val ?? "");
                }}
                variant="bordered"
                size="sm"
                classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
                placeholder={t("forms.objective.actionTypePlaceholder")}
                renderValue={(items) => (
                  <span className="truncate text-[13px] font-semibold">
                    {actionTypeCodeAndLabel(String(items[0]?.key ?? ""), t)}
                  </span>
                )}
              >
                {actionOptions.map((opt) => (
                  <SelectItem key={opt.key} textValue={`${opt.code} ${opt.label}`}>
                    <span className="flex items-baseline gap-2">
                      <span className="shrink-0 rounded bg-tyro-bg px-1 py-px text-[10px] font-bold tabular-nums text-tyro-text-secondary">
                        {opt.code}
                      </span>
                      <span className="text-[13px] font-medium">{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </Select>
              {field.value && (
                <button
                  type="button"
                  onClick={() => field.onChange("")}
                  className="mt-1 text-[11px] font-semibold text-tyro-text-muted hover:text-tyro-danger cursor-pointer"
                >
                  {t("forms.objective.actionTypeClear")}
                </button>
              )}
            </div>
          )}
        />
      </div>
    </>
  );
}
