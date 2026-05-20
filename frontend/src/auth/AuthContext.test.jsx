import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";

function Probe({ onSnapshot }) {
  const auth = useAuth();
  useEffect(() => {
    onSnapshot(auth);
  }, [auth, onSnapshot]);
  return (
    <div>
      <span data-testid="token">{auth.token || ""}</span>
      <span data-testid="isLoggedIn">{String(auth.isLoggedIn)}</span>
      <button type="button" onClick={auth.logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes token from storage", () => {
    localStorage.setItem("ttrpg_token", "from-storage");
    render(
      <AuthProvider>
        <Probe onSnapshot={() => {}} />
      </AuthProvider>
    );
    expect(screen.getByTestId("token")).toHaveTextContent("from-storage");
    expect(screen.getByTestId("isLoggedIn")).toHaveTextContent("true");
  });

  it("clears token on unauthorized event", () => {
    localStorage.setItem("ttrpg_token", "from-storage");
    render(
      <AuthProvider>
        <Probe onSnapshot={() => {}} />
      </AuthProvider>
    );
    act(() => {
      window.dispatchEvent(new Event("ttrpg:unauthorized"));
    });
    return waitFor(() => {
      expect(screen.getByTestId("token")).toBeEmptyDOMElement();
      expect(localStorage.getItem("ttrpg_token")).toBeNull();
    });
  });

  it("logout clears token", () => {
    localStorage.setItem("ttrpg_token", "from-storage");
    render(
      <AuthProvider>
        <Probe onSnapshot={() => {}} />
      </AuthProvider>
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "logout" }));
    });
    return waitFor(() => {
      expect(localStorage.getItem("ttrpg_token")).toBeNull();
      expect(screen.getByTestId("isLoggedIn")).toHaveTextContent("false");
    });
  });
});
