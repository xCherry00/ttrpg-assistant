import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AccountTabNav from "../components/AccountTabNav";
import {
  acceptFriendRequest,
  blockUser,
  cancelFriendRequest,
  discoverUsers,
  getSocialOverview,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockUser,
} from "../api/social";

const TABS = [
  { id: "friends", label: "Znajomi" },
  { id: "requests", label: "Zaproszenia" },
  { id: "discover", label: "Odkrywaj" },
  { id: "blocked", label: "Blokady" },
];

function UserCard({ user, actions = [] }) {
  return (
    <article className="socialCard panel-soft">
      <div className="socialCard__main">
        <div className="socialCard__avatar">{(user?.displayName || user?.username || "U").slice(0, 1).toUpperCase()}</div>
        <div className="socialCard__copy">
          <div className="socialCard__top">
            <h3>{user.displayName}</h3>
            <span className="socialCard__tag">{user.username}#{String(user.tagCode).padStart(4, "0")}</span>
          </div>
          <p>{user.bio || "Ten użytkownik nie dodał jeszcze opisu."}</p>
          <div className="socialCard__meta">
            <span>{user.role}{user.isMg ? " + MG" : ""}</span>
            <span>{user.activityLabel}</span>
            <span>Wspólne kampanie: {user.sharedCampaignsCount}</span>
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
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const data = await getSocialOverview(token);
      setOverview(data);
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać sekcji znajomych.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, [token]);

  useEffect(() => {
    let active = true;
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await discoverUsers(token, search);
        if (active) {
          setSearchResults(results);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Nie udało się wyszukać użytkowników.");
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

  const visibleDiscover = useMemo(() => {
    if (search.trim()) return searchResults;
    return overview?.suggestions || [];
  }, [overview, search, searchResults]);

  async function runAction(key, handler) {
    setBusyKey(key);
    setError("");
    try {
      await handler();
      await loadOverview();
      if (tab === "discover" || search.trim()) {
        const results = await discoverUsers(token, search);
        setSearchResults(results);
      }
    } catch (err) {
      setError(err?.message || "Akcja nie powiodła się.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="page friendsPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Konto</h1>
          <p className="pageSubtitle">Zarządzaj profilem, znajomymi i ustawieniami.</p>
        </div>
      </div>
      <AccountTabNav />

      <section className="friendsHero panel">
        <div className="friendsHero__stats">
          <div className="friendsHero__stat">
            <strong>{overview?.friends?.length || 0}</strong>
            <span>Znajomi</span>
          </div>
          <div className="friendsHero__stat">
            <strong>{overview?.incomingRequests?.length || 0}</strong>
            <span>Przychodzące</span>
          </div>
          <div className="friendsHero__stat">
            <strong>{overview?.outgoingRequests?.length || 0}</strong>
            <span>Wysłane</span>
          </div>
        </div>

        <div className="friendsSearch">
          <label className="friendsSearch__label">Szukaj po nicku lub tagu</label>
          <input
            className="friendsSearch__input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="np. suchy lub suchy#4821"
          />
        </div>
      </section>

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
          {(overview?.friends || []).length === 0 && <div className="friendsState">Nie masz jeszcze żadnych znajomych.</div>}
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
                  Usuń
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
            <h2>Przychodzące</h2>
            {(overview?.incomingRequests || []).length === 0 && <div className="friendsState">Brak przychodzących zaproszeń.</div>}
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
                    Odrzuć
                  </button>,
                ]}
              />
            ))}
          </div>

          <div className="friendsColumn">
            <h2>Wysłane</h2>
            {(overview?.outgoingRequests || []).length === 0 && <div className="friendsState">Brak wysłanych zaproszeń.</div>}
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

      {!loading && tab === "discover" && (
        <section className="friendsList">
          {searching && <div className="friendsState">Szukam użytkowników...</div>}
          {!searching && visibleDiscover.length === 0 && <div className="friendsState">Brak pasujących użytkowników.</div>}
          {!searching && visibleDiscover.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actions={[
                user.relationship === "NONE" ? (
                  <button
                    key="invite"
                    type="button"
                    className="socialBtn"
                    disabled={busyKey === `invite-${user.id}`}
                    onClick={() => runAction(`invite-${user.id}`, () => sendFriendRequest(token, user.id))}
                  >
                    Dodaj
                  </button>
                ) : (
                  <span key="state" className="socialBadge">
                    {user.relationship === "FRIENDS" ? "Znajomy" : user.relationship === "OUTGOING_REQUEST" ? "Zaproszenie wysłane" : user.relationship === "INCOMING_REQUEST" ? "Czeka na akceptację" : "Relacja niedostępna"}
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
          {(overview?.blockedUsers || []).length === 0 && <div className="friendsState">Nie zablokowałeś jeszcze żadnych użytkowników.</div>}
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
