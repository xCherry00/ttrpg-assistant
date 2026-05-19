import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getConversations, getUnreadMessagesCount } from "../api/messages";

const SHELL_PANEL_EVENT = "ttrpg-shell-panel-open";
const PANEL_ID = "messages";

function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function SearchIcon() {
  return (
    <IconBase>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </IconBase>
  );
}

function MessageIcon() {
  return (
    <IconBase>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5H7l-4 3v-5.5A8.4 8.4 0 1 1 21 11.5Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </IconBase>
  );
}

function CloseIcon() {
  return (
    <IconBase>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}

function OpenIcon() {
  return (
    <IconBase>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </IconBase>
  );
}

function SlidersIcon() {
  return (
    <IconBase>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </IconBase>
  );
}

function formatCount(value) {
  const count = Number(value) || 0;
  return count > 99 ? "99+" : String(count);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

  if (hours < 48) return "Wczoraj";
  return `${Math.round(hours / 24)} dni temu`;
}

export default function MessageLauncher() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  const isMessagesPage = location.pathname === "/messages";

  const loadData = useCallback(async () => {
    try {
      const [rows, unread] = await Promise.all([
        getConversations(token, "all"),
        getUnreadMessagesCount(token),
      ]);
      setConversations(rows || []);
      setUnreadCount(unread?.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać wiadomości.");
    }
  }, [token]);

  useEffect(() => {
    if (!token || isMessagesPage) return;
    loadData();
    const intervalId = window.setInterval(loadData, 20000);
    return () => window.clearInterval(intervalId);
  }, [token, isMessagesPage, loadData]);

  useEffect(() => {
    if (isMessagesPage) {
      setOpen(false);
    }
  }, [isMessagesPage]);

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

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations.slice(0, 7);
    return conversations
      .filter((row) => {
        const text = `${row?.title || ""} ${row?.peer?.displayName || ""} ${row?.peer?.username || ""}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 7);
  }, [conversations, search]);

  function openConversation(item) {
    navigate(`/messages?conversation=${item.id}`);
    setOpen(false);
  }

  function openAllMessages() {
    navigate("/messages");
    setOpen(false);
  }

  if (isMessagesPage) {
    return null;
  }

  return (
    <div className="messageLauncher" ref={wrapperRef}>
      {open && (
        <section className="messageLauncher__panel" role="dialog" aria-label="Podgląd wiadomości">
          <header className="messageLauncher__header">
            <h2>Wiadomości</h2>
            <div className="messageLauncher__headerActions">
              <button type="button" className="messageLauncher__iconBtn" onClick={openAllMessages} aria-label="Otwórz wszystkie wiadomości">
                <OpenIcon />
              </button>
              <button type="button" className="messageLauncher__iconBtn" onClick={() => setOpen(false)} aria-label="Zamknij panel wiadomości">
                <CloseIcon />
              </button>
            </div>
          </header>

          <div className="messageLauncher__searchRow">
            <label className="messageLauncher__searchWrap">
              <SearchIcon />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Szukaj..."
                aria-label="Szukaj rozmowy"
              />
            </label>
            <button type="button" className="messageLauncher__filterBtn" aria-label="Filtry wiadomości">
              <SlidersIcon />
            </button>
          </div>

          {error && <div className="messageLauncher__error">{error}</div>}

          <div className="messageLauncher__list">
            {visibleItems.length === 0 && <div className="messageLauncher__empty">Brak rozmów do podglądu.</div>}
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`messageLauncher__item${item.unreadCount > 0 ? " is-unread" : ""}`}
                onClick={() => openConversation(item)}
              >
                <span className="messageLauncher__avatar">{(item?.peer?.displayName || item?.title || "R").slice(0, 1).toUpperCase()}</span>
                <span className="messageLauncher__meta">
                  <span className="messageLauncher__line">
                    <span className="messageLauncher__name">{item?.peer?.displayName || item?.title || "Rozmowa"}</span>
                    <span className="messageLauncher__time">{formatTime(item?.lastMessageAt)}</span>
                  </span>
                  <span className="messageLauncher__line">
                    <span className="messageLauncher__preview">{item?.lastMessagePreview || "Brak wiadomości"}</span>
                    {item.unreadCount > 0 && <span className="messageLauncher__badge">{formatCount(item.unreadCount)}</span>}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button type="button" className="messageLauncher__allBtn" onClick={openAllMessages}>
            Zobacz wszystkie wiadomości
            <span aria-hidden="true">→</span>
          </button>
        </section>
      )}

      <button
        type="button"
        className={`messageLauncher__fab${open ? " is-open" : ""}`}
        onClick={() => {
          const nextOpen = !open;
          if (nextOpen) {
            window.dispatchEvent(new CustomEvent(SHELL_PANEL_EVENT, { detail: { source: PANEL_ID } }));
            loadData();
          }
          setOpen(nextOpen);
        }}
        aria-label="Otwórz wiadomości"
      >
        <MessageIcon />
        {unreadCount > 0 && <span className="messageLauncher__fabBadge">{formatCount(unreadCount)}</span>}
      </button>
    </div>
  );
}
