import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationBell from "../../components/NotificationBell";
import * as notificationsApi from "../../api/notifications";

const navigateMock = vi.fn();

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../../api/notifications", () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
  clearNotifications: vi.fn(),
}));

vi.mock("../../api/social", () => ({
  acceptFriendRequest: vi.fn(),
  rejectFriendRequest: vi.fn(),
}));

function notificationOverview(unreadCount = 1) {
  return {
    unreadCount,
    items: [
      {
        id: "campaign-12",
        source: "campaign",
        type: "session_started",
        title: "Sesja wystartowała",
        message: "Sesja #12 ruszyła",
        read: unreadCount === 0,
        createdAt: "2026-05-20T10:00:00Z",
        targetUrl: "/campaigns/3",
      },
    ],
  };
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    notificationsApi.getNotifications.mockResolvedValue(notificationOverview(1));
    notificationsApi.markNotificationRead.mockResolvedValue(notificationOverview(0));
    notificationsApi.markAllNotificationsRead.mockResolvedValue(notificationOverview(0));
    notificationsApi.deleteNotification.mockResolvedValue({ unreadCount: 0, items: [] });
    notificationsApi.clearNotifications.mockResolvedValue({ unreadCount: 0, items: [] });
  });

  it("marks notification as read after click and navigates", async () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /Powiadomienia/i }));

    const mainButton = await screen.findByRole("button", { name: /Sesja wystartowała/i });
    fireEvent.click(mainButton);

    await waitFor(() => {
      expect(notificationsApi.markNotificationRead).toHaveBeenCalledWith("test-token", 12);
    });
    expect(navigateMock).toHaveBeenCalledWith("/campaigns/3");
  });

  it("deletes one campaign notification", async () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /Powiadomienia/i }));

    const deleteButton = await screen.findByRole("button", { name: /Usu/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(notificationsApi.deleteNotification).toHaveBeenCalledWith("test-token", 12);
    });
  });

  it("supports mark-all-read and clear-all actions", async () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /Powiadomienia/i }));
    await screen.findByText("Sesja wystartowała");

    fireEvent.click(screen.getByRole("button", { name: /Oznacz wszystkie/i }));
    await waitFor(() => {
      expect(notificationsApi.markAllNotificationsRead).toHaveBeenCalledWith("test-token");
    });

    fireEvent.click(screen.getByRole("button", { name: /Wyczy/i }));
    await waitFor(() => {
      expect(notificationsApi.clearNotifications).toHaveBeenCalledWith("test-token");
    });
  });
});
