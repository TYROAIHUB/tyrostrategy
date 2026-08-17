/**
 * DataService — Abstract interface for data access.
 * Adapter pattern: mock (localStorage), supabase, dataverse, azure-sql
 * Switch via VITE_DATA_PROVIDER env var.
 */
import type { Proje, Aksiyon, TagDefinition, LocationDefinition } from "@/types";

export interface DataService {
  // Projeler
  fetchProjeler(): Promise<Proje[]>;
  fetchProje(id: string): Promise<Proje | null>;
  createProje(data: Omit<Proje, "id">): Promise<Proje>;
  updateProje(id: string, data: Partial<Proje>): Promise<Proje>;
  deleteProje(id: string): Promise<boolean>;

  // Aksiyonlar
  fetchAksiyonlar(): Promise<Aksiyon[]>;
  fetchAksiyonlarByProje(projeId: string): Promise<Aksiyon[]>;
  createAksiyon(data: Omit<Aksiyon, "id">): Promise<Aksiyon>;
  updateAksiyon(id: string, data: Partial<Aksiyon>): Promise<Aksiyon>;
  deleteAksiyon(id: string): Promise<boolean>;

  // Tag Definitions
  fetchTagDefinitions(): Promise<TagDefinition[]>;
  createTagDefinition(data: Omit<TagDefinition, "id">): Promise<TagDefinition>;
  updateTagDefinition(id: string, data: Partial<TagDefinition>): Promise<TagDefinition>;
  deleteTagDefinition(id: string): Promise<boolean>;

  // Locations — ülke + şehir tanımları (Ayarlar > Lokasyon)
  fetchLocations(): Promise<LocationDefinition[]>;
  createLocation(data: Omit<LocationDefinition, "id">): Promise<LocationDefinition>;
  updateLocation(id: string, data: Partial<Omit<LocationDefinition, "id">>): Promise<LocationDefinition>;
  deleteLocation(id: string): Promise<boolean>;
}
