/**
 * useSupabaseData — TanStack Query hooks for Supabase data.
 * Only active when VITE_DATA_PROVIDER=supabase.
 * Falls back to Zustand store (mock) otherwise.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAdapter } from "@/lib/data/supabaseAdapter";
import type { AppReportTemplate, ReportTemplateInput } from "@/lib/data/supabaseAdapter";
import { useDataStore } from "@/stores/dataStore";
import type { Proje, Aksiyon, TagDefinition } from "@/types";
import { isSupabaseMode } from "@/lib/supabaseMode";

// ===== Projeler =====

export function useProjeler() {
  const mockData = useDataStore((s) => s.projeler);

  const query = useQuery({
    queryKey: ["projeler"],
    queryFn: () => supabaseAdapter.fetchProjeler(),
    enabled: isSupabaseMode,
    staleTime: 30_000,
  });

  return {
    data: isSupabaseMode ? query.data ?? [] : mockData,
    isLoading: isSupabaseMode ? query.isLoading : false,
    error: isSupabaseMode ? query.error : null,
    refetch: query.refetch,
  };
}

export function useAksiyonlar() {
  const mockData = useDataStore((s) => s.aksiyonlar);

  const query = useQuery({
    queryKey: ["aksiyonlar"],
    queryFn: () => supabaseAdapter.fetchAksiyonlar(),
    enabled: isSupabaseMode,
    staleTime: 30_000,
  });

  return {
    data: isSupabaseMode ? query.data ?? [] : mockData,
    isLoading: isSupabaseMode ? query.isLoading : false,
    error: isSupabaseMode ? query.error : null,
    refetch: query.refetch,
  };
}

export function useTagDefinitions() {
  const mockData = useDataStore((s) => s.tagDefinitions);

  const query = useQuery({
    queryKey: ["tagDefinitions"],
    queryFn: () => supabaseAdapter.fetchTagDefinitions(),
    enabled: isSupabaseMode,
    staleTime: 60_000,
  });

  return {
    data: isSupabaseMode ? query.data ?? [] : mockData,
    isLoading: isSupabaseMode ? query.isLoading : false,
  };
}

// ===== Mutations =====

export function useCreateProje() {
  const qc = useQueryClient();
  const mockAdd = useDataStore((s) => s.addProje);

  return useMutation({
    mutationFn: (data: Omit<Proje, "id">) =>
      isSupabaseMode ? supabaseAdapter.createProje(data) : Promise.resolve((() => { mockAdd(data); return data as Proje; })()),
    onSuccess: () => {
      if (isSupabaseMode) qc.invalidateQueries({ queryKey: ["projeler"] });
    },
  });
}

export function useUpdateProje() {
  const qc = useQueryClient();
  const mockUpdate = useDataStore((s) => s.updateProje);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Proje> }) =>
      isSupabaseMode ? supabaseAdapter.updateProje(id, data) : Promise.resolve((() => { mockUpdate(id, data); return data as Proje; })()),
    onSuccess: () => {
      if (isSupabaseMode) qc.invalidateQueries({ queryKey: ["projeler"] });
    },
  });
}

export function useDeleteProje() {
  const qc = useQueryClient();
  const mockDelete = useDataStore((s) => s.deleteProje);

  return useMutation({
    mutationFn: (id: string) =>
      isSupabaseMode ? supabaseAdapter.deleteProje(id) : Promise.resolve(mockDelete(id)),
    onSuccess: () => {
      if (isSupabaseMode) {
        qc.invalidateQueries({ queryKey: ["projeler"] });
        qc.invalidateQueries({ queryKey: ["aksiyonlar"] });
      }
    },
  });
}

export function useCreateAksiyon() {
  const qc = useQueryClient();
  const mockAdd = useDataStore((s) => s.addAksiyon);

  return useMutation({
    mutationFn: (data: Omit<Aksiyon, "id">) =>
      isSupabaseMode ? supabaseAdapter.createAksiyon(data) : Promise.resolve((() => { mockAdd(data); return data as Aksiyon; })()),
    onSuccess: () => {
      if (isSupabaseMode) qc.invalidateQueries({ queryKey: ["aksiyonlar"] });
    },
  });
}

export function useUpdateAksiyon() {
  const qc = useQueryClient();
  const mockUpdate = useDataStore((s) => s.updateAksiyon);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Aksiyon> }) =>
      isSupabaseMode ? supabaseAdapter.updateAksiyon(id, data) : Promise.resolve((() => { mockUpdate(id, data); return data as Aksiyon; })()),
    onSuccess: () => {
      if (isSupabaseMode) qc.invalidateQueries({ queryKey: ["aksiyonlar"] });
    },
  });
}

export function useDeleteAksiyon() {
  const qc = useQueryClient();
  const mockDelete = useDataStore((s) => s.deleteAksiyon);

  return useMutation({
    mutationFn: (id: string) =>
      isSupabaseMode ? supabaseAdapter.deleteAksiyon(id) : Promise.resolve(mockDelete(id)),
    onSuccess: () => {
      if (isSupabaseMode) qc.invalidateQueries({ queryKey: ["aksiyonlar"] });
    },
  });
}

export function useCreateTagDefinition() {
  const qc = useQueryClient();
  const mockAdd = useDataStore((s) => s.addTagDefinition);

  return useMutation({
    mutationFn: (data: Omit<TagDefinition, "id">) =>
      isSupabaseMode ? supabaseAdapter.createTagDefinition(data) : Promise.resolve(mockAdd(data)),
    onSuccess: () => {
      if (isSupabaseMode) qc.invalidateQueries({ queryKey: ["tagDefinitions"] });
    },
  });
}

// ===== Report Templates =====

export function useReportTemplates(ownerEmail: string) {
  return useQuery<AppReportTemplate[]>({
    queryKey: ["reportTemplates", ownerEmail],
    queryFn: () => supabaseAdapter.fetchReportTemplates(ownerEmail),
    enabled: isSupabaseMode && !!ownerEmail,
    staleTime: 60_000,
  });
}

export function useCreateReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReportTemplateInput) => supabaseAdapter.createReportTemplate(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["reportTemplates", vars.ownerEmail] });
    },
  });
}

export function useUpdateReportTemplate(ownerEmail: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Omit<ReportTemplateInput, "ownerEmail"> }) =>
      supabaseAdapter.updateReportTemplate(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportTemplates", ownerEmail] });
    },
  });
}

export function useDeleteReportTemplate(ownerEmail: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supabaseAdapter.deleteReportTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportTemplates", ownerEmail] });
    },
  });
}

export type { AppReportTemplate, ReportTemplateInput };
