import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppShell from "../../components/AppShell";

vi.mock("../../components/Sidebar", () => ({
  default: () => <aside>Sidebar</aside>,
}));

vi.mock("../../components/AccountMenu", () => ({
  default: () => <div>AccountMenu</div>,
}));

vi.mock("../../components/NotificationBell", () => ({
  default: () => <div>NotificationBell</div>,
}));

vi.mock("../../components/MessageLauncher", () => ({
  default: () => <div>MessageLauncher</div>,
}));

function renderShell(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<div>Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppShell top bar context", () => {
  it("renders dashboard title and subtitle in global top bar", () => {
    renderShell("/dashboard");

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/Status Twojej aktywnosci i sesji/i)).toBeInTheDocument();
  });

  it("renders generators title and subtitle with the same top bar layout", () => {
    renderShell("/generators");

    expect(screen.getByRole("heading", { name: "Generatory losowego kontentu" })).toBeInTheDocument();
    expect(screen.getByText(/Szybkie narzedzia do tworzenia tresci sesyjnych/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Globalny naglowek strony")).toBeInTheDocument();
  });
});
