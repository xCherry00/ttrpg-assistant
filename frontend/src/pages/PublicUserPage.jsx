import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { blockUser, getPublicProfile, sendFriendRequest } from "../api/social";

export default function PublicUserPage() {
  const { handle } = useParams();
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getPublicProfile(token, handle);
      setProfile(data);
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać profilu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [handle, token]);

  async function runAction(action) {
    if (!profile?.user) return;
    setBusy(true);
    setError("");
    try {
      await action();
      await loadProfile();
    } catch (err) {
      setError(err?.message || "Akcja nie powiodła się.");
    } finally {
      setBusy(false);
    }
  }

  const user = profile?.user;
  const initial = (user?.displayName || user?.username || "U").slice(0, 1).toUpperCase();
  const tag = user ? String(user.tagCode).padStart(4, "0") : "";
  const isSelf = user?.relationship === "SELF";

  return (
    <div className="page publicProfilePage">
      <div className="pageHeader">
        <Link to="/friends" className="publicProfileBack">
          ← Wróć do znajomych
        </Link>
      </div>

      {loading && <div className="friendsState">Ładowanie profilu…</div>}
      {error && <div className="friendsState friendsState--error">{error}</div>}

      {!loading && user && (
        <section className="publicProfileCard panel">
          {/* Hero — avatar + identyczność */}
          <div className="publicProfileHero">
            <div className="publicProfileHeroAvatar">{initial}</div>
            <h2 className="publicProfileHeroName">{user.displayName}</h2>
            <div className="publicProfileHeroTag">@{user.username}#{tag}</div>
            <div className="publicProfileHeroBadges">
              <span className="publicProfileBadge">
                {user.role}{user.isMg ? " + MG" : ""}
              </span>
              {user.activityLabel && (
                <span className="publicProfileBadge publicProfileBadge--muted">
                  {user.activityLabel}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="publicProfileBio">{user.bio}</p>
          )}

          {/* Statystyki */}
          <div className="publicProfileStats">
            <div className="publicProfileStat">
              <strong>{profile.friendsCount ?? 0}</strong>
              <span>Znajomi</span>
            </div>
            <div className="publicProfileStat">
              <strong>{profile.campaignsCount ?? 0}</strong>
              <span>Kampanie</span>
            </div>
            <div className="publicProfileStat">
              <strong>{profile.ownedCampaignsCount ?? 0}</strong>
              <span>Prowadzone</span>
            </div>
            {!isSelf && (
              <div className="publicProfileStat">
                <strong>{user.sharedCampaignsCount ?? 0}</strong>
                <span>Wspólne</span>
              </div>
            )}
          </div>

          {/* Akcje */}
          <div className="publicProfileActions">
            {isSelf && (
              <Link to="/profile" className="socialBtn">Edytuj profil</Link>
            )}
            {!isSelf && user.relationship === "NONE" && (
              <button type="button" className="socialBtn" disabled={busy}
                onClick={() => runAction(() => sendFriendRequest(token, user.id))}>
                Dodaj znajomego
              </button>
            )}
            {!isSelf && user.relationship === "OUTGOING_REQUEST" && (
              <button type="button" className="socialBtn socialBtn--ghost" disabled>
                Zaproszenie wysłane
              </button>
            )}
            {!isSelf && user.relationship === "INCOMING_REQUEST" && (
              <Link to="/friends" className="socialBtn">Zaakceptuj zaproszenie</Link>
            )}
            {!isSelf && user.relationship === "FRIENDS" && (
              <span className="socialBadge">Znajomy</span>
            )}
            {!isSelf && (
              <button type="button" className="socialBtn socialBtn--danger" disabled={busy}
                onClick={() => runAction(() => blockUser(token, user.id))}>
                Zablokuj
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
