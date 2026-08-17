import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LocationSettings from "../settings/LocationSettings";
import { useDataStore } from "@/stores/dataStore";

// Mock i18n — t() returns the key so assertions stay locale-independent.
// initReactI18next must be part of the mock: dataStore imports @/lib/i18n,
// which calls i18n.use(initReactI18next) at module load.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

// Toast is mocked so we can assert on validation feedback without rendering
// the real toast container. vi.hoisted → the factory can reference it.
const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));
vi.mock("@/stores/toastStore", () => ({
  toast: toastMock,
  useToastStore: { getState: () => ({ addToast: vi.fn() }) },
}));

// Keep the store's mock seeds empty so each test starts from a clean list
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
  getInitialLocations: () => [],
}));

beforeEach(() => {
  useDataStore.setState({ locations: [] });
  toastMock.success.mockClear();
  toastMock.error.mockClear();
});

function addLocationViaUi(country: string, city: string) {
  fireEvent.change(screen.getByPlaceholderText("settings.locationCountryPlaceholder"), {
    target: { value: country },
  });
  fireEvent.change(screen.getByPlaceholderText("settings.locationCityPlaceholder"), {
    target: { value: city },
  });
  fireEvent.click(screen.getByText("settings.locationAdd"));
}

describe("LocationSettings", () => {
  it("shows the empty state when no location is defined", () => {
    render(<LocationSettings />);
    expect(screen.getByText("settings.noLocations")).toBeInTheDocument();
  });

  it("adds a location with country and city on the same row", () => {
    render(<LocationSettings />);
    addLocationViaUi("Türkiye", "Ankara");

    expect(screen.getByText("Türkiye")).toBeInTheDocument();
    expect(screen.getByText("Ankara")).toBeInTheDocument();
    expect(useDataStore.getState().locations).toHaveLength(1);
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("rejects a duplicate country + city pair case-insensitively", () => {
    render(<LocationSettings />);
    addLocationViaUi("Türkiye", "Ankara");
    addLocationViaUi("türkiye", "ANKARA");

    expect(useDataStore.getState().locations).toHaveLength(1);
    expect(toastMock.error).toHaveBeenCalledWith("settings.locationDuplicate");
  });

  it("keeps the add button disabled until both fields are filled", () => {
    render(<LocationSettings />);
    const addBtn = screen.getByText("settings.locationAdd").closest("button");
    expect(addBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("settings.locationCountryPlaceholder"), {
      target: { value: "Irak" },
    });
    expect(addBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("settings.locationCityPlaceholder"), {
      target: { value: "Basra" },
    });
    expect(addBtn).not.toBeDisabled();
  });

  it("edits an existing location", () => {
    render(<LocationSettings />);
    addLocationViaUi("Türkiye", "Ankara");

    fireEvent.click(screen.getByLabelText("common.edit"));
    const countryInput = screen.getAllByLabelText("settings.locationCountry")[0];
    fireEvent.change(countryInput, { target: { value: "Kazakistan" } });
    fireEvent.click(screen.getByLabelText("common.save"));

    expect(useDataStore.getState().locations[0].country).toBe("Kazakistan");
    expect(useDataStore.getState().locations[0].city).toBe("Ankara");
  });

  it("deletes a location after the confirm dialog is accepted", () => {
    render(<LocationSettings />);
    addLocationViaUi("Irak", "Basra");
    expect(useDataStore.getState().locations).toHaveLength(1);

    fireEvent.click(screen.getByLabelText("common.delete"));
    // ConfirmDialog's confirm button falls back to t("common.delete") as its
    // label; the row's icon button only carries it as an aria-label, so this
    // getByText resolves to the dialog footer button.
    fireEvent.click(screen.getByText("common.delete"));

    expect(useDataStore.getState().locations).toHaveLength(0);
  });
});
