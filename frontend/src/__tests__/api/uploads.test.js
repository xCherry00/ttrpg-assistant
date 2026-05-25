import { uploadImage } from "../../api/uploads";

describe("uploads api", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("uploads image and returns payload", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ url: "http://localhost:8080/uploads/images/a.jpg" }),
    });
    const file = new File(["abc"], "a.jpg", { type: "image/jpeg" });
    const result = await uploadImage("token", file);
    expect(result.url).toContain("/uploads/images/");
  });

  it("shows upload error", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => "application/json" },
      json: async () => ({ message: "bad type" }),
    });
    const file = new File(["abc"], "a.txt", { type: "text/plain" });
    await expect(uploadImage("token", file)).rejects.toThrow("bad type");
  });
});
