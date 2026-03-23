import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FilterState {
  source: string[];
  status: string[];
  department: string[];
  leader: string[];
  dateFrom: string;
  dateTo: string;
  progressMin: number;
  progressMax: number;

  setSource: (v: string[]) => void;
  setStatus: (v: string[]) => void;
  setDepartment: (v: string[]) => void;
  setLeader: (v: string[]) => void;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setProgressMin: (v: number) => void;
  setProgressMax: (v: number) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const initialState = {
  source: [] as string[],
  status: [] as string[],
  department: [] as string[],
  leader: [] as string[],
  dateFrom: "",
  dateTo: "",
  progressMin: 0,
  progressMax: 100,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSource: (v) => set({ source: v }),
      setStatus: (v) => set({ status: v }),
      setDepartment: (v) => set({ department: v }),
      setLeader: (v) => set({ leader: v }),
      setDateFrom: (v) => set({ dateFrom: v }),
      setDateTo: (v) => set({ dateTo: v }),
      setProgressMin: (v) => set({ progressMin: v }),
      setProgressMax: (v) => set({ progressMax: v }),
      clearAll: () => set(initialState),
      activeCount: () => {
        const s = get();
        let count = 0;
        if (s.source.length > 0) count++;
        if (s.status.length > 0) count++;
        if (s.department.length > 0) count++;
        if (s.leader.length > 0) count++;
        if (s.dateFrom) count++;
        if (s.dateTo) count++;
        if (s.progressMin > 0) count++;
        if (s.progressMax < 100) count++;
        return count;
      },
    }),
    {
      name: "tyro-filters",
    }
  )
);
