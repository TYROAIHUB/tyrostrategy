import { useDataStore } from "@/stores/dataStore";

export function useAksiyonlar() {
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  return { data: aksiyonlar };
}
