import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { discoverUsers } from "../api/social";
import {
  acceptConversationRequest,
  downloadAttachment,
  getConversationMessages,
  getConversations,
  markConversationRead,
  rejectConversationRequest,
  sendMessageWithFiles,
  sendTextMessage,
  startDirectConversation,
} from "../api/messages";

const FILTERS = [
  { id: "all", label: "Wszystkie" },
  { id: "unread", label: "Nieprzeczytane" },
  { id: "requests", label: "Prośby" },
];

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status) {
  if (status === "incoming_request") return "Prośba o kontakt";
  if (status === "outgoing_request") return "Oczekuje na akceptację";
  return "Aktywna rozmowa";
}

export default function MessagesPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filter, setFilter] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const loadConversations = useCallback(async (selectedFilter = filter) => {
    setLoadingConversations(true);
    setError("");
    try {
      const rows = await getConversations(token, selectedFilter);
      setConversations(rows || []);
      if (!rows?.length) {
        setActiveConversationId(null);
        return;
      }

      const fromQuery = Number(searchParams.get("conversation") || 0);
      if (fromQuery && rows.some((row) => row.id === fromQuery)) {
        setActiveConversationId(fromQuery);
      } else if (!rows.some((row) => row.id === activeConversationId)) {
        setActiveConversationId(rows[0].id);
      }
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać listy rozmów.");
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConversationId, filter, searchParams, token]);

  const loadMessages = useCallback(async (conversationId, { beforeId, appendOlder = false } = {}) => {
    if (!conversationId) return;
    if (!appendOlder) {
      setLoadingMessages(true);
    }
    setError("");
    try {
      const rows = await getConversationMessages(token, conversationId, { beforeId, limit: 40 });
      if (appendOlder) {
        setMessages((current) => [...rows, ...current]);
      } else {
        setMessages(rows || []);
      }
      setHasOlder((rows || []).length >= 40);
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać wiadomości.");
    } finally {
      if (!appendOlder) {
        setLoadingMessages(false);
      }
    }
  }, [token]);

  useEffect(() => {
    loadConversations(filter);
  }, [filter, loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    loadMessages(activeConversationId);
    markConversationRead(token, activeConversationId).catch(() => {});
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("conversation", String(activeConversationId));
      return next;
    });
  }, [activeConversationId, loadMessages, setSearchParams, token]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!peopleQuery.trim()) {
        setPeople([]);
        return;
      }
      setLoadingPeople(true);
      try {
        const results = await discoverUsers(token, peopleQuery);
        setPeople(results || []);
      } catch (err) {
        setError(err?.message || "Nie udało się wyszukać graczy.");
      } finally {
        setLoadingPeople(false);
      }
    }, 220);
    return () => clearTimeout(timeoutId);
  }, [peopleQuery, token]);

  async function handleSend() {
    if (!activeConversationId || sending) return;
    const trimmed = draft.trim();
    if (!trimmed && files.length === 0) return;

    setSending(true);
    setError("");
    try {
      if (files.length > 0) {
        await sendMessageWithFiles(token, activeConversationId, { content: trimmed, files });
      } else {
        await sendTextMessage(token, activeConversationId, trimmed);
      }
      setDraft("");
      setFiles([]);
      await Promise.all([loadMessages(activeConversationId), loadConversations(filter)]);
    } catch (err) {
      setError(err?.message || "Nie udało się wysłać wiadomości.");
    } finally {
      setSending(false);
    }
  }

  async function handleStartConversation(userId) {
    setBusyAction(`start-${userId}`);
    setError("");
    try {
      const row = await startDirectConversation(token, userId);
      setFilter("all");
      setPeopleQuery("");
      setPeople([]);
      await loadConversations("all");
      setActiveConversationId(row.id);
    } catch (err) {
      setError(err?.message || "Nie udało się rozpocząć rozmowy.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleAcceptRequest() {
    if (!activeConversationId) return;
    setBusyAction("accept");
    setError("");
    try {
      await acceptConversationRequest(token, activeConversationId);
      await Promise.all([loadConversations(filter), loadMessages(activeConversationId)]);
    } catch (err) {
      setError(err?.message || "Nie udało się zaakceptować prośby.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleRejectRequest() {
    if (!activeConversationId) return;
    setBusyAction("reject");
    setError("");
    try {
      await rejectConversationRequest(token, activeConversationId);
      await loadConversations(filter);
      setMessages([]);
    } catch (err) {
      setError(err?.message || "Nie udało się odrzucić prośby.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleDownloadAttachment(attachment) {
    try {
      const { blob, filename } = await downloadAttachment(token, attachment.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać załącznika.");
    }
  }

  return (
    <div className="page messagesPageWrap">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">spolecznosc</span>
          <h1 className="pageTitle">Wiadomosci</h1>
          <p className="pageSubtitle">Rozmowy 1:1, zaproszenia i wysylanie zalacznikow.</p>
        </div>
      </div>
      <div className="messagesPage">
      <section className="messagesSidebar panel-soft">
        <header className="messagesSidebar__header">
          <h2>Wiadomości</h2>
          <span>{conversations.length}</span>
        </header>

        <div className="messagesSidebar__filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`messagesFilter${filter === item.id ? " is-active" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="messagesSidebar__discover">
          <label htmlFor="messages-discover">Nowa rozmowa</label>
          <input
            id="messages-discover"
            value={peopleQuery}
            onChange={(event) => setPeopleQuery(event.target.value)}
            placeholder="Wpisz nick lub #tag"
          />
          {loadingPeople && <div className="messagesHint">Szukam użytkowników...</div>}
          {!loadingPeople && peopleQuery.trim() && people.length === 0 && <div className="messagesHint">Brak wyników.</div>}
          {!loadingPeople && people.length > 0 && (
            <div className="messagesDiscoverList">
              {people.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="messagesDiscoverItem"
                  onClick={() => handleStartConversation(user.id)}
                  disabled={busyAction === `start-${user.id}`}
                >
                  <span>{user.displayName}</span>
                  <small>{user.username}#{String(user.tagCode).padStart(4, "0")}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="messagesConversationList">
          {loadingConversations && <div className="messagesHint">Ładowanie rozmów...</div>}
          {!loadingConversations && conversations.length === 0 && (
            <div className="messagesHint">
              Brak rozmów w tym widoku. Wyszukaj użytkownika powyżej, żeby rozpocząć konwersację.
            </div>
          )}
          {!loadingConversations &&
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`messagesConversationItem${activeConversationId === conversation.id ? " is-active" : ""}`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <span className="messagesConversationItem__avatar">
                  {(conversation?.peer?.displayName || conversation.title || "R").slice(0, 1).toUpperCase()}
                </span>
                <span className="messagesConversationItem__meta">
                  <span className="messagesConversationItem__top">
                    <strong>{conversation?.peer?.displayName || conversation.title || "Rozmowa"}</strong>
                    <small>{formatTime(conversation.lastMessageAt)}</small>
                  </span>
                  <span className="messagesConversationItem__bottom">
                    <span>{conversation.lastMessagePreview || statusLabel(conversation.status)}</span>
                    {conversation.unreadCount > 0 && <span className="messagesUnreadBadge">{conversation.unreadCount}</span>}
                  </span>
                </span>
              </button>
            ))}
        </div>
      </section>

      <section className="messagesMain panel-soft">
        {!activeConversation && <div className="messagesPlaceholder">Wybierz rozmowę z listy, aby rozpocząć czat.</div>}
        {activeConversation && (
          <>
            <header className="messagesMain__header">
              <div>
                <h3>{activeConversation?.peer?.displayName || activeConversation.title}</h3>
                <p>{statusLabel(activeConversation.status)}</p>
              </div>
              {activeConversation.status === "incoming_request" && (
                <div className="messagesMain__requestActions">
                  <button type="button" className="btn btn-primary" disabled={busyAction === "accept"} onClick={handleAcceptRequest}>
                    Akceptuj
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={busyAction === "reject"} onClick={handleRejectRequest}>
                    Odrzuć
                  </button>
                </div>
              )}
            </header>

            <div className="messagesThread">
              {hasOlder && (
                <button
                  type="button"
                  className="messagesOlderBtn"
                  onClick={() => loadMessages(activeConversation.id, { beforeId: messages[0]?.id, appendOlder: true })}
                >
                  Pokaż starsze wiadomości
                </button>
              )}
              {loadingMessages && <div className="messagesHint">Ładowanie wiadomości...</div>}
              {!loadingMessages && messages.length === 0 && <div className="messagesHint">Brak wiadomości w tej rozmowie. Napisz pierwszą wiadomość poniżej.</div>}

              {messages.map((message) => (
                <article key={message.id} className={`messageBubble${message.own ? " is-own" : ""}`}>
                  <div className="messageBubble__meta">
                    <strong>{message.own ? "Ty" : message.senderDisplayName}</strong>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>
                  {message.content && <p>{message.content}</p>}
                  {message.attachments?.length > 0 && (
                    <div className="messageAttachments">
                      {message.attachments.map((attachment) => (
                        <button key={attachment.id} type="button" className="messageAttachment" onClick={() => handleDownloadAttachment(attachment)}>
                          <span>{attachment.originalName}</span>
                          <small>{Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB</small>
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="messagesComposer">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  activeConversation.status === "incoming_request"
                    ? "Najpierw zaakceptuj prośbę o kontakt."
                    : "Napisz wiadomość..."
                }
                disabled={activeConversation.status === "incoming_request" || sending}
              />
              <div className="messagesComposer__row">
                <label className="messagesFileInput">
                  <input
                    type="file"
                    multiple
                    onChange={(event) => setFiles(Array.from(event.target.files || []))}
                    disabled={activeConversation.status === "incoming_request" || sending}
                  />
                  <span>Dodaj pliki</span>
                </label>
                <button type="button" className="btn btn-primary" disabled={sending || activeConversation.status === "incoming_request"} onClick={handleSend}>
                  Wyślij
                </button>
              </div>
              {files.length > 0 && <div className="messagesFilesPreview">{files.map((file) => file.name).join(", ")}</div>}
            </div>
          </>
        )}
      </section>

      <aside className="messagesDetails panel-soft">
        {!activeConversation && <div className="messagesHint">Szczegóły rozmowy pojawią się po wyborze kontaktu.</div>}
        {activeConversation?.peer && (
          <div className="messagesDetails__content">
            <div className="messagesDetails__avatar">{activeConversation.peer.displayName.slice(0, 1).toUpperCase()}</div>
            <h3>{activeConversation.peer.displayName}</h3>
            <p>{activeConversation.peer.username}#{String(activeConversation.peer.tagCode).padStart(4, "0")}</p>
            <span>{activeConversation.peer.activityLabel}</span>
            <Link className="btn btn-ghost" to={`/users/${activeConversation.peer.handle}`}>
              Otwórz profil
            </Link>
          </div>
        )}
      </aside>

        {error && <div className="messagesGlobalError">{error}</div>}
      </div>
    </div>
  );
}

