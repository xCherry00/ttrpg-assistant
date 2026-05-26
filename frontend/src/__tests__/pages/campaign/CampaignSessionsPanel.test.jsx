import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CampaignSessionsPanel from "../../../pages/campaign/components/CampaignSessionsPanel";

describe("CampaignSessionsPanel", () => {
  it("renders sessions with statuses and shows My Notes only for FINISHED", () => {
    render(
      <MemoryRouter>
        <CampaignSessionsPanel
          campaignId="10"
          sessions={[
            { id: 2, title: "S1", status: "PLANNED", description: "x" },
            { id: 3, title: "S2", status: "IN_PROGRESS", description: "y" },
            { id: 4, title: "S3", status: "FINISHED", description: "z" },
          ]}
          isOwner={false}
          busy={false}
          onCreate={() => {}}
          onStart={() => {}}
          onFinish={() => {}}
          onGetMySessionNote={async () => null}
          onSaveMySessionNote={async () => ({})}
          onDeleteMySessionNote={async () => ({})}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("S1")).toBeInTheDocument();
    expect(screen.getByText("PLANNED")).toBeInTheDocument();
    expect(screen.getByText("IN_PROGRESS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dołącz do aktywnej sesji" })).toHaveAttribute(
      "href",
      "/campaigns/10/sessions/3/live",
    );
    expect(screen.getByRole("button", { name: /Sesja jeszcze nie rozpoczeta/i })).toBeDisabled();
    expect(screen.getByText("Sesja zakończona (archiwalna).")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Moje notatki" })).toHaveLength(1);
  });

  it("opens notes modal and allows save/delete", async () => {
    const onSaveMySessionNote = vi.fn().mockResolvedValue({});
    const onDeleteMySessionNote = vi.fn().mockResolvedValue({});
    render(
      <MemoryRouter>
        <CampaignSessionsPanel
          campaignId="10"
          sessions={[{ id: 4, title: "S3", status: "FINISHED", description: "z" }]}
          isOwner={false}
          busy={false}
          onCreate={() => {}}
          onStart={() => {}}
          onFinish={() => {}}
          onGetMySessionNote={vi.fn().mockResolvedValue({ title: "T", content: "C" })}
          onSaveMySessionNote={onSaveMySessionNote}
          onDeleteMySessionNote={onDeleteMySessionNote}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Moje notatki" }));
    expect(await screen.findByRole("dialog", { name: "Moje notatki z sesji" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("T")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));
    await waitFor(() => {
      expect(onSaveMySessionNote).toHaveBeenCalledWith(4, { title: "T", content: "C" });
    });

    fireEvent.click(screen.getByRole("button", { name: "Usuń notatke" }));
    await waitFor(() => {
      expect(onDeleteMySessionNote).toHaveBeenCalledWith(4);
    });
  });

  it("shows loading and error states in notes modal", async () => {
    render(
      <MemoryRouter>
        <CampaignSessionsPanel
          campaignId="10"
          sessions={[{ id: 4, title: "S3", status: "FINISHED", description: "z" }]}
          isOwner={false}
          busy={false}
          onCreate={() => {}}
          onStart={() => {}}
          onFinish={() => {}}
          onGetMySessionNote={vi.fn().mockRejectedValue(new Error("Brak"))}
          onSaveMySessionNote={async () => ({})}
          onDeleteMySessionNote={async () => ({})}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Moje notatki" }));
    expect(await screen.findByText("Brak")).toBeInTheDocument();
  });
});
