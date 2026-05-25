import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CompendiumPage from "../../pages/CompendiumPage";
import * as compendiumApi from "../../api/compendium";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../api/compendium", () => ({
  getCompendiumSystems: vi.fn(),
  getCompendiumCategories: vi.fn(),
  getCompendiumList: vi.fn(),
  getCompendiumDetail: vi.fn(),
}));

describe("CompendiumPage v0.8.2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    compendiumApi.getCompendiumSystems.mockResolvedValue([{ code: "dnd5e", name: "D&D 5E" }]);
    compendiumApi.getCompendiumCategories.mockResolvedValue([
      { code: "monsters", label: "Potwory", description: "desc" },
      { code: "conditions", label: "Stany", description: "desc" },
    ]);
  });

  it("renders list when data is available", async () => {
    compendiumApi.getCompendiumList.mockResolvedValue({
      count: 1,
      results: [{ index: "goblin", name: "Goblin", url: "/goblin" }],
    });
    compendiumApi.getCompendiumDetail.mockResolvedValue({ index: "goblin", name: "Goblin", desc: ["desc"] });

    render(<CompendiumPage />);

    expect((await screen.findAllByText("Goblin")).length).toBeGreaterThan(0);
  });

  it("Potwory and Stany categories do not crash and show neutral empty state on missing data", async () => {
    compendiumApi.getCompendiumList.mockRejectedValue({ status: 404, message: "Not found" });
    compendiumApi.getCompendiumDetail.mockResolvedValue(null);

    render(<CompendiumPage />);

    expect(await screen.findByText(/Brak danych dla tej kategorii/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Stany/i }));

    await waitFor(() => {
      expect(screen.getByText(/Brak danych dla tej kategorii/i)).toBeInTheDocument();
    });
  });
});
