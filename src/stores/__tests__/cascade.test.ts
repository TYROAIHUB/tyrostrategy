import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDataStore } from "../dataStore";

// Mock the mock-adapter to return empty arrays (clean slate)
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialHedefler: () => [],
  getInitialProjeler: () => [],
  getInitialGorevler: () => [],
}));

beforeEach(() => {
  useDataStore.setState({
    hedefler: [],
    projeler: [],
    gorevler: [],
  });
});

describe("cascade delete protection", () => {
  describe("hedef → proje cascade", () => {
    it("deleteHedef returns false when hedef has child projeler", () => {
      // Create a hedef
      useDataStore.getState().addHedef({
        name: "Test Hedef",
        source: "Kurumsal",
        status: "On Track",
        owner: "Owner",
        leader: "Leader",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      const hedefId = useDataStore.getState().hedefler[0].id;

      // Add a proje under it
      useDataStore.getState().addProje({
        hedefId,
        name: "Child Proje",
        department: "IT",
        projectLeader: "Leader",
        participants: ["Leader"],
        startDate: "2024-01-01",
        endDate: "2024-06-30",
        status: "On Track",
        progress: 0,
      });

      // Attempt to delete the hedef — should fail
      const result = useDataStore.getState().deleteHedef(hedefId);
      expect(result).toBe(false);

      // Hedef should still exist
      expect(useDataStore.getState().hedefler).toHaveLength(1);
    });

    it("deleteHedef returns true after child proje is deleted", () => {
      // Create hedef
      useDataStore.getState().addHedef({
        name: "Test Hedef",
        source: "Kurumsal",
        status: "On Track",
        owner: "Owner",
        leader: "Leader",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      const hedefId = useDataStore.getState().hedefler[0].id;

      // Add proje
      useDataStore.getState().addProje({
        hedefId,
        name: "Child Proje",
        department: "IT",
        projectLeader: "Leader",
        participants: ["Leader"],
        startDate: "2024-01-01",
        endDate: "2024-06-30",
        status: "On Track",
        progress: 0,
      });

      const projeId = useDataStore.getState().projeler[0].id;

      // Delete the proje first
      useDataStore.getState().deleteProje(projeId);
      expect(useDataStore.getState().projeler).toHaveLength(0);

      // Now deleteHedef should succeed
      const result = useDataStore.getState().deleteHedef(hedefId);
      expect(result).toBe(true);
      expect(useDataStore.getState().hedefler).toHaveLength(0);
    });
  });

  describe("proje → gorev cascade", () => {
    it("deleteProje returns false when proje has child gorevler", () => {
      // Create proje
      useDataStore.getState().addProje({
        hedefId: "h1",
        name: "Test Proje",
        department: "IT",
        projectLeader: "Leader",
        participants: ["Leader"],
        startDate: "2024-01-01",
        endDate: "2024-06-30",
        status: "On Track",
        progress: 0,
      });

      const projeId = useDataStore.getState().projeler[0].id;

      // Add gorev under it
      useDataStore.getState().addGorev({
        projeId,
        name: "Child Gorev",
        assignee: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });

      // Attempt to delete proje — should fail
      const result = useDataStore.getState().deleteProje(projeId);
      expect(result).toBe(false);

      // Proje should still exist
      expect(useDataStore.getState().projeler).toHaveLength(1);
    });

    it("deleteProje returns true after child gorev is deleted", () => {
      // Create proje
      useDataStore.getState().addProje({
        hedefId: "h1",
        name: "Test Proje",
        department: "IT",
        projectLeader: "Leader",
        participants: ["Leader"],
        startDate: "2024-01-01",
        endDate: "2024-06-30",
        status: "On Track",
        progress: 0,
      });

      const projeId = useDataStore.getState().projeler[0].id;

      // Add gorev
      useDataStore.getState().addGorev({
        projeId,
        name: "Child Gorev",
        assignee: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });

      const gorevId = useDataStore.getState().gorevler[0].id;

      // Delete the gorev first
      useDataStore.getState().deleteGorev(gorevId);
      expect(useDataStore.getState().gorevler).toHaveLength(0);

      // Now deleteProje should succeed
      const result = useDataStore.getState().deleteProje(projeId);
      expect(result).toBe(true);
      expect(useDataStore.getState().projeler).toHaveLength(0);
    });
  });

  describe("gorev delete", () => {
    it("deleteGorev always returns true (no cascade protection)", () => {
      useDataStore.getState().addGorev({
        projeId: "p1",
        name: "Test Gorev",
        assignee: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });

      const gorevId = useDataStore.getState().gorevler[0].id;
      const result = useDataStore.getState().deleteGorev(gorevId);
      expect(result).toBe(true);
      expect(useDataStore.getState().gorevler).toHaveLength(0);
    });
  });

  describe("full cascade chain", () => {
    it("hedef with proje with gorev: must delete bottom-up", () => {
      // Build the chain
      useDataStore.getState().addHedef({
        name: "Root Hedef",
        source: "International",
        status: "On Track",
        owner: "Owner",
        leader: "Leader",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      const hedefId = useDataStore.getState().hedefler[0].id;

      useDataStore.getState().addProje({
        hedefId,
        name: "Mid Proje",
        department: "IT",
        projectLeader: "Leader",
        participants: ["Leader"],
        startDate: "2024-01-01",
        endDate: "2024-06-30",
        status: "On Track",
        progress: 0,
      });
      const projeId = useDataStore.getState().projeler[0].id;

      useDataStore.getState().addGorev({
        projeId,
        name: "Leaf Gorev",
        assignee: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });
      const gorevId = useDataStore.getState().gorevler[0].id;

      // Cannot delete hedef (has proje)
      expect(useDataStore.getState().deleteHedef(hedefId)).toBe(false);
      // Cannot delete proje (has gorev)
      expect(useDataStore.getState().deleteProje(projeId)).toBe(false);

      // Delete gorev first
      expect(useDataStore.getState().deleteGorev(gorevId)).toBe(true);
      // Now can delete proje
      expect(useDataStore.getState().deleteProje(projeId)).toBe(true);
      // Now can delete hedef
      expect(useDataStore.getState().deleteHedef(hedefId)).toBe(true);

      // Everything is gone
      expect(useDataStore.getState().hedefler).toHaveLength(0);
      expect(useDataStore.getState().projeler).toHaveLength(0);
      expect(useDataStore.getState().gorevler).toHaveLength(0);
    });
  });
});
