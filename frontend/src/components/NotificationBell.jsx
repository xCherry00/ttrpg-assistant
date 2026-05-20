import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { acceptFriendRequest, rejectFriendRequest } from "../api/social";

const SHELL_PANEL_EVENT = "ttrpg-shell-panel-open";
const PANEL_ID = "notifications";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-9 9 8.8 8.8 0 0 1-6.2-2.5" />
      <path d="M3 12a9 9 0 0 1 15.2-6.5" />
      <path d="M18 3v5h-5" />
      <path d="M6 21v-5h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function formatCount(value) {
  const count = Number(value) || 0;
  return count > 99 ? "99+" : String(count);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min temu`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;

  const days = Math.round(hours / 24);
  return `${days} dni temu`;
}

function itemIcon(source, title = "") {
  const label = title.trim().slice(0, 1).toUpperCase() || "P";
  if (source === "messages") return "M";
  if (source === "campaign") return "K";
  return label;
}

function friendRequestId(item) {
  const match = String(item?.id || "").match(/^friend-request-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function campaignNotificationId(item) {
  const match = String(item?.id || "").match(/^campaign-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

export default function NotificationBell() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [overview, setOverview] = useState({ unreadCount: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await getNotifications(token);
      setOverview({
        unreadCount: response?.unreadCount || 0,
        items: Array.isArray(response?.items) ? response.items : [],
      });
    } catch {
      setError("Nie udało się pobrać powiadomień.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onShellPanelOpen(event) {
      if (event.detail?.source !== PANEL_ID) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener(SHELL_PANEL_EVENT, onShellPanelOpen);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener(SHELL_PANEL_EVENT, onShellPanelOpen);
    };
  }, []);

  function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      window.dispatchEvent(new CustomEvent(SHELL_PANEL_EVENT, { detail: { source: PANEL_ID } }));
      loadNotifications();
    }
  }

  function goToNotification(item) {
    if (item?.source === "campaign") {
      const id = campaignNotificationId(item);
      if (id && !item.read) {
        void markNotificationRead(token, id).then((response) => {
          setOverview({
            unreadCount: response?.unreadCount || 0,
            items: Array.isArray(response?.items) ? response.items : [],
          });
        }).catch(() => {});
      }
    }
    setOpen(false);
    if (item?.targetUrl) {
      navigate(item.targetUrl);
    }
  }

  async function handleInvitationAction(event, item, action) {
    event.preventDefault();
    event.stopPropagation();
    const requestId = friendRequestId(item);
    if (!token || !requestId || actionId) return;

    setActionId(`${action}-${item.id}`);
    setError("");
    try {
      if (action === "accept") {
        await acceptFriendRequest(token, requestId);
      } else {
        await rejectFriendRequest(token, requestId);
      }
      await loadNotifications();
    } catch (err) {
      setError(err?.message || "Nie udało się obsłużyć zaproszenia.");
    } finally {
      setActionId("");
    }
  }

  const unreadCount = Number(overview.unreadCount) || 0;

  async function handleMarkAllRead() {
    if (!token || loading) return;
    setError("");
    try {
      const response = await markAllNotificationsRead(token);
      setOverview({
        unreadCount: response?.unreadCount || 0,
        items: Array.isArray(response?.items) ? response.items : [],
      });
    } catch (err) {
      setError(err?.message || "Nie udało się oznaczyć powiadomień jako przeczytane.");
    }
  }

  async function handleDeleteOne(event, item) {
    event.preventDefault();
    event.stopPropagation();
    const id = campaignNotificationId(item);
    if (!id || !token || actionId) return;
    setActionId(`delete-${item.id}`);
    setError("");
    try {
      const response = await deleteNotification(token, id);
      setOverview({
        unreadCount: response?.unreadCount || 0,
        items: Array.isArray(response?.items) ? response.items : [],
      });
    } catch (err) {
      setError(err?.message || "Nie udało się usunąć powiadomienia.");
    } finally {
      setActionId("");
    }
  }

  async function handleClearAll() {
    if (!token || loading) return;
    setError("");
    try {
      const response = await clearNotifications(token);
      setOverview({
        unreadCount: response?.unreadCount || 0,
        items: Array.isArray(response?.items) ? response.items : [],
      });
    } catch (err) {
      setError(err?.message || "Nie udało się wyczyścić powiadomień.");
    }
  }

  return (
    <div className="notificationBell" ref={wrapperRef}>
      <button
        type="button"
        className="appShellBell"
        aria-label={unreadCount > 0 ? `Powiadomienia: ${unreadCount} nieodczytanych` : "Powiadomienia"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={toggleOpen}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notificationBell__badge">{formatCount(unreadCount)}</span>}
      </button>

      {open && (
        <div className="notificationMenu" role="menu">
          <header className="notificationMenu__head">
            <div>
              <strong>Powiadomienia</strong>
              <small>{unreadCount > 0 ? `${formatCount(unreadCount)} nieodczytanych` : "Wszystko przeczytane"}</small>
            </div>
            <button type="button" onClick={loadNotifications} disabled={loading}>
              Odśwież
              <RefreshIcon />
            </button>
            <button type="button" onClick={handleMarkAllRead} disabled={loading || overview.items.length === 0}>
              Oznacz wszystkie
              <CheckIcon />
            </button>
            <button type="button" onClick={handleClearAll} disabled={loading || overview.items.length === 0}>
              Wyczyść
              <XIcon />
            </button>
          </header>

          <div className="notificationMenu__list">
            {loading && overview.items.length === 0 && <div className="notificationMenu__state">Ładowanie...</div>}
            {error && <div className="notificationMenu__state is-error">{error}</div>}
            {!loading && !error && overview.items.length === 0 && (
              <div className="notificationMenu__state">
                <span className="notificationMenu__stateIcon"><BellIcon /></span>
                <strong>Brak nowych powiadomień</strong>
              </div>
            )}
            {overview.items.map((item) => {
              const isInvitation = item.type === "friend_request" && friendRequestId(item) > 0;
              return (
                <div
                  key={item.id}
                  className={`notificationItem${item.read ? "" : " is-unread"}`}
                >
                  <button type="button" className="notificationItem__main" onClick={() => goToNotification(item)}>
                    <span className={`notificationItem__dot notificationItem__dot--${item.source || "system"}`} />
                    <span className={`notificationItem__avatar notificationItem__avatar--${item.source || "system"}`}>
                      {itemIcon(item.source, item.title)}
                    </span>
                    <span className="notificationItem__copy">
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                      <em>{formatTime(item.createdAt)}</em>
                    </span>
                  </button>
                  {isInvitation && (
                    <span className="notificationItem__actions" aria-label="Akcje zaproszenia">
                      <button
                        type="button"
                        className="notificationItem__action is-accept"
                        aria-label="Akceptuj zaproszenie"
                        disabled={Boolean(actionId)}
                        onClick={(event) => handleInvitationAction(event, item, "accept")}
                      >
                        <CheckIcon />
                      </button>
                      <button
                        type="button"
                        className="notificationItem__action is-reject"
                        aria-label="Odrzuć zaproszenie"
                        disabled={Boolean(actionId)}
                        onClick={(event) => handleInvitationAction(event, item, "reject")}
                      >
                        <XIcon />
                      </button>
                      {actionId.endsWith(item.id) && <span className="notificationItem__saving">...</span>}
                    </span>
                  )}
                  {item.source === "campaign" && (
                    <span className="notificationItem__actions" aria-label="Akcje powiadomienia">
                      <button
                        type="button"
                        className="notificationItem__action is-reject"
                        aria-label="Usuń powiadomienie"
                        disabled={Boolean(actionId)}
                        onClick={(event) => handleDeleteOne(event, item)}
                      >
                        <XIcon />
                      </button>
                      {actionId.endsWith(item.id) && <span className="notificationItem__saving">...</span>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
