import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { blockUser, getPublicProfile, sendFriendRequest } from "../api/social";

function normalizeRole(user) {
  const role = String(user?.role || "PLAYER").toUpperCase();
  const base = role === "PLAYER" ? "Gracz" : role;
  return user?.isMg ? `${base} + MG` : base;
}

function relationLabel(relation) {
  switch (relation) {
    case "SELF":
      return "To jest Twoj profil";
    case "FRIENDS":
      return "Znajomi";
    case "INCOMING_REQUEST":
      return "Zaproszenie od uzytkownika";
    case "OUTGOING_REQUEST":
      return "Wyslane zaproszenie";
    case "BLOCKED_BY_ME":
      return "Uzytkownik zablokowany";
    case "BLOCKED_ME":
      return "Brak dostepu do interakcji";
    default:
      return "Brak relacji";
  }
}

export default function PublicUserPage() {
  const { handle } = useParams();
  const { token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPublicProfile(token, handle);
      setProfile(data);
    } catch (err) {
      setError(err?.message || "Nie udalo sie pobrac profilu.");
    } finally {
      setLoading(false);
    }
  }, [handle, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function runAction(action) {
    if (!profile?.user) return;
    setBusy(true);
    setError("");
    try {
      await action();
      await loadProfile();
    } catch (err) {
      setError(err?.message || "Akcja nie powiodla sie.");
    } finally {
      setBusy(false);
    }
  }

  const user = profile?.user;
  const initial = useMemo(() => (user?.displayName || user?.username || "U").slice(0, 1).toUpperCase(), [user]);
  const tag = useMemo(() => (user ? String(user.tagCode).padStart(4, "0") : ""), [user]);
  const relation = String(user?.relationship || "NONE");
  const achievements = useMemo(
    () => [
      { id: "first-session", title: "Pierwsza sesja", desc: "Przeprowadz lub rozegrac pierwsza sesje", unlocked: (profile?.campaignsCount ?? 0) >= 1 },
      { id: "world-builder", title: "Tworca swiatow", desc: "Rozwin 10 elementow swojej kampanii", unlocked: (profile?.ownedCampaignsCount ?? 0) >= 2 },
      { id: "chronicle", title: "Kronikarz", desc: "Buduj historie i stale prowadz przygode", unlocked: (profile?.friendsCount ?? 0) >= 5 },
      { id: "dice-master", title: "Mistrz kosci", desc: "Prowadz emocjonujace testy i rzuty", unlocked: (user?.sharedCampaignsCount ?? 0) >= 2 },
      { id: "collector", title: "Kolekcjoner", desc: "Rozwijaj portfolio kampanii", unlocked: (profile?.campaignsCount ?? 0) >= 5 },
    ],
    [profile?.campaignsCount, profile?.friendsCount, profile?.ownedCampaignsCount, user?.sharedCampaignsCount]
  );

  return (
    <div className="page publicV2Page">
      <header className="publicV2Top panel">
        <div>
          <h1>Profil gracza</h1>
          <p>Szczegoly profilu i relacji z wybranym uzytkownikiem.</p>
        </div>
        <Link to="/friends" className="publicV2Back">Wroc do znajomych</Link>
      </header>

      {loading && <div className="friendsState">Ladowanie profilu...</div>}
      {error && <div className="friendsState friendsState--error">{error}</div>}

      {!loading && user && (
        <div className="publicV2Layout">
          <aside className="publicV2Identity panel-soft">
            <div className="publicV2Cover" />

            <div className="publicV2AvatarWrap">
              <div className="publicV2Avatar" aria-hidden="true">{initial}</div>
            </div>

            <h2>{user.displayName}</h2>
            <p className="publicV2Tag">@{user.username}#{tag}</p>
            <p className="publicV2Bio">{user.bio || "Ten uzytkownik nie dodal jeszcze opisu."}</p>

            <div className="publicV2Meta">
              <div><span>Rola</span><strong>{normalizeRole(user)}</strong></div>
              <div><span>Status</span><strong>{user.activityLabel || "aktywnosc ukryta"}</strong></div>
              <div><span>Relacja</span><strong>{relationLabel(relation)}</strong></div>
              <div><span>Ulubiony system</span><strong>{user.favoriteSystem || "Brak"}</strong></div>
            </div>
          </aside>

          <section className="publicV2Main">
            <section className="publicV2Stats panel">
              <article>
                <span>Znajomi</span>
                <strong>{profile.friendsCount ?? 0}</strong>
              </article>
              <article>
                <span>Kampanie</span>
                <strong>{profile.campaignsCount ?? 0}</strong>
              </article>
              <article>
                <span>Prowadzone</span>
                <strong>{profile.ownedCampaignsCount ?? 0}</strong>
              </article>
              <article>
                <span>Wspolne kampanie</span>
                <strong>{user.sharedCampaignsCount ?? 0}</strong>
              </article>
            </section>

            <section className="publicV2Actions panel-soft">
              <header>
                <h3>Akcje</h3>
              </header>

              <div className="publicV2ActionRow">
                {relation === "SELF" && <Link to="/profile" className="socialBtn">Edytuj profil</Link>}

                {relation === "NONE" && (
                  <button
                    type="button"
                    className="socialBtn"
                    disabled={busy}
                    onClick={() => runAction(() => sendFriendRequest(token, user.id))}
                  >
                    Dodaj znajomego
                  </button>
                )}

                {relation === "OUTGOING_REQUEST" && (
                  <button type="button" className="socialBtn socialBtn--ghost" disabled>
                    Zaproszenie wyslane
                  </button>
                )}

                {relation === "INCOMING_REQUEST" && (
                  <Link to="/friends" className="socialBtn">Akceptuj zaproszenie</Link>
                )}

                {relation === "FRIENDS" && <span className="socialBadge">Znajomy</span>}

                {(relation === "NONE" || relation === "OUTGOING_REQUEST" || relation === "INCOMING_REQUEST" || relation === "FRIENDS") && (
                  <button
                    type="button"
                    className="socialBtn socialBtn--danger"
                    disabled={busy}
                    onClick={() => runAction(() => blockUser(token, user.id))}
                  >
                    Zablokuj
                  </button>
                )}

                {relation === "BLOCKED_BY_ME" && <span className="socialBadge">Uzytkownik zablokowany</span>}
                {relation === "BLOCKED_ME" && <span className="socialBadge">Interakcje niedostepne</span>}
              </div>
            </section>

            <section className="publicV2Info panel-soft">
              <header>
                <h3>Informacje spoleczne</h3>
              </header>
              <div className="publicV2InfoGrid">
                <article>
                  <strong>Profil publiczny</strong>
                  <p>Uzytkownik udostepnia podstawowe informacje i aktywnosc zgodnie z ustawieniami prywatnosci.</p>
                </article>
                <article>
                  <strong>Wspolne kampanie</strong>
                  <p>Liczba wspolnych kampanii pomaga szybko zobaczyc, czy gracie juz razem.</p>
                </article>
                <article>
                  <strong>Bezpieczenstwo</strong>
                  <p>W razie potrzeby mozesz zablokowac kontakt bez opuszczania tego widoku.</p>
                </article>
              </div>
            </section>

            <section className="publicV2Achievements panel">
              <header>
                <h3>Osiagniecia</h3>
              </header>
              <div className="publicV2AchievementsGrid">
                {achievements.map((item) => (
                  <article key={item.id} className={item.unlocked ? "is-unlocked" : ""}>
                    <span className="badge">*</span>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                    <small>{item.unlocked ? "Odblokowane" : "W trakcie"}</small>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </div>
      )}
    </div>
  );
}

