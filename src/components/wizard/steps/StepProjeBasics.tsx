import { useMemo } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Input, Textarea, Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { getSourceOptions } from "@/lib/constants";
import { canonicalDeptKey } from "@/config/departments";
import { useDataStore } from "@/stores/dataStore";
interface Props {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function StepProjeBasics({ control, errors }: Props) {
  const { t } = useTranslation();
  const sourceOptions = getSourceOptions(t);
  const projeler = useDataStore((s) => s.projeler);

  // Departman dropdown — kullanıcı raporu 2026-05-10: wizard hardcoded 16
  // enum kullanıyordu, edit form ise projelerden derive ediyordu → kullanıcı
  // aynı projeyi düzenlerken farklı liste görüyordu. Şimdi ProjeForm ile
  // BİREBİR AYNI mantık: sadece `projeler` tablosunda fiilen kullanılan
  // departmanlar; canonical + raw alias çiftleri dedupe; TR alfabetik.
  // Hiçbir projede yoksa o canonical enum entry dropdown'a düşmez.
  const departmentOptions = useMemo(() => {
    const seenCanonical = new Set<string>();
    const seenRaw = new Set<string>();
    const opts: { key: string; label: string }[] = [];
    for (const h of projeler) {
      const d = h.department?.trim();
      if (!d) continue;
      const canonical = canonicalDeptKey(d);
      if (canonical) {
        if (seenCanonical.has(canonical)) continue;
        seenCanonical.add(canonical);
        opts.push({ key: canonical, label: t(`projectDepartments.${canonical}`) });
      } else {
        if (seenRaw.has(d)) continue;
        seenRaw.add(d);
        opts.push({ key: d, label: d });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [projeler, t]);

  return (
    <div className="flex flex-col gap-5">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.name")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Input
              {...field}
              placeholder={t("forms.objective.namePlaceholder")}
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message as string}
              variant="bordered"
              size="sm"
              classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
            />
          </div>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.description")}
            </label>
            <Textarea
              {...field}
              placeholder={t("forms.objective.descriptionPlaceholder")}
              variant="bordered"
              size="sm"
              minRows={2}
              maxRows={4}
              classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
            />
          </div>
        )}
      />

      <Controller
        name="source"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.source")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Select
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                field.onChange(val ?? "");
              }}
              variant="bordered"
              size="sm"
              isInvalid={!!errors.source}
              errorMessage={errors.source?.message as string}
              classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
              placeholder={t("forms.objective.sourcePlaceholder")}
            >
              {sourceOptions.map((opt) => (
                <SelectItem key={opt.key}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />

      <Controller
        name="department"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.department")}
            </label>
            <Select
              selectedKeys={field.value ? [canonicalDeptKey(field.value) ?? field.value] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                field.onChange(val ?? "");
              }}
              variant="bordered"
              size="sm"
              classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
              placeholder={t("forms.objective.departmentPlaceholder")}
            >
              {departmentOptions.map((opt) => (
                <SelectItem key={opt.key}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />
    </div>
  );
}
