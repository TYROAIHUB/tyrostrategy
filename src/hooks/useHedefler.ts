import { useQuery } from "@tanstack/react-query";
import { useDataStore } from "@/stores/dataStore";

export function useHedefler() {
  const hedefler = useDataStore((s) => s.hedefler);

  return useQuery({
    queryKey: ["hedefler", hedefler],
    queryFn: () => hedefler,
    initialData: hedefler,
  });
}
