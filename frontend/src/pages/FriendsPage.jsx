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

const TABS = [
  { id: "friends", label: "Znajomi" },
  { id: "requests", label: "Zaproszenia" },
  { id: "suggested", label: "Proponowane" },
  { id: "blocked", label: "Blokady" },
];

function suggestionReason(user) {
  if (user?.suggestionReason) return user.suggestionReason;
  if (Number(user?.sharedCampaignsCount || 0) > 0) return "Wspolna kampania";
  if (Number(user?.mutualFriendsCount || 0) > 0) return "Znajomy znajomego";
  return "Proponowany gracz";
}

function UserCard({ user, actions = [], showSuggestionReason = false }) {
  return (
    <article className="socialCard panel-soft">
      <div className="socialCard__main">
        <div className="socialCard__avatar">{(user?.displayName || user?.username || "U").slice(0, 1).toUpperCase()}</div>
        <div className="socialCard__copy">
          <div className="socialCard__top">
            <h3>{user.displayName}</h3>
            <span className="socialCard__tag">{user.username}#{String(user.tagCode).padStart(4, "0")}</span>
          </div>
          <p>{user.bio || "Ten uzytkownik nie dodal jeszcze opisu."}</p>
          <div className="socialCard__meta">
            <span>{user.role}{user.isMg ? " + MG" : ""}</span>
            <span>{user.activityLabel}</span>
            <span>Wspolne kampanie: {user.sharedCampaignsCount}</span>
            {showSuggestionReason ? <span>Powod: {suggestionReason(user)}</span> : null}
          </div>
        </div>
      </div>

      <div className="socialCard__actions">
        <Link className="socialBtn socialBtn--ghost" to={`/users/${user.handle}`}>
          Profil
        </Link>
        {actions}
      </div>
    </article>
  );
}

export default function FriendsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState("friends");
  const [overview, setOverview] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
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
      setError(err?.message || "Nie udalo sie pobrac sekcji znajomych.");
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
        if (active) {
          setSearchResults(Array.isArray(results) ? results : []);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Nie udalo sie wyszukac uzytkownikow.");
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [search, token]);

  const visibleDiscover = useMemo(() => suggestions, [suggestions]);

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
      setError(err?.message || "Akcja nie powiodla sie.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="page friendsPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">spolecznosc</span>
          <h1 className="pageTitle">Znajomi</h1>
          <p className="pageSubtitle">Zaproszenia, proponowane kontakty i zarzadzanie relacjami.</p>
        </div>
      </div>

      <section className="friendsHero panel">
        <div className="friendsHero__stats">
          <div className="friendsHero__stat">
            <strong>{overview?.friends?.length || 0}</strong>
            <span>Znajomi</span>
          </div>
          <div className="friendsHero__stat">
            <strong>{overview?.incomingRequests?.length || 0}</strong>
            <span>Przychodzace</span>
          </div>
          <div className="friendsHero__stat">
            <strong>{overview?.outgoingRequests?.length || 0}</strong>
            <span>Wyslane</span>
          </div>
        </div>

        <div className="friendsSearch">
          <label className="friendsSearch__label">Szukaj uzytkownikow</label>
          <input
            className="friendsSearch__input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="np. suchy lub suchy#4821"
          />
        </div>
      </section>

      {!!search.trim() && (
        <section className="friendsList">
          <h2>Wyniki wyszukiwania</h2>
          {searching && <div className="friendsState">Szukam uzytkownikow...</div>}
          {!searching && searchResults.length === 0 && <div className="friendsState">Brak pasujacych uzytkownikow.</div>}
          {!searching && searchResults.map((user) => (
            <UserCard
              key={`search-${user.id}`}
              user={user}
              actions={[
                user.relationship === "NONE" ? (
                  <button
                    key="invite"
                    type="button"
                    className="socialBtn"
                    disabled={busyKey === `invite-search-${user.id}`}
                    onClick={() => runAction(`invite-search-${user.id}`, () => sendFriendRequest(token, user.id))}
                  >
                    Dodaj znajomego
                  </button>
                ) : (
                  <span key="state" className="socialBadge">
                    {user.relationship === "FRIENDS" ? "Znajomy" : user.relationship === "OUTGOING_REQUEST" ? "Zaproszenie wyslane" : user.relationship === "INCOMING_REQUEST" ? "Czeka na akceptacje" : "Relacja niedostepna"}
                  </span>
                ),
              ]}
            />
          ))}
        </section>
      )}

      <section className="friendsTabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`friendsTabs__button${tab === item.id ? " is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </section>

      {error && <div className="friendsState friendsState--error">{error}</div>}
      {loading && <div className="friendsState">Ładowanie sekcji znajomych...</div>}

      {!loading && tab === "friends" && (
        <section className="friendsList">
          {(overview?.friends || []).length === 0 && <div className="friendsState">Nie masz jeszcze zadnych znajomych.</div>}
          {(overview?.friends || []).map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actions={[
                <button
                  key="remove"
                  type="button"
                  className="socialBtn"
                  disabled={busyKey === `remove-${user.id}`}
                  onClick={() => runAction(`remove-${user.id}`, () => removeFriend(token, user.id))}
                >
                  Usun
                </button>,
                <button
                  key="block"
                  type="button"
                  className="socialBtn socialBtn--danger"
                  disabled={busyKey === `block-${user.id}`}
                  onClick={() => runAction(`block-${user.id}`, () => blockUser(token, user.id))}
                >
                  Zablokuj
                </button>,
              ]}
            />
          ))}
        </section>
      )}

      {!loading && tab === "requests" && (
        <section className="friendsColumns">
          <div className="friendsColumn">
            <h2>Przychodzace</h2>
            {(overview?.incomingRequests || []).length === 0 && <div className="friendsState">Brak przychodzacych zaproszen.</div>}
            {(overview?.incomingRequests || []).map((request) => (
              <UserCard
                key={request.id}
                user={request.user}
                actions={[
                  <button
                    key="accept"
                    type="button"
                    className="socialBtn"
                    disabled={busyKey === `accept-${request.id}`}
                    onClick={() => runAction(`accept-${request.id}`, () => acceptFriendRequest(token, request.id))}
                  >
                    Akceptuj
                  </button>,
                  <button
                    key="reject"
                    type="button"
                    className="socialBtn socialBtn--ghost"
                    disabled={busyKey === `reject-${request.id}`}
                    onClick={() => runAction(`reject-${request.id}`, () => rejectFriendRequest(token, request.id))}
                  >
                    Odrzuc
                  </button>,
                ]}
              />
            ))}
          </div>

          <div className="friendsColumn">
            <h2>Wyslane</h2>
            {(overview?.outgoingRequests || []).length === 0 && <div className="friendsState">Brak wyslanych zaproszen.</div>}
            {(overview?.outgoingRequests || []).map((request) => (
              <UserCard
                key={request.id}
                user={request.user}
                actions={[
                  <button
                    key="cancel"
                    type="button"
                    className="socialBtn socialBtn--ghost"
                    disabled={busyKey === `cancel-${request.id}`}
                    onClick={() => runAction(`cancel-${request.id}`, () => cancelFriendRequest(token, request.id))}
                  >
                    Anuluj
                  </button>,
                ]}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && tab === "suggested" && (
        <section className="friendsList">
          <h2>Proponowane</h2>
          {visibleDiscover.length === 0 && (
            <div className="friendsState">
              <p>Brak propozycji</p>
              <p>Sugestie pojawią się, gdy bedziesz współdzielić kampanie z innymi użytkownikami.</p>
            </div>
          )}
          {visibleDiscover.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              showSuggestionReason
              actions={[
                user.relationship === "NONE" ? (
                  <button
                    key="invite"
                    type="button"
                    className="socialBtn"
                    disabled={busyKey === `invite-${user.id}`}
                    onClick={() => runAction(`invite-${user.id}`, () => sendFriendRequest(token, user.id))}
                  >
                    Dodaj znajomego
                  </button>
                ) : (
                  <span key="state" className="socialBadge">
                    {user.relationship === "FRIENDS" ? "Znajomy" : user.relationship === "OUTGOING_REQUEST" ? "Zaproszenie wyslane" : user.relationship === "INCOMING_REQUEST" ? "Czeka na akceptacje" : "Relacja niedostepna"}
                  </span>
                ),
                <button
                  key="block"
                  type="button"
                  className="socialBtn socialBtn--danger"
                  disabled={busyKey === `block-discover-${user.id}`}
                  onClick={() => runAction(`block-discover-${user.id}`, () => blockUser(token, user.id))}
                >
                  Zablokuj
                </button>,
              ]}
            />
          ))}
        </section>
      )}

      {!loading && tab === "blocked" && (
        <section className="friendsList">
          {(overview?.blockedUsers || []).length === 0 && <div className="friendsState">Nie zablokowales jeszcze zadnych uzytkownikow.</div>}
          {(overview?.blockedUsers || []).map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actions={[
                <button
                  key="unblock"
                  type="button"
                  className="socialBtn"
                  disabled={busyKey === `unblock-${user.id}`}
                  onClick={() => runAction(`unblock-${user.id}`, () => unblockUser(token, user.id))}
                >
                  Odblokuj
                </button>,
              ]}
            />
          ))}
        </section>
      )}
    </div>
  );
}
