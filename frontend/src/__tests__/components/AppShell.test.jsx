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

describe("AppShell layout", () => {
  it("does not render duplicated global top page header", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="*" element={<div>Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText("Globalny naglowek strony")).not.toBeInTheDocument();
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByText("AccountMenu")).toBeInTheDocument();
    expect(screen.queryByText("MessageLauncher")).not.toBeInTheDocument();
  });
});
