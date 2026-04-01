import { useDataStore } from "@/stores/dataStore";

export function useProjeler() {
  const projeler = useDataStore((s) => s.projeler);
  return { data: projeler };
}
