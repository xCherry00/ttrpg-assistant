import { clearToken, getToken, setToken, STORAGE_KEY } from "../../auth/authstorage";

describe("authstorage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.removeItem("token");
  });

  it("getToken returns null when storage is empty", () => {
    expect(getToken()).toBeNull();
  });

  it("setToken stores token under ttrpg_token key", () => {
    setToken("abc123");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("abc123");
  });

  it("clearToken removes token", () => {
    setToken("abc123");
    clearToken();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("does not use old token key", () => {
    setToken("new-token");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("new-token");
  });
});
