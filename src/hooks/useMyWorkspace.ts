import { useMemo } from "react";
import { useDataStore } from "@/stores/dataStore";
import { useCurrentUser } from "./useCurrentUser";
import type { Hedef, Aksiyon } from "@/types";

export interface DeadlineItem {
  id: string;
  name: string;
  type: "hedef" | "aksiyon";
  endDate: string;
  parentName: string;
  status: string;
  progress: number;
}

interface WorkspaceData {
  userName: string;
  department: string;
  myHedefler: Hedef[];
  myAksiyonlar: Aksiyon[];
  totalAksiyonlar: number;
  achievedAksiyonlar: number;
  behindAksiyonlar: number;
  atRiskAksiyonlar: number;
  overallProgress: number;
  aksiyonProgress: number;
  statusBreakdown: Record<string, number>;
  upcomingDeadlines: DeadlineItem[];
}

export function useMyWorkspace(): WorkspaceData {
  const { name: userName, department } = useCurrentUser();
  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  return useMemo(() => {
    const normalizedName = userName.toLowerCase().trim();

    // Filter hedefler where user is owner or participant
    const myHedefler = hedefler.filter(
      (h) =>
        h.owner?.toLowerCase().trim() === normalizedName ||
        h.participants?.some((p) => p.toLowerCase().trim() === normalizedName)
    );

    const myHedefIds = new Set(myHedefler.map((h) => h.id));

    // Filter aksiyonlar: owner or belongs to user's hedef
    const myAksiyonlar = aksiyonlar.filter(
      (a) =>
        a.owner?.toLowerCase().trim() === normalizedName ||
        myHedefIds.has(a.hedefId)
    );

    // Counts
    const totalAksiyonlar = myAksiyonlar.length;
    const achievedAksiyonlar = myAksiyonlar.filter((a) => a.status === "Achieved").length;
    const behindAksiyonlar = myAksiyonlar.filter((a) => a.status === "Behind").length;
    const atRiskAksiyonlar = myAksiyonlar.filter((a) => a.status === "At Risk").length;

    // Progress
    const overallProgress =
      totalAksiyonlar > 0
        ? Math.round(myAksiyonlar.reduce((sum, a) => sum + a.progress, 0) / totalAksiyonlar)
        : 0;
    const aksiyonProgress =
      totalAksiyonlar > 0 ? Math.round((achievedAksiyonlar / totalAksiyonlar) * 100) : 0;

    // Status breakdown for donut chart
    const statusBreakdown: Record<string, number> = {};
    for (const a of myAksiyonlar) {
      statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
    }

    // Upcoming deadlines — combine hedef and aksiyon deadlines
    const hedefNameMap = new Map(hedefler.map((h) => [h.id, h.name]));

    const allDeadlines: DeadlineItem[] = [];

    // Hedef deadlines (owner)
    for (const h of myHedefler) {
      if (h.status !== "Achieved" && h.endDate) {
        allDeadlines.push({
          id: h.id,
          name: h.name,
          type: "hedef",
          endDate: h.endDate,
          parentName: h.source,
          status: h.status,
          progress: h.progress,
        });
      }
    }

    // Aksiyon deadlines
    for (const a of myAksiyonlar) {
      if (a.status !== "Achieved" && a.endDate) {
        allDeadlines.push({
          id: a.id,
          name: a.name,
          type: "aksiyon",
          endDate: a.endDate,
          parentName: hedefNameMap.get(a.hedefId) ?? "-",
          status: a.status,
          progress: a.progress,
        });
      }
    }

    const upcomingDeadlines = allDeadlines
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 10);

    return {
      userName,
      department,
      myHedefler,
      myAksiyonlar,
      totalAksiyonlar,
      achievedAksiyonlar,
      behindAksiyonlar,
      atRiskAksiyonlar,
      overallProgress,
      aksiyonProgress,
      statusBreakdown,
      upcomingDeadlines,
    };
  }, [userName, department, hedefler, aksiyonlar]);
}
