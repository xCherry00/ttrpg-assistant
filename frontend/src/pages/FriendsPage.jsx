import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  acceptFriendRequest,
  blockUser,
  cancelFriendRequest,
  discoverUsers,
  getFriendSuggestions,
  getSocialOverview,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockUser,
} from "../api/social";

function safeText(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function userName(user) {
  return safeText(user?.displayName || user?.username, "Użytkownik");
}

function userTag(user) {
  if (!user) return "brak-tagu";
  if (user.username && user.tagCode !== undefined && user.tagCode !== null) {
    return `${user.username}#${String(user.tagCode).padStart(4, "0")}`;
  }
  return user.username || user.handle || "brak-tagu";
}

function statusText(user) {
  const activity = String(user?.activityLabel || "").toLowerCase();
  if (user?.online || activity.includes("aktywny teraz") || activity.includes("online")) return "Online";
  return "Offline";
}

function activityText(user) {
  return safeText(user?.activityLabel, statusText(user) === "Online" ? "Aktywny teraz" : "Ostatnio aktywny");
}

function userInitial(user) {
  return userName(user).slice(0, 1).toUpperCase() || "U";
}

function profilePath(user) {
  return user?.handle ? `/users/${user.handle}` : "/friends";
}

function suggestionReason(user) {
  if (user?.suggestionReason) return user.suggestionReason;
  if (Number(user?.sharedCampaignsCount || 0) > 0) return "Wspólna kampania";
  if (Number(user?.mutualFriendsCount || 0) > 0) return "Znajomy znajomego";
  return "Proponowany gracz";
}

function Icon({ name }) {
  const paths = {
    search: "M11 19a8 8 0 1 1 5.7-2.4L21 21",
    plus: "M12 5v14M5 12h14",
    users: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 20c.4-3.4 2.2-5.5 4.5-5.5s4.1 2.1 4.5 5.5m.5 0c.3-2.2 1.6-3.7 3.5-3.7s3.2 1.5 3.5 3.7",
    dot: "M12 12h.01",
    inbox: "M4 4h16v12H7l-3 3V4Zm5 6h6",
    send: "M4 12 20 4l-4 16-3-7-9-1Z",
    block: "M6 6l12 12M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    message: "M4 5h16v11H8l-4 4V5Z",
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3.4 3.4-5.5 7-5.5s6.2 2.1 7 5.5",
    more: "M12 5h.01M12 12h.01M12 19h.01",
    clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    calendar: "M7 3v4M17 3v4M4 8h16M5 5h14v16H5z",
    cube: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9",
    note: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  };
  return (
    <svg className="friendsIcon" aria-hidden="true" viewBox="0 0 24 24">
      <path d={paths[name] || paths.users} />
    </svg>
  );
}

function Avatar({ user, size = "md" }) {
  return (
    <span className={`friendsAvatar friendsAvatar--${size}`}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt={`Avatar ${userName(user)}`} /> : userInitial(user)}
      <i className={statusText(user) === "Online" ? "is-online" : ""} aria-hidden="true" />
    </span>
  );
}

function SearchResultCard({ user, busyKey, runAction, token }) {
  return (
    <ContactCard
      user={user}
      meta={suggestionReason(user)}
      actions={
        user.relationship === "NONE" ? (
          <button type="button" className="friendsMiniBtn is-primary" disabled={busyKey === `invite-search-${user.id}`} onClick={() => runAction(`invite-search-${user.id}`, () => sendFriendRequest(token, user.id))}>
            Dodaj znajomego
          </button>
        ) : (
          <span className="friendsBadge">{user.relationship === "FRIENDS" ? "Znajomy" : user.relationship === "OUTGOING_REQUEST" ? "Zaproszenie wysłane" : user.relationship === "INCOMING_REQUEST" ? "Czeka na akceptację" : "Relacja niedostępna"}</span>
        )
      }
    />
  );
}

function ContactCard({ user, active = false, onSelect, meta, actions }) {
  return (
    <article className={`friendsContactCard${active ? " is-active" : ""}`}>
      <button type="button" className="friendsContactSelect" onClick={onSelect || (() => {})}>
        <Avatar user={user} />
        <span className="friendsContactCopy">
          <strong>{userName(user)}</strong>
          <small>{userTag(user)}</small>
        </span>
        <span className="friendsContactStatus">
          <strong className={statusText(user) === "Online" ? "is-online" : ""}>{statusText(user)}</strong>
          <small>{meta || activityText(user)}</small>
        </span>
      </button>
      <div className="friendsContactActions">
        {actions || (
          <>
            <Link className="friendsIconBtn" to="/messages" aria-label={`Wiadomość do ${userName(user)}`}><Icon name="message" /></Link>
            <Link className="friendsIconBtn" to={profilePath(user)} aria-label={`Profil ${userName(user)}`}><Icon name="profile" /></Link>
            <button type="button" className="friendsIconBtn" aria-label="Więcej akcji"><Icon name="more" /></button>
          </>
        )}
      </div>
    </article>
  );
}

function RequestCard({ request, type, busyKey, runAction, token }) {
  const user = request.user || request;
  return (
    <ContactCard
      user={user}
      meta={type === "incoming" ? "Zaproszenie przychodzące" : "Oczekuje"}
      actions={type === "incoming" ? (
        <>
          <button type="button" className="friendsMiniBtn is-primary" disabled={busyKey === `accept-${request.id}`} onClick={() => runAction(`accept-${request.id}`, () => acceptFriendRequest(token, request.id))}>Akceptuj</button>
          <button type="button" className="friendsMiniBtn" disabled={busyKey === `reject-${request.id}`} onClick={() => runAction(`reject-${request.id}`, () => rejectFriendRequest(token, request.id))}>Odrzuć</button>
        </>
      ) : (
        <button type="button" className="friendsMiniBtn" disabled={busyKey === `cancel-${request.id}`} onClick={() => runAction(`cancel-${request.id}`, () => cancelFriendRequest(token, request.id))}>Cofnij zaproszenie</button>
      )}
    />
  );
}

function BlockedCard({ user, busyKey, runAction, token }) {
  return (
    <ContactCard
      user={user}
      meta="Zablokowany"
      actions={<button type="button" className="friendsMiniBtn" disabled={busyKey === `unblock-${user.id}`} onClick={() => runAction(`unblock-${user.id}`, () => unblockUser(token, user.id))}>Odblokuj</button>}
    />
  );
}

function DetailsPanel({ user, busyKey, runAction, token }) {
  if (!user) {
    return (
      <aside className="friendsDetailsPanel">
        <div className="friendsEmptyDetails">
          <Avatar user={{ displayName: "?" }} size="lg" />
          <h2>Wybierz znajomego z listy, aby zobaczyć szczegóły.</h2>
          <p>Po wybraniu osoby pokażemy status, profil i wspólne kampanie.</p>
        </div>
      </aside>
    );
  }

  const sharedCampaigns = Array.isArray(user.sharedCampaigns) ? user.sharedCampaigns.slice(0, 3) : [];

  return (
    <aside className="friendsDetailsPanel">
      <div className="friendsDetailsHero">
        <Avatar user={user} size="lg" />
        <h2>{userName(user)}</h2>
        <p>{userTag(user)}</p>
        <strong className={statusText(user) === "Online" ? "is-online" : ""}>{statusText(user)}</strong>
        <span>{activityText(user)}</span>
      </div>

      <div className="friendsDetailsActions">
        <Link className="friendsPrimaryAction" to="/messages"><Icon name="message" /> Wiadomość</Link>
        <Link className="friendsSecondaryAction" to={profilePath(user)}><Icon name="profile" /> Otwórz profil</Link>
        <button type="button" className="friendsIconBtn"><Icon name="more" /></button>
      </div>

      <section className="friendsInfoCard">
        <h3>Informacje</h3>
        <dl>
          <div><dt><Icon name="clock" /> Ostatnia aktywność</dt><dd>{activityText(user)}</dd></div>
          <div><dt><Icon name="calendar" /> Dołączył</dt><dd>{safeText(user.joinedAt || user.createdAt, "Brak danych")}</dd></div>
          <div><dt><Icon name="users" /> Wspólne kampanie</dt><dd>{Number(user.sharedCampaignsCount || sharedCampaigns.length || 0)}</dd></div>
        </dl>
      </section>

      <section className="friendsInfoCard">
        <h3>Wspólne kampanie</h3>
        {sharedCampaigns.length > 0 ? (
          <div className="friendsCampaignList">
            {sharedCampaigns.map((campaign) => (
              <article key={campaign.id || campaign.name}>
                <Icon name="cube" />
                <span><strong>{safeText(campaign.name || campaign.title, "Kampania")}</strong><small>{safeText(campaign.role, "Gracz")}</small></span>
              </article>
            ))}
          </div>
        ) : (
          <div className="friendsSoftEmpty"><Icon name="cube" /><span><strong>Brak wspólnych kampanii</strong><small>Jeszcze nie macie wspólnych kampanii.</small></span></div>
        )}
      </section>

      <section className="friendsInfoCard">
        <h3>Notatka</h3>
        <div className="friendsSoftEmpty"><Icon name="note" /><span><strong>{user.note ? "Notatka" : "Brak notatki"}</strong><small>{user.note || "Dodaj notatkę o tym znajomym, aby łatwiej o nim pamiętać."}</small></span></div>
      </section>

      <div className="friendsDangerRow">
        <button type="button" className="friendsMiniBtn" disabled={busyKey === `remove-${user.id}`} onClick={() => runAction(`remove-${user.id}`, () => removeFriend(token, user.id))}>Usuń</button>
        <button type="button" className="friendsMiniBtn is-danger" disabled={busyKey === `block-${user.id}`} onClick={() => runAction(`block-${user.id}`, () => blockUser(token, user.id))}>Zablokuj</button>
      </div>
    </aside>
  );
}

export default function FriendsPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState("friends");
  const [overview, setOverview] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, suggestionsData] = await Promise.all([
        getSocialOverview(token),
        getFriendSuggestions(token),
      ]);
      setOverview(overviewData);
      setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać sekcji znajomych.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    let active = true;
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await discoverUsers(token, search);
        if (active) setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        if (active) setError(err?.message || "Nie udało się wyszukać użytkowników.");
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [search, token]);

  const friends = useMemo(() => overview?.friends || [], [overview?.friends]);
  const incoming = useMemo(() => overview?.incomingRequests || [], [overview?.incomingRequests]);
  const outgoing = useMemo(() => overview?.outgoingRequests || [], [overview?.outgoingRequests]);
  const blocked = useMemo(() => overview?.blockedUsers || [], [overview?.blockedUsers]);

  const filterItems = [
    { id: "friends", label: "Wszyscy znajomi", icon: "users", count: friends.length },
    { id: "online", label: "Online", icon: "dot", count: friends.filter((user) => statusText(user) === "Online").length },
    { id: "requests", label: "Zaproszenia", icon: "inbox", count: incoming.length },
    { id: "sent", label: "Wysłane", icon: "send", count: outgoing.length },
    { id: "suggested", label: "Proponowane", icon: "plus", count: suggestions.length },
    { id: "blocked", label: "Zablokowani", icon: "block", count: blocked.length },
  ];

  const listUsers = useMemo(() => {
    if (search.trim()) return searchResults;
    if (filter === "online") return friends.filter((user) => statusText(user) === "Online");
    if (filter === "suggested") return suggestions;
    return friends;
  }, [filter, friends, search, searchResults, suggestions]);

  const selectedUser = useMemo(() => {
    if (filter === "requests" || filter === "sent" || filter === "blocked") return null;
    return listUsers.find((user) => Number(user.id) === Number(selectedUserId)) || listUsers[0] || null;
  }, [filter, listUsers, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId && listUsers[0]?.id) setSelectedUserId(listUsers[0].id);
  }, [listUsers, selectedUserId]);

  async function runAction(key, handler) {
    setBusyKey(key);
    setError("");
    try {
      await handler();
      await loadOverview();
      if (search.trim()) {
        const results = await discoverUsers(token, search);
        setSearchResults(Array.isArray(results) ? results : []);
      }
    } catch (err) {
      setError(err?.message || "Akcja nie powiodła się.");
    } finally {
      setBusyKey("");
    }
  }

  const middleTitle = search.trim()
    ? "Wyniki wyszukiwania"
    : filterItems.find((item) => item.id === filter)?.label || "Wszyscy znajomi";

  return (
    <div className="page friendsPage friendsDesk">
      {error && <div className="friendsState friendsState--error">{error}</div>}

      <aside className="friendsRail">
        <label className="friendsSearchBox">
          <Icon name="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Szukaj użytkowników..." />
        </label>
        <button type="button" className="friendsAddBtn" aria-label="Dodaj znajomego przez nick" onClick={() => document.querySelector(".friendsSearchBox input")?.focus()}><Icon name="plus" /> Dodaj znajomego</button>

        <nav className="friendsFilters" aria-label="Filtry znajomych">
          {filterItems.map((item) => (
            <button key={item.id} type="button" aria-label={item.id === "suggested" ? "Proponowane" : item.label} className={filter === item.id && !search.trim() ? "is-active" : ""} onClick={() => { setFilter(item.id); setSearch(""); }}>
              <span><Icon name={item.icon} /> {item.label}</span>
              <strong>{item.count}</strong>
            </button>
          ))}
        </nav>
      </aside>

      <main className="friendsListPanel">
        <header className="friendsListHeader">
          <h2>{middleTitle}</h2>
          <select aria-label="Sortowanie znajomych" defaultValue="activity">
            <option value="activity">Sortuj: Ostatnia aktywność</option>
            <option value="name">Sortuj: Nazwa</option>
          </select>
        </header>

        {loading && <div className="friendsState">Ładowanie sekcji znajomych...</div>}
        {!loading && search.trim() && (
          <div className="friendsContactList">
            {searching && <div className="friendsState">Szukam użytkowników...</div>}
            {!searching && searchResults.length === 0 && <div className="friendsState">Brak pasujących użytkowników.</div>}
            {!searching && searchResults.map((user) => <SearchResultCard key={`search-${user.id}`} user={user} busyKey={busyKey} runAction={runAction} token={token} />)}
          </div>
        )}

        {!loading && !search.trim() && filter === "friends" && (
          <div className="friendsContactList">
            {friends.length === 0 && <div className="friendsState">Brak znajomych w tej kategorii.</div>}
            {friends.map((user) => <ContactCard key={user.id} user={user} active={selectedUser?.id === user.id} onSelect={() => setSelectedUserId(user.id)} />)}
          </div>
        )}

        {!loading && !search.trim() && filter === "online" && (
          <div className="friendsContactList">
            {listUsers.length === 0 && <div className="friendsState">Brak znajomych online.</div>}
            {listUsers.map((user) => <ContactCard key={user.id} user={user} active={selectedUser?.id === user.id} onSelect={() => setSelectedUserId(user.id)} />)}
          </div>
        )}

        {!loading && !search.trim() && filter === "requests" && (
          <div className="friendsContactList">
            {incoming.length === 0 && <div className="friendsState">Brak zaproszeń w tej kategorii.</div>}
            {incoming.map((request) => <RequestCard key={request.id} request={request} type="incoming" busyKey={busyKey} runAction={runAction} token={token} />)}
          </div>
        )}

        {!loading && !search.trim() && filter === "sent" && (
          <div className="friendsContactList">
            {outgoing.length === 0 && <div className="friendsState">Brak wysłanych zaproszeń.</div>}
            {outgoing.map((request) => <RequestCard key={request.id} request={request} type="sent" busyKey={busyKey} runAction={runAction} token={token} />)}
          </div>
        )}

        {!loading && !search.trim() && filter === "suggested" && (
          <div className="friendsContactList">
            {suggestions.length === 0 && <div className="friendsState"><p>Brak propozycji</p><p>Sugestie pojawia sie dla znajomych znajomych oraz osob ze wspolnych kampanii.</p></div>}
            {suggestions.map((user) => (
              <ContactCard
                key={user.id}
                user={user}
                active={selectedUser?.id === user.id}
                onSelect={() => setSelectedUserId(user.id)}
                meta={`Powod: ${suggestionReason(user)}`}
                actions={user.relationship === "NONE" ? (
                  <button type="button" className="friendsMiniBtn is-primary" disabled={busyKey === `invite-${user.id}`} onClick={() => runAction(`invite-${user.id}`, () => sendFriendRequest(token, user.id))}>Dodaj znajomego</button>
                ) : <span className="friendsBadge">Relacja istnieje</span>}
              />
            ))}
          </div>
        )}

        {!loading && !search.trim() && filter === "blocked" && (
          <div className="friendsContactList">
            {blocked.length === 0 && <div className="friendsState">Brak zablokowanych użytkowników.</div>}
            {blocked.map((user) => <BlockedCard key={user.id} user={user} busyKey={busyKey} runAction={runAction} token={token} />)}
          </div>
        )}

        {!loading && <p className="friendsListCount">{search.trim() ? searchResults.length : (filter === "requests" ? incoming.length : filter === "sent" ? outgoing.length : filter === "blocked" ? blocked.length : listUsers.length)} pozycji</p>}
      </main>

      <DetailsPanel user={selectedUser} busyKey={busyKey} runAction={runAction} token={token} />
    </div>
  );
}

