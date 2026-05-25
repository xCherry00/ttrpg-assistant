import { exportCharacter, importCharacter } from "../../api/characters";

describe("characters api helpers", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    });
  });

  it("exportCharacter uses expected endpoint", async () => {
    await exportCharacter("token", 77);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/characters/77/export");
    expect(options.method).toBe("GET");
  });

  it("importCharacter uses expected endpoint", async () => {
    await importCharacter("token", { exportVersion: "v1", character: { name: "A", systemCode: "dnd5e", sheetJson: {} } });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/characters/import");
    expect(options.method).toBe("POST");
  });
});
