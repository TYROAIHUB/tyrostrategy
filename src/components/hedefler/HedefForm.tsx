import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, SelectItem, DatePicker, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDataStore } from "@/stores/dataStore";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { getStatusOptions, getSourceOptions } from "@/lib/constants";
import { departments } from "@/config/departments";
import type { Hedef } from "@/types";

const CURRENT_USER = "Cenk \u015eayli";
const allUsers = departments.flatMap((d) => d.users.map((u) => u.name));
const departmentNames = departments.map((d) => d.name);

const createHedefSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(3, t("validation.minChars")),
    description: z.string().optional(),
    owner: z.string().min(1, t("validation.ownerRequired")),
    participants: z.array(z.string()).default([]),
    department: z.string().default(""),
    source: z.enum(["T\u00fcrkiye", "Kurumsal", "International"]),
    status: z.enum(["On Track", "At Risk", "Behind", "Achieved", "Not Started"]),
    parentObjectiveId: z.string().optional(),
    startDate: z.string().min(1, t("validation.startDateRequired")),
    endDate: z.string().min(1, t("validation.endDateRequired")),
    reviewDate: z.string().optional(),
  });

type HedefFormData = z.infer<ReturnType<typeof createHedefSchema>>;

interface HedefFormProps {
  hedef?: Hedef;
  onSuccess: () => void;
}

export default function HedefForm({ hedef, onSuccess }: HedefFormProps) {
  const { t } = useTranslation();
  const addHedef = useDataStore((s) => s.addHedef);
  const updateHedef = useDataStore((s) => s.updateHedef);
  const hedefler = useDataStore((s) => s.hedefler);
  const [isLoading, setIsLoading] = useState(false);

  const hedefSchema = createHedefSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HedefFormData>({
    resolver: zodResolver(hedefSchema) as any,
    defaultValues: {
      name: hedef?.name ?? "",
      description: hedef?.description ?? "",
      owner: hedef?.owner ?? CURRENT_USER,
      participants: hedef?.participants ?? [],
      department: hedef?.department ?? "",
      source: hedef?.source ?? "T\u00fcrkiye",
      status: hedef?.status ?? "Not Started",
      parentObjectiveId: hedef?.parentObjectiveId ?? "",
      startDate: hedef?.startDate ?? "",
      endDate: hedef?.endDate ?? "",
      reviewDate: hedef?.reviewDate ?? "",
    },
  });

  const onSubmit = (data: HedefFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        parentObjectiveId: data.parentObjectiveId || undefined,
      };
      if (hedef) {
        updateHedef(hedef.id, payload);
        toast.success(t("toast.objectiveUpdated"), `"${data.name}" ${t("toast.updatedSuccessfully")}.`);
      } else {
        addHedef({ ...payload, progress: 0 });
        toast.success(t("toast.objectiveCreated"), `"${data.name}" ${t("toast.createdSuccessfully")}.`);
      }
      onSuccess();
    } catch (err) {
      toast.error(t("toast.operationFailed"), err instanceof Error ? err.message : t("toast.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = getStatusOptions(t);
  const sourceOptions = getSourceOptions(t);

  return (
    <form onSubmit={handleSubmit(onSubmit) as any} className="flex flex-col gap-5">
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
              errorMessage={errors.name?.message}
              variant="bordered"
              size="sm"
              classNames={{ inputWrapper: "border-tyro-border" }}
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
              classNames={{ inputWrapper: "border-tyro-border" }}
            />
          </div>
        )}
      />

      <Controller
        name="owner"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.owner")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Autocomplete
              defaultInputValue={field.value}
              onInputChange={(v) => field.onChange(v)}
              onSelectionChange={(key) => { if (key) field.onChange(String(key)); }}
              variant="bordered"
              size="sm"
              placeholder={t("forms.objective.ownerPlaceholder")}
              isInvalid={!!errors.owner}
              errorMessage={errors.owner?.message}
              classNames={{ base: "w-full" }}
              allowsCustomValue
            >
              {allUsers.map((name) => (
                <AutocompleteItem key={name}>{name}</AutocompleteItem>
              ))}
            </Autocomplete>
          </div>
        )}
      />

      <Controller
        name="participants"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.participants")}
            </label>
            <Select
              selectionMode="multiple"
              selectedKeys={new Set(field.value)}
              onSelectionChange={(keys) => {
                field.onChange(Array.from(keys) as string[]);
              }}
              variant="bordered"
              size="sm"
              classNames={{ trigger: "border-tyro-border" }}
              placeholder={t("forms.objective.participantsPlaceholder")}
            >
              {allUsers.map((name) => (
                <SelectItem key={name}>{name}</SelectItem>
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
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                field.onChange(val ?? "");
              }}
              variant="bordered"
              size="sm"
              classNames={{ trigger: "border-tyro-border" }}
              placeholder={t("forms.objective.departmentPlaceholder")}
            >
              {departmentNames.map((name) => (
                <SelectItem key={name}>{name}</SelectItem>
              ))}
            </Select>
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
              errorMessage={errors.source?.message}
              classNames={{ trigger: "border-tyro-border" }}
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
        name="status"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.status")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Select
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                field.onChange(val ?? "");
              }}
              variant="bordered"
              size="sm"
              isInvalid={!!errors.status}
              errorMessage={errors.status?.message}
              classNames={{ trigger: "border-tyro-border" }}
              placeholder={t("forms.objective.statusPlaceholder")}
            >
              {statusOptions.map((opt) => (
                <SelectItem key={opt.key}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />

      <Controller
        name="parentObjectiveId"
        control={control}
        render={({ field }) => {
          const availableHedefler = hedefler.filter((h) => !hedef || h.id !== hedef.id);
          return (
            <div>
              <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
                {t("forms.objective.parentObjective")}
              </label>
              <Select
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  field.onChange(val ?? "");
                }}
                variant="bordered"
                size="sm"
                classNames={{ trigger: "border-tyro-border" }}
                placeholder={t("forms.objective.parentObjectivePlaceholder")}
              >
                {availableHedefler.map((h) => (
                  <SelectItem key={h.id}>{h.name}</SelectItem>
                ))}
              </Select>
            </div>
          );
        }}
      />

      <Controller
        name="startDate"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.startDate")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <DatePicker
              value={toCalendarDate(field.value)}
              onChange={(date) => field.onChange(fromCalendarDate(date))}
              isInvalid={!!errors.startDate}
              errorMessage={errors.startDate?.message}
              variant="bordered"
              size="sm"
              granularity="day"
            />
          </div>
        )}
      />

      <Controller
        name="endDate"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.endDate")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <DatePicker
              value={toCalendarDate(field.value)}
              onChange={(date) => field.onChange(fromCalendarDate(date))}
              isInvalid={!!errors.endDate}
              errorMessage={errors.endDate?.message}
              variant="bordered"
              size="sm"
              granularity="day"
            />
          </div>
        )}
      />

      <Controller
        name="reviewDate"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.reviewDate")}
            </label>
            <DatePicker
              value={toCalendarDate(field.value ?? "")}
              onChange={(date) => field.onChange(fromCalendarDate(date))}
              variant="bordered"
              size="sm"
              granularity="day"
            />
          </div>
        )}
      />

      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        startContent={<Check size={14} />}
        className="mt-2 rounded-button font-semibold relative overflow-hidden group"
      >
        <span className="relative z-10">{hedef ? t("common.save") : t("common.create")}</span>
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
          <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[150%] transition-all duration-700 ease-out" />
        </span>
      </Button>
    </form>
  );
}
