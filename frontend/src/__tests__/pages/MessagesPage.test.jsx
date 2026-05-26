import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MessagesPage from "../../pages/MessagesPage";
import * as messagesApi from "../../api/messages";
import * as socialApi from "../../api/social";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../api/social", () => ({
  discoverUsers: vi.fn(),
}));

vi.mock("../../api/messages", () => ({
  getConversations: vi.fn(),
  getConversationMessages: vi.fn(),
  markConversationRead: vi.fn(),
  sendTextMessage: vi.fn(),
  sendMessageWithFiles: vi.fn(),
  startDirectConversation: vi.fn(),
  acceptConversationRequest: vi.fn(),
  rejectConversationRequest: vi.fn(),
  downloadAttachment: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <MessagesPage />
    </MemoryRouter>,
  );
}

describe("MessagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socialApi.discoverUsers.mockResolvedValue([]);
    messagesApi.markConversationRead.mockResolvedValue({});
    messagesApi.sendTextMessage.mockResolvedValue({});
    messagesApi.sendMessageWithFiles.mockResolvedValue({});
    messagesApi.startDirectConversation.mockResolvedValue({ id: 99 });
    messagesApi.acceptConversationRequest.mockResolvedValue({});
    messagesApi.rejectConversationRequest.mockResolvedValue({});
    messagesApi.downloadAttachment.mockResolvedValue({ blob: new Blob(["x"]), filename: "a.txt" });
  });

  it("renders empty conversations state and selected-conversation placeholder", async () => {
    messagesApi.getConversations.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/Brak rozmów\./i)).toBeInTheDocument();
    expect(screen.getByText(/^Wybierz rozmowę\.$/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Prosby/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Szczegoly rozmowy/i)).not.toBeInTheDocument();
  });

  it("renders conversation list and composer for active conversation", async () => {
    messagesApi.getConversations.mockResolvedValue([
      {
        id: 1,
        title: "Rozmowa",
        status: "active",
        lastMessageAt: null,
        lastMessagePreview: "Hej",
        unreadCount: 0,
        peer: { displayName: "Jan", username: "jan", tagCode: 1234, handle: "jan-1234", activityLabel: "aktywny" },
      },
    ]);
    messagesApi.getConversationMessages.mockResolvedValue([]);
    renderPage();

    expect((await screen.findAllByText("Jan")).length).toBeGreaterThan(0);
    expect(await screen.findByPlaceholderText("Napisz wiadomosc...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wyślij" })).toBeDisabled();
  });

  it("handles incoming conversation request actions", async () => {
    messagesApi.getConversations.mockResolvedValue([
      {
        id: 2,
        title: "Prosba",
        status: "incoming_request",
        lastMessageAt: null,
        lastMessagePreview: "",
        unreadCount: 0,
        peer: { displayName: "Anna", username: "anna", tagCode: 2345, handle: "anna-2345", activityLabel: "aktywna" },
      },
    ]);
    messagesApi.getConversationMessages.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Akceptuj" }));
    await waitFor(() => expect(messagesApi.acceptConversationRequest).toHaveBeenCalledWith("test-token", 2));
  });
});
