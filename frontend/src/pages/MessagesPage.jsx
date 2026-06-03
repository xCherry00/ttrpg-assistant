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
];

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(value) {
  if (!value) return "Dzisiaj";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Dzisiaj";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Dzisiaj";
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(status) {
  if (status === "incoming_request") return "Prosba o kontakt";
  if (status === "outgoing_request") return "Oczekuje na akceptacje";
  return "Aktywna rozmowa";
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "Brak rozmiaru";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileTypeLabel(attachment) {
  const source = attachment?.contentType || attachment?.mimeType || attachment?.originalName || "plik";
  const extension = String(source).split(".").pop()?.split("/").pop() || "plik";
  return extension.toUpperCase();
}

function conversationName(conversation) {
  return conversation?.peer?.displayName || conversation?.title || "Rozmowa";
}

function conversationInitial(conversation) {
  return conversationName(conversation).slice(0, 1).toUpperCase() || "R";
}

function conversationAvatar(conversation) {
  return conversation?.peer?.avatarUrl || "";
}

function PeerAvatar({ conversation, className }) {
  const avatar = conversationAvatar(conversation);
  return (
    <span className={`${className}${avatar ? " has-image" : ""}`}>
      {avatar ? <img src={avatar} alt={`Avatar ${conversationName(conversation)}`} /> : conversationInitial(conversation)}
      <i className={`messagesStatusDot${hasUnread(conversation) ? " is-online" : ""}`} aria-hidden="true" />
    </span>
  );
}

function peerTag(peer) {
  if (!peer) return "Brak identyfikatora";
  if (peer.username && peer.tagCode !== undefined && peer.tagCode !== null) {
    return `${peer.username}#${String(peer.tagCode).padStart(4, "0")}`;
  }
  return peer.username || peer.handle || "Brak identyfikatora";
}

function hasUnread(conversation) {
  return Number(conversation?.unreadCount || 0) > 0;
}

function handleNewConversationFocus() {
  document.getElementById("messages-discover")?.focus();
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
      setError(err?.message || "Nie udalo sie pobrac listy rozmow.");
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConversationId, filter, searchParams, token]);

  const loadMessages = useCallback(async (conversationId, { beforeId, appendOlder = false } = {}) => {
    if (!conversationId) return;
    if (!appendOlder) setLoadingMessages(true);
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
      setError(err?.message || "Nie udalo sie pobrac wiadomosci.");
    } finally {
      if (!appendOlder) setLoadingMessages(false);
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
        setError(err?.message || "Nie udalo sie wyszukac graczy.");
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
      setError(err?.message || "Nie udalo sie wyslac wiadomosci.");
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
      setError(err?.message || "Nie udalo sie rozpoczac rozmowy.");
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
      setError(err?.message || "Nie udalo sie zaakceptowac prosby.");
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
      setError(err?.message || "Nie udalo sie odrzucic prosby.");
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
      setError(err?.message || "Nie udalo sie pobrac zalacznika.");
    }
  }

  return (
    <div className="page messagesPageWrap">
      <div className="messagesPage">
        <section className="messagesSidebar panel-soft">
          <header className="messagesSidebar__header">
            <div>
              <h2>Wiadomosci</h2>
              <p>{conversations.length} rozmow</p>
            </div>
            <span>{conversations.length}</span>
          </header>

          <div className="messagesSidebar__filters">
            {FILTERS.map((item) => (
              <button key={item.id} type="button" className={`messagesFilter${filter === item.id ? " is-active" : ""}`} onClick={() => setFilter(item.id)}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="messagesSidebar__discover">
            <div className="messagesDiscoverSearch">
              <span aria-hidden="true" className="messagesSearchIcon">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              </span>
              <input id="messages-discover" value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Szukaj uzytkownika..." />
              <button type="button" className="messagesNewButton" onClick={handleNewConversationFocus} aria-label="Nowa rozmowa">+</button>
            </div>
            {loadingPeople && <div className="messagesHint">Szukam uzytkownikow...</div>}
            {!loadingPeople && peopleQuery.trim() && people.length === 0 && <div className="messagesHint">Brak wynikow wyszukiwania.</div>}
            {!loadingPeople && people.length > 0 && (
              <div className="messagesDiscoverList">
                {people.slice(0, 5).map((user) => (
                  <button key={user.id} type="button" className="messagesDiscoverItem" onClick={() => handleStartConversation(user.id)} disabled={busyAction === `start-${user.id}`}>
                    <span>{user.displayName || "Uzytkownik"}</span>
                    <small>{peerTag(user)}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="messagesConversationList">
            {loadingConversations && <div className="messagesHint">Ladowanie rozmow...</div>}
            {!loadingConversations && conversations.length === 0 && <div className="messagesHint">Brak rozmow. Zacznij nowa rozmowe powyzej.</div>}
            {!loadingConversations && conversations.map((conversation) => (
              <button key={conversation.id} type="button" className={`messagesConversationItem${activeConversationId === conversation.id ? " is-active" : ""}`} onClick={() => setActiveConversationId(conversation.id)}>
                <PeerAvatar conversation={conversation} className="messagesConversationItem__avatar" />
                <span className="messagesConversationItem__meta">
                  <span className="messagesConversationItem__top">
                    <strong>{conversationName(conversation)}</strong>
                    <small>{formatTime(conversation.lastMessageAt) || "--:--"}</small>
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
          {!activeConversation && (
            <div className="messagesPlaceholder">
              <strong>Wybierz rozmowe z listy</strong>
              <span>Po wybraniu rozmowy zobaczysz tutaj wiadomosci i pole odpowiedzi.</span>
            </div>
          )}
          {activeConversation && (
            <>
              <header className="messagesMain__header">
                <div className="messagesChatPeer">
                  <PeerAvatar conversation={activeConversation} className="messagesHeaderAvatar" />
                  <div>
                    <h3>{conversationName(activeConversation)}</h3>
                    <p>{activeConversation?.peer?.activityLabel || statusLabel(activeConversation.status)}</p>
                  </div>
                </div>
                <div className="messagesMain__tools">
                  {activeConversation.status === "incoming_request" && (
                    <div className="messagesMain__requestActions">
                      <button type="button" className="btn btn-primary" disabled={busyAction === "accept"} onClick={handleAcceptRequest}>Akceptuj</button>
                      <button type="button" className="btn btn-ghost" disabled={busyAction === "reject"} onClick={handleRejectRequest}>Odrzuc</button>
                    </div>
                  )}
                  <button type="button" aria-label="Menu rozmowy">...</button>
                </div>
              </header>

              <div className="messagesThread">
                {hasOlder && <button type="button" className="messagesOlderBtn" onClick={() => loadMessages(activeConversation.id, { beforeId: messages[0]?.id, appendOlder: true })}>Pokaz starsze wiadomosci</button>}
                <div className="messagesDateDivider"><span>{formatDateLabel(messages[0]?.createdAt)}</span></div>
                {loadingMessages && <div className="messagesHint">Ladowanie wiadomosci...</div>}
                {!loadingMessages && messages.length === 0 && <div className="messagesHint messagesHint--empty">Brak wiadomosci. Napisz pierwsza wiadomosc.</div>}

                {messages.map((message) => (
                  <article key={message.id} className={`messageRow${message.own ? " is-own" : ""}`}>
                    {!message.own && (
                      <span className={`messageAvatar${activeConversation.peer?.avatarUrl ? " has-image" : ""}`}>
                        {activeConversation.peer?.avatarUrl ? <img src={activeConversation.peer.avatarUrl} alt={`Avatar ${conversationName(activeConversation)}`} /> : String(message.senderDisplayName || conversationName(activeConversation)).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className={`messageBubble${message.own ? " is-own" : ""}`}>
                      <div className="messageBubble__meta">
                        <strong>{message.own ? "Ty" : message.senderDisplayName || conversationName(activeConversation)}</strong>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                      {message.content && <p>{message.content}</p>}
                      {message.attachments?.length > 0 && (
                        <div className="messageAttachments">
                          {message.attachments.map((attachment) => (
                            <button key={attachment.id} type="button" className="messageAttachment" onClick={() => handleDownloadAttachment(attachment)}>
                              <span className="messageAttachment__icon" aria-hidden="true">F</span>
                              <span className="messageAttachment__body">
                                <strong>{attachment.originalName || "Zalacznik"}</strong>
                                <small>{formatBytes(attachment.sizeBytes)} - {fileTypeLabel(attachment)}</small>
                              </span>
                              <span className="messageAttachment__download" aria-hidden="true">v</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {message.own && <span className="messageReadState">wyslano</span>}
                    </div>
                  </article>
                ))}
              </div>

              <div className="messagesComposer">
                {files.length > 0 && (
                  <div className="messagesFilesPreview">
                    {files.map((file) => <span key={`${file.name}-${file.size}`}>{file.name} - {formatBytes(file.size)}</span>)}
                  </div>
                )}
                <div className="messagesComposer__bar">
                  <label className="messagesFileInput" aria-label="Dodaj plik">
                    <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} disabled={activeConversation.status === "incoming_request" || sending} />
                    <span>+</span>
                  </label>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={activeConversation.status === "incoming_request" ? "Najpierw zaakceptuj prosbe o kontakt." : "Napisz wiadomosc..."}
                    disabled={activeConversation.status === "incoming_request" || sending}
                  />
                  <button type="button" className="messagesEmojiButton" aria-label="Emoji">:)</button>
                  <button type="button" className="btn btn-primary messagesSendButton" disabled={sending || activeConversation.status === "incoming_request" || (!draft.trim() && files.length === 0)} onClick={handleSend}>Wyslij</button>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="messagesDetails panel-soft">
          {activeConversation?.peer ? (
            <div className="messagesDetails__content">
              <div className="messagesDetails__top">
                <span className="messagesDetails__presence" aria-hidden="true" />
                <div className={`messagesDetails__avatar${activeConversation.peer.avatarUrl ? " has-image" : ""}`}>
                  {activeConversation.peer.avatarUrl ? <img src={activeConversation.peer.avatarUrl} alt={`Avatar ${activeConversation.peer.displayName}`} /> : activeConversation.peer.displayName.slice(0, 1).toUpperCase()}
                </div>
                <h3>{activeConversation.peer.displayName}</h3>
                <p>{peerTag(activeConversation.peer)}</p>
                <span>{activeConversation.peer.activityLabel || "Aktywna rozmowa"}</span>
                <Link className="btn btn-ghost messagesProfileButton" to={`/users/${activeConversation.peer.handle}`}>Otworz profil</Link>
              </div>

              <div className="messagesInfoBlock">
                <h4>Rozmowa</h4>
                <dl>
                  <div><dt>Rozpoczeta</dt><dd>{formatDateLabel(activeConversation.createdAt || activeConversation.lastMessageAt)}</dd></div>
                  <div><dt>Wiadomosci</dt><dd>{messages.length}</dd></div>
                  <div><dt>Status</dt><dd>{statusLabel(activeConversation.status)}</dd></div>
                </dl>
              </div>

              {messages.some((message) => message.attachments?.length) && (
                <div className="messagesInfoBlock">
                  <h4>Zalaczniki w rozmowie</h4>
                  <div className="messagesDetailsFiles">
                    {messages.flatMap((message) => message.attachments || []).map((attachment) => (
                      <button key={attachment.id} type="button" onClick={() => handleDownloadAttachment(attachment)}>
                        <strong>{attachment.originalName || "Plik"}</strong>
                        <span>{formatBytes(attachment.sizeBytes)} - {fileTypeLabel(attachment)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="messagesDetails__content messagesDetails__empty">
              <div className="messagesDetails__avatar" aria-hidden="true">?</div>
              <h3>Informacje o rozmowcy</h3>
              <p>Wybierz rozmowe, aby zobaczyc profil i ostatnie zalaczniki.</p>
            </div>
          )}
        </aside>

        {error && <div className="messagesGlobalError">{error}</div>}
      </div>
    </div>
  );
}
