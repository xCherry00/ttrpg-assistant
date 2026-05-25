import {
  deleteMySessionNote,
  getMySessionNote,
  getSessionNoteBacklog,
  saveMySessionNote,
} from "../../api/sessionNotes";

describe("sessionNotes api helpers", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    });
  });

  it("uses expected endpoints", async () => {
    await getMySessionNote("token", 8, 4);
    await saveMySessionNote("token", 8, 4, { title: "a", content: "b" });
    await deleteMySessionNote("token", 8, 4);
    await getSessionNoteBacklog("token");
    const urls = global.fetch.mock.calls.map((call) => call[0]);
    expect(urls.some((u) => u.includes("/api/campaigns/8/sessions/4/notes/me"))).toBe(true);
    expect(urls.some((u) => u.includes("/api/dashboard/session-note-backlog"))).toBe(true);
  });
});
