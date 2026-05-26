import { fireEvent, render, screen } from "@testing-library/react";
import CampaignPlayerNotesPanel from "../../../pages/campaign/components/CampaignPlayerNotesPanel";

describe("CampaignPlayerNotesPanel", () => {
  it("renders empty state", () => {
    render(<CampaignPlayerNotesPanel notes={[]} campaign={{ owner: false }} isOwner={false} myUserId={2} busy={false} onCreate={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Brak notatek.")).toBeInTheDocument();
  });

  it("renders notes list and owner author info", () => {
    render(
      <CampaignPlayerNotesPanel
        notes={[{ id: 1, title: "T", content: "C", updatedAt: "2026-05-20T10:00:00Z", displayName: "User", username: "u" }]}
        campaign={{ owner: true }}
        isOwner
        myUserId={1}
        busy={false}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByText("Autor: User")).toBeInTheDocument();
  });

  it("does not show author details for member view", () => {
    render(
      <CampaignPlayerNotesPanel
        notes={[{ id: 1, title: "T", content: "C", updatedAt: "2026-05-20T10:00:00Z", displayName: "User", username: "u" }]}
        campaign={{ owner: false }}
        isOwner={false}
        myUserId={1}
        busy={false}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText("Autor: User")).not.toBeInTheDocument();
  });

  it("create/edit/delete call handlers", () => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    render(
      <CampaignPlayerNotesPanel
        notes={[{ id: 1, userId: 1, title: "T", content: "C", updatedAt: "2026-05-20T10:00:00Z" }]}
        campaign={{ owner: false }}
        isOwner={false}
        myUserId={1}
        busy={false}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );
    fireEvent.change(screen.getByLabelText("Tytul"), { target: { value: "N1" } });
    fireEvent.change(screen.getByLabelText("Tresc"), { target: { value: "body" } });
    fireEvent.click(screen.getByRole("button", { name: "Dodaj notatke" }));
    expect(onCreate).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Edytuj" }));
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));
    expect(onUpdate).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Usuń" }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("player sees only own notes", () => {
    render(
      <CampaignPlayerNotesPanel
        notes={[
          { id: 1, userId: 10, title: "Moja", content: "A", updatedAt: "2026-05-20T10:00:00Z" },
          { id: 2, userId: 20, title: "Cudza", content: "B", updatedAt: "2026-05-20T10:00:00Z" },
        ]}
        campaign={{ owner: false }}
        isOwner={false}
        myUserId={10}
        busy={false}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Moja")).toBeInTheDocument();
    expect(screen.queryByText("Cudza")).not.toBeInTheDocument();
  });
});
