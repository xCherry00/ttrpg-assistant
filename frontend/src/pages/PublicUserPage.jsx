import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { blockUser, getPublicProfile, removeFriend, sendFriendRequest } from "../api/social";
import { startDirectConversation } from "../api/messages";
import { imagePlaceholder } from "../data/imageLibrary";
import "../styles/profile.css";

const ICONS = {
  campaign: "M4 6h16v12H4z M8 6V4h8v2 M8 10h8 M8 14h5",
  friends: "M16 11a4 4 0 1 0-8 0 M4 20c.8-3.3 3.7-5 8-5s7.2 1.7 8 5 M18 8a3 3 0 0 1 0 6 M20 20c-.3-1.3-1-2.4",
  message: "M5 6h14v10H8l-3 3z",
  block: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M7 7l10 10",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1.2-4 4-6 8-6s6.8 2 8 6",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v5l3 2",
  calendar: "M7 4v3 M17 4v3 M5 8h14 M6 6h12v14H6z",
  trophy: "M8 5h8v3a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 3 M16 6h3a3 3 0 0 1-3 3 M12 12v5 M9 20h6",
  info: "M12 17v-6 M12 8h.01 M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z",
};

function Icon({ name }) {
  return (
    <svg className="profileIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name] || ICONS.user} />
    </svg>
  );
}

function normalizeRole(user) {
  const role = String(user?.role || "PLAYER").toUpperCase();
  const base = role === "PLAYER" ? "Gracz" : role;
  return user?.isMg ? `${base} + MG` : base;
}

function relationLabel(relation) {
  switch (relation) {
    case "SELF": return "To jest Twoj profil";
    case "FRIENDS": return "Znajomy";
    case "INCOMING_REQUEST": return "Zaproszenie od uzytkownika";
    case "OUTGOING_REQUEST": return "Zaproszenie wyslane";
    case "BLOCKED_BY_ME": return "Zablokowany";
    case "BLOCKED_ME": return "Interakcje niedostepne";
    default: return "Brak relacji";
  }
}

function safeText(value, fallback = "Brak") {
  const text = typeof value === "string" ? value.trim() : value;
  if (text === null || text === undefined || text === "") return fallback;
  return String(text);
}

function formatTag(user) {
  const tag = user?.tagCode === null || user?.tagCode === undefined ? "0000" : String(user.tagCode).padStart(4, "0");
  return `@${safeText(user?.username, "uzytkownik")}#${tag}`;
}

function profileBannerFor(user) {
  return user?.bannerUrl || user?.profileBannerUrl || user?.bannerImageUrl || user?.coverImageUrl || imagePlaceholder("campaignBanners");
}

function formatDate(value, fallback = "Brak danych") {
  const d = new Date(value || 0);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("pl-PL");
}

function InfoRow({ label, value }) {
  return (
    <div className="profileInfoRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="profileEmptyState">
      <span><Icon name="info" /></span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export default function PublicUserPage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState("relation");

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

  async function runAction(action, fallback = "Akcja nie powiodla sie.") {
    if (!profile?.user) return;
    setBusy(true);
    setError("");
    try {
      await action();
      await loadProfile();
    } catch (err) {
      setError(err?.message || fallback);
    } finally {
      setBusy(false);
    }
  }

  async function handleMessage() {
    if (!user?.id) return;
    setBusy(true);
    setError("");
    try {
      const conversation = await startDirectConversation(token, user.id);
      const id = conversation?.id || conversation?.conversationId;
      navigate(id ? `/messages?conversation=${id}` : "/messages");
    } catch (err) {
      setError(err?.message || "Nie udalo sie otworzyc rozmowy.");
    } finally {
      setBusy(false);
    }
  }

  const user = profile?.user;
  const relation = String(user?.relationship || "NONE");
  const displayName = safeText(user?.displayName || user?.username, "Uzytkownik");
  const initial = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName]);
  const sharedCampaignsCount = Number(user?.sharedCampaignsCount || profile?.sharedCampaignsCount || 0);
  const mutualFriendsCount = Number(user?.mutualFriendsCount || profile?.mutualFriendsCount || 0);

  const achievements = useMemo(() => [
    { id: "first-campaign", title: "Pierwsza kampania", desc: "Uczestniczy w kampanii", unlocked: (profile?.campaignsCount ?? 0) >= 1 },
    { id: "gm-table", title: "Prowadzacy", desc: "Prowadzi kampanie jako MG", unlocked: (profile?.ownedCampaignsCount ?? 0) >= 1 },
    { id: "social", title: "Druzyna", desc: "Buduje siec znajomych", unlocked: (profile?.friendsCount ?? 0) >= 5 },
    { id: "shared", title: "Wspolny stol", desc: "Macie wspolna kampanie", unlocked: sharedCampaignsCount >= 1 },
  ], [profile?.campaignsCount, profile?.friendsCount, profile?.ownedCampaignsCount, sharedCampaignsCount]);

  const canInteract = relation !== "SELF" && relation !== "BLOCKED_BY_ME" && relation !== "BLOCKED_ME";
  const publicCampaigns = Array.isArray(profile?.campaigns) ? profile.campaigns : [];
  const sharedCampaigns = Array.isArray(profile?.sharedCampaigns) ? profile.sharedCampaigns : [];

  return (
    <div className="page profileDesk publicProfileDesk">
      {loading && <div className="profileState profileStateLight">Ladowanie profilu...</div>}
      {error && <div className="profileState profileStateLight is-error">{error}</div>}

      {!loading && user && (
        <div className="profileShell">
          <aside className="profileCardPanel">
            <div className="profileBanner profileBannerUpload" aria-label="Baner profilu">
              <img src={profileBannerFor(user)} alt="" />
            </div>
            <div className="profileAvatarRow">
              <div className="profileAvatarLarge" aria-label={`Avatar ${displayName}`}>
                {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar uzytkownika" /> : initial}
                <i className={String(user.activityLabel || "").toLowerCase().includes("aktywn") ? "is-online" : ""} aria-hidden="true" />
              </div>
            </div>

            <div className="profileCardBody">
              <div className="profilePublicIntro">
                <h1>Profil gracza</h1>
                <p>Publiczne informacje, relacja i wspolne kampanie.</p>
                <Link to="/friends" className="profileSecondaryAction">Wroc do znajomych</Link>
              </div>
              <h2>{displayName}</h2>
              <p className="profileHandle">{formatTag(user)}</p>
              <p className="profileQuote">{safeText(user.bio, "Ten uzytkownik nie dodal jeszcze opisu.")}</p>

              <div className="profileMetaList">
                <InfoRow label="Rola" value={normalizeRole(user)} />
                <InfoRow label="Status" value={safeText(user.activityLabel, "Aktywnosc ukryta")} />
                <InfoRow label="Ulubiony system" value={safeText(user.favoriteSystem)} />
                <InfoRow label="Strefa czasowa" value={safeText(user.timezone)} />
                <InfoRow label="Dolaczyl" value={formatDate(user.createdAt || user.joinedAt)} />
              </div>

              <div className="profileCardActions">
                <button type="button" className="profilePrimaryAction" onClick={handleMessage} disabled={!canInteract || busy}>
                  <Icon name="message" /> Wyslij wiadomosc
                </button>

                {relation === "SELF" && <Link to="/profile" className="profileSecondaryAction"><Icon name="user" /> Moj profil</Link>}
                {relation === "NONE" && (
                  <button type="button" className="profileSecondaryAction" disabled={busy} onClick={() => runAction(() => sendFriendRequest(token, user.id), "Nie udalo sie wyslac zaproszenia.")}>
                    <Icon name="friends" /> Dodaj znajomego
                  </button>
                )}
                {relation === "FRIENDS" && (
                  <button type="button" className="profileSecondaryAction" disabled={busy} onClick={() => runAction(() => removeFriend(token, user.id), "Nie udalo sie usunac znajomego.")}>
                    <Icon name="friends" /> Znajomy
                  </button>
                )}
                {relation === "OUTGOING_REQUEST" && <button type="button" className="profileSecondaryAction" disabled>Zaproszenie wyslane</button>}
                {relation === "INCOMING_REQUEST" && <Link to="/friends" className="profileSecondaryAction"><Icon name="friends" /> Obsluz zaproszenie</Link>}
                {(relation === "NONE" || relation === "OUTGOING_REQUEST" || relation === "INCOMING_REQUEST" || relation === "FRIENDS") && (
                  <button type="button" className="profileSecondaryAction is-danger" disabled={busy} onClick={() => runAction(() => blockUser(token, user.id), "Nie udalo sie zablokowac uzytkownika.")}>
                    <Icon name="block" /> Zablokuj
                  </button>
                )}
              </div>
            </div>
          </aside>

          <main className="profileMainPanel">
            <nav className="profileTabs" aria-label="Sekcje profilu publicznego">
              {[
                ["relation", "Relacja"],
                ["campaigns", "Kampanie"],
              ].map(([id, label]) => (
                <button key={id} type="button" className={activePanel === id ? "is-active" : ""} onClick={() => setActivePanel(id)}>
                  {label}
                </button>
              ))}
            </nav>

            {activePanel === "relation" && (
              <section className="profileSplitContent">
                <article className="profileContentPanel">
                  <header className="profileSectionHeader">
                    <h2>Akcje</h2>
                    <p>Status relacji: {relationLabel(relation)}</p>
                  </header>
                  <div className="profileRelationActions">
                    <button type="button" className="profilePrimaryAction" onClick={handleMessage} disabled={!canInteract || busy}><Icon name="message" /> Wiadomosc</button>
                    {relation === "NONE" && <button type="button" className="profileSecondaryAction" disabled={busy} onClick={() => runAction(() => sendFriendRequest(token, user.id))}><Icon name="friends" /> Dodaj znajomego</button>}
                    {relation === "FRIENDS" && <button type="button" className="profileSecondaryAction" disabled={busy} onClick={() => runAction(() => removeFriend(token, user.id))}><Icon name="friends" /> Usun znajomego</button>}
                    {(relation === "NONE" || relation === "OUTGOING_REQUEST" || relation === "INCOMING_REQUEST" || relation === "FRIENDS") && <button type="button" className="profileSecondaryAction is-danger" disabled={busy} onClick={() => runAction(() => blockUser(token, user.id))}><Icon name="block" /> Zablokuj</button>}
                  </div>
                </article>
                <article className="profileContentPanel">
                  <header className="profileSectionHeader"><h2>Relacje</h2></header>
                  <div className="profileRelationStats">
                    <div>
                      <span>Wspolne kampanie</span>
                      <strong>{sharedCampaignsCount}</strong>
                    </div>
                    <div>
                      <span>Wspolni znajomi</span>
                      <strong>{mutualFriendsCount}</strong>
                    </div>
                  </div>
                </article>
                <article className="profileContentPanel">
                  <header className="profileSectionHeader"><h2>Wspolne kampanie</h2></header>
                  {sharedCampaigns.length > 0 ? (
                    <div className="profileCampaignListV3">
                      {sharedCampaigns.slice(0, 3).map((campaign) => (
                        <article key={campaign.id || campaign.title}>
                          <span><Icon name="campaign" /></span>
                          <div><strong>{safeText(campaign.title || campaign.name, "Kampania")}</strong><small>{safeText(campaign.role, "Wspolna kampania")}</small></div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Nie macie jeszcze wspolnych kampanii" text="Gdy zagracie razem, wspolne kampanie pojawia sie w tym miejscu." />
                  )}
                </article>
              </section>
            )}

            {activePanel === "info" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader"><h2>Informacje publiczne</h2></header>
                <div className="profileInfoGridV3">
                  <InfoRow label="Dolaczyl" value={formatDate(user.createdAt || user.joinedAt)} />
                  <InfoRow label="Ostatnia aktywnosc" value={safeText(user.activityLabel, "Aktywnosc ukryta")} />
                  <InfoRow label="Ulubiony system" value={safeText(user.favoriteSystem)} />
                  <InfoRow label="Strefa czasowa" value={safeText(user.timezone)} />
                </div>
              </section>
            )}

            {activePanel === "campaigns" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader"><h2>Kampanie</h2></header>
                {publicCampaigns.length > 0 ? (
                  <div className="profileCampaignListV3">
                    {publicCampaigns.slice(0, 6).map((campaign) => (
                      <article key={campaign.id || campaign.title}>
                        <span><Icon name="campaign" /></span>
                        <div><strong>{safeText(campaign.title || campaign.name, "Kampania")}</strong><small>{safeText(campaign.role || campaign.system, "Publiczna kampania")}</small></div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Brak widocznych kampanii" text="Ten uzytkownik nie udostepnia publicznie kampanii albo nie macie wspolnych kampanii." />
                )}
              </section>
            )}

            {activePanel === "achievements" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader"><h2>Osiagniecia</h2></header>
                <div className="profileAchievementGridV3">
                  {achievements.map((item) => (
                    <article key={item.id} className={item.unlocked ? "is-unlocked" : ""}>
                      <span><Icon name="trophy" /></span>
                      <strong>{item.title}</strong>
                      <p>{item.desc}</p>
                      <small>{item.unlocked ? "Odblokowane" : "W trakcie"}</small>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
