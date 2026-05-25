import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyProfile, updateDisplayName } from "../api/settings";
import { listCampaigns, listCampaignSessions } from "../api/campaigns";
import { getSocialOverview } from "../api/social";
import ImageUpload from "../components/common/ImageUpload";
import "../styles/profile.css";

const RECENT_GENERATIONS_KEY = "ttrpg_recent_generations_v1";

const TOOL_META = {
  npc: { name: "Generator NPC", desc: "Wygeneruj postac niezalezna" },
  monster: { name: "Generator potworow", desc: "Buduj spotkania i bestie" },
  loot: { name: "Generator lupu", desc: "Tworz nagrody i skarby" },
  tavern: { name: "Generator karczm", desc: "Projektuj miejsca i sceny" },
  faction: { name: "Generator frakcji", desc: "Rozwijaj swiat i polityke" },
  settlement: { name: "Generator osad", desc: "Tworz miasta i regiony" },
  region: { name: "Generator regionow", desc: "Mapuj krainy i szlaki" },
  poetry: { name: "Poezja i lore", desc: "Tworz lore i klimat" },
  spellbook: { name: "Ksiega zaklec", desc: "Buduj magie kampanii" },
  dungeon: { name: "Generator podziemi", desc: "Projektuj wyprawy" },
};

function getAvatarStorageKey(email) {
  return `ttrpg_avatar_${email || "default"}`;
}

function getRoleLabel(profile) {
  const role = String(profile?.role || "PLAYER").toUpperCase();
  const roleLabel = role === "PLAYER" ? "Gracz" : role;
  return profile?.isMg ? `${roleLabel} + MG` : roleLabel;
}

function readRecentGenerations(userId) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_GENERATIONS_KEY);
    const parsed = JSON.parse(raw || "[]");
    const list = Array.isArray(parsed) ? parsed : [];
    if (!userId) return [];
    return list.filter((entry) => String(entry?.userId || "") === String(userId));
  } catch {
    return [];
  }
}

function safeDate(value) {
  const d = new Date(value || 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatRelative(value) {
  const d = safeDate(value);
  if (!d) return "niedawno";
  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / (15 * 60 * 1000)))} kw. temu`;
  if (diffMs < day) return `${Math.round(diffMs / hour)} godz. temu`;
  return `${Math.round(diffMs / day)} dni temu`;
}

function toSessionHours(session) {
  const start = safeDate(session?.startedAt);
  const finish = safeDate(session?.finishedAt);
  if (!start || !finish) return 0;
  const diff = finish.getTime() - start.getTime();
  if (diff <= 0) return 0;
  return diff / (1000 * 60 * 60);
}

export default function ProfilePage() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [socialOverview, setSocialOverview] = useState(null);
  const [recentGenerations, setRecentGenerations] = useState([]);

  const [displayNameInput, setDisplayNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  const [avatarSrc, setAvatarSrc] = useState("");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const me = await getMyProfile(token);
        if (cancelled) return;

        setProfile(me);
        setDisplayNameInput(me?.displayName || (me?.email ? me.email.split("@")[0] : ""));
        setAvatarSrc(localStorage.getItem(getAvatarStorageKey(me?.email)) || "");
        setRecentGenerations(readRecentGenerations(me?.id));

        const [campaignsRes, socialRes] = await Promise.allSettled([
          listCampaigns(token),
          getSocialOverview(token),
        ]);

        let loadedCampaigns = [];
        if (campaignsRes.status === "fulfilled" && Array.isArray(campaignsRes.value)) {
          loadedCampaigns = campaignsRes.value;
          if (!cancelled) setCampaigns(loadedCampaigns);
        }

        if (socialRes.status === "fulfilled" && socialRes.value) {
          if (!cancelled) setSocialOverview(socialRes.value);
        }

        if (loadedCampaigns.length > 0) {
          const sessionResults = await Promise.allSettled(
            loadedCampaigns.map((campaign) => listCampaignSessions(token, campaign.id))
          );

          const allSessions = [];
          sessionResults.forEach((item, index) => {
            if (item.status !== "fulfilled" || !Array.isArray(item.value)) return;
            const campaign = loadedCampaigns[index];
            item.value.forEach((session) => {
              allSessions.push({
                ...session,
                campaignId: campaign.id,
                campaignTitle: campaign.title || "Kampania",
              });
            });
          });

          if (!cancelled) {
            setSessions(allSessions);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Nie udalo sie pobrac profilu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const displayName = useMemo(() => {
    if (profile?.displayName?.trim()) return profile.displayName.trim();
    if (profile?.email) return profile.email.split("@")[0];
    return "Uzytkownik";
  }, [profile]);

  const avatarLabel = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName]);

  const stats = useMemo(() => {
    const campaignTotal = campaigns.length;
    const mgCampaigns = campaigns.filter((campaign) => Boolean(campaign?.owner)).length;
    const sessionTotal = sessions.length;
    const friendsCount = (socialOverview?.friends || []).length;
    const generatedTotal = recentGenerations.length;
    const npcCount = recentGenerations.filter((entry) => String(entry?.id || "") === "npc").length;
    const spentHours = Math.round(sessions.reduce((sum, session) => sum + toSessionHours(session), 0));

    return {
      campaignTotal,
      mgCampaigns,
      sessionTotal,
      friendsCount,
      generatedTotal,
      npcCount,
      spentHours,
    };
  }, [campaigns, recentGenerations, sessions, socialOverview]);

  const favoriteTools = useMemo(() => {
    const counts = new Map();
    recentGenerations.forEach((entry) => {
      const key = String(entry?.id || "").toLowerCase();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const ranked = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([key, count]) => ({
        key,
        count,
        name: TOOL_META[key]?.name || `Generator ${key.toUpperCase()}`,
        desc: TOOL_META[key]?.desc || "Najczesciej uzywane narzedzie",
      }));

    if (ranked.length > 0) return ranked;

    return [
      { key: "npc", count: 0, name: "Generator NPC", desc: "Wygeneruj postac niezalezna" },
      { key: "dungeon", count: 0, name: "Generator podziemi", desc: "Projektuj kolejne wyprawy" },
      { key: "loot", count: 0, name: "Generator lupu", desc: "Buduj nagrody i skarby" },
      { key: "dice", count: 0, name: "Kostkarka", desc: "Rzucaj koscmi online" },
    ];
  }, [recentGenerations]);

  const recentActivity = useMemo(() => {
    const generationEvents = recentGenerations.slice(0, 8).map((entry) => ({
      id: `gen-${entry.createdAt}-${entry.id}`,
      title: entry?.title || "Wygenerowano material",
      subtitle: TOOL_META[String(entry?.id || "").toLowerCase()]?.name || "Generator",
      at: entry?.createdAt,
    }));

    const sessionEvents = sessions
      .map((session) => ({
        id: `ses-${session.id}`,
        title: session?.status === "finished" ? `Zakonczono sesje "${session.title || "Sesja"}"` : `Zaktualizowano sesje "${session.title || "Sesja"}"`,
        subtitle: session?.campaignTitle || "Kampania",
        at: session?.updatedAt || session?.finishedAt || session?.startedAt || session?.createdAt,
      }))
      .slice(0, 8);

    return [...generationEvents, ...sessionEvents]
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
  }, [recentGenerations, sessions]);

  const recentCampaigns = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 3)
      .map((campaign, index) => ({
        id: campaign.id,
        title: campaign.title,
        role: campaign.owner ? "Mistrz Gry" : "Gracz",
        progress: Math.max(18, ((campaign.id || index + 3) * 19) % 96),
      }));
  }, [campaigns]);

  const achievements = useMemo(() => {
    return [
      { id: "first-session", title: "Pierwsza sesja", desc: "Przeprowadz lub rozegrac pierwsza sesje", unlocked: stats.sessionTotal >= 1 },
      { id: "world-builder", title: "Tworca swiatow", desc: "Utworz 10 wygenerowanych rzeczy", unlocked: stats.generatedTotal >= 10 },
      { id: "chronicle", title: "Kronikarz", desc: "Utworz 50 materialow", unlocked: stats.generatedTotal >= 50 },
      { id: "dice-master", title: "Mistrz kosci", desc: "Wykonaj 100 rzutow koscmi", unlocked: false },
      { id: "collector", title: "Kolekcjoner", desc: "Utworz 100 wygenerowanych rzeczy", unlocked: stats.generatedTotal >= 100 },
    ];
  }, [stats.generatedTotal, stats.sessionTotal]);

  async function handleSaveName(event) {
    event.preventDefault();
    setNameError("");
    setNameSuccess("");

    const trimmed = displayNameInput.trim();
    if (trimmed.length < 2) {
      setNameError("Nazwa uzytkownika musi miec co najmniej 2 znaki.");
      return;
    }

    setNameSaving(true);
    try {
      const updated = await updateDisplayName(token, trimmed);
      setProfile((prev) => ({ ...(prev || {}), ...updated, displayName: updated.displayName || trimmed }));
      setDisplayNameInput(updated.displayName || trimmed);
      setNameSuccess("Zapisano.");
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
    } catch (err) {
      setNameError(err?.message || "Nie udalo sie zapisac.");
    } finally {
      setNameSaving(false);
    }
  }

  function handleAvatarUploaded(url) {
    setAvatarError("");
    localStorage.setItem(getAvatarStorageKey(profile?.email), url);
    setAvatarSrc(url);
    window.dispatchEvent(new Event("ttrpg-profile-updated"));
  }

  function handleRemoveAvatar() {
    localStorage.removeItem(getAvatarStorageKey(profile?.email));
    setAvatarSrc("");
    window.dispatchEvent(new Event("ttrpg-profile-updated"));
  }

  return (
    <div className="page profileV2Page">
      <header className="profileV2Top panel">
        <div>
          <h1>Profil uzytkownika</h1>
          <p>Zarzadzaj kontem, aktywnoscia i swoimi narzedziami.</p>
        </div>

        <label className="profileV2Search">
          <input type="text" placeholder="Szukaj w aplikacji..." aria-label="Szukaj" />
          <kbd>Ctrl K</kbd>
        </label>
      </header>

      {loading && <div className="profileState">Ladowanie profilu...</div>}
      {error && <div className="profileState is-error">{error}</div>}

      {!loading && !error && (
        <div className="profileV2Layout">
          <aside className="profileV2Identity panel-soft">
            <div className="profileIdentityCover" />

            <div className="profileIdentityAvatarWrap">
              <div className="profileIdentityAvatar" aria-hidden="true">
                {avatarSrc ? <img src={avatarSrc} alt="Avatar" /> : avatarLabel}
              </div>
              <div className="profileAvatarEditBtn">edytuj</div>
            </div>

            <h2>{displayName}</h2>
            <p className="profileIdentityEmail">{profile?.email || "Brak email"}</p>
            <p className="profileIdentityBio">"Wyobraznia to poczatek tworzenia."</p>

            <div className="profileIdentityMeta">
              <div><span>Rola</span><strong>{getRoleLabel(profile)}</strong></div>
              <div><span>Data dolaczenia</span><strong>Brak danych</strong></div>
              <div><span>Handle</span><strong>{profile?.handle || "Brak"}</strong></div>
              <div><span>Ulubiony system</span><strong>{profile?.favoriteSystem || "DnD 5e"}</strong></div>
              <div><span>Strefa czasowa</span><strong>Europe/Warsaw</strong></div>
            </div>

            <form className="profileNameForm" onSubmit={handleSaveName}>
              <input
                value={displayNameInput}
                onChange={(event) => setDisplayNameInput(event.target.value)}
                maxLength={120}
                placeholder="Nazwa wyswietlana"
              />
              <div className="profileNameActions">
                <button type="submit" className="profileBtnPrimary" disabled={nameSaving}>
                  {nameSaving ? "Zapisywanie..." : "Edytuj profil"}
                </button>
                {avatarSrc && (
                  <button type="button" className="profileBtnGhost" onClick={handleRemoveAvatar}>Usun avatar</button>
                )}
              </div>
            </form>
            <ImageUpload
              label="Avatar"
              value={avatarSrc}
              onChange={handleAvatarUploaded}
              onRemove={handleRemoveAvatar}
              previewAlt="Avatar uzytkownika"
            />

            {avatarError && <div className="profileInlineMsg is-error">{avatarError}</div>}
            {nameError && <div className="profileInlineMsg is-error">{nameError}</div>}
            {nameSuccess && <div className="profileInlineMsg is-ok">{nameSuccess}</div>}
          </aside>

          <section className="profileV2Main">
            <section className="profileStats panel">
              <article>
                <span>Kampanie</span>
                <strong>{stats.campaignTotal}</strong>
                <small>Aktywne: {stats.campaignTotal}</small>
              </article>
              <article>
                <span>Sesje</span>
                <strong>{stats.sessionTotal}</strong>
                <small>Jako MG: {stats.mgCampaigns}</small>
              </article>
              <article>
                <span>Wygenerowane</span>
                <strong>{stats.generatedTotal}</strong>
                <small>NPC: {stats.npcCount}</small>
              </article>
              <article>
                <span>Znajomi</span>
                <strong>{stats.friendsCount}</strong>
                <small>Społecznosc</small>
              </article>
              <article>
                <span>Czas spedzony</span>
                <strong>{stats.spentHours} h</strong>
                <small>Prowadzenie sesji</small>
              </article>
            </section>

            <section className="profileMiddle">
              <section className="profileActivity panel">
                <header>
                  <h3>Ostatnia aktywnosc</h3>
                  <Link to="/messages">Zobacz wszystko</Link>
                </header>

                <div className="profileActivityList">
                  {recentActivity.length === 0 && <p className="profileEmpty">Brak aktywnosci do wyswietlenia.</p>}
                  {recentActivity.map((item) => (
                    <article key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.subtitle}</span>
                      </div>
                      <time>{formatRelative(item.at)}</time>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="profileSideCol">
                <section className="profileTools panel-soft">
                  <header>
                    <h3>Ulubione narzedzia</h3>
                    <Link to="/generators">Zobacz wszystkie</Link>
                  </header>
                  <div className="profileSimpleList">
                    {favoriteTools.map((tool) => (
                      <Link key={tool.key} to="/generators" className="profileSimpleItem">
                        <div>
                          <strong>{tool.name}</strong>
                          <span>{tool.desc}</span>
                        </div>
                        <em>{tool.count}</em>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="profileCampaigns panel-soft">
                  <header>
                    <h3>Ostatnio uzywane kampanie</h3>
                    <Link to="/campaigns">Zobacz wszystkie</Link>
                  </header>
                  <div className="profileSimpleList">
                    {recentCampaigns.length === 0 && <p className="profileEmpty">Brak kampanii.</p>}
                    {recentCampaigns.map((campaign) => (
                      <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="profileCampaignItem">
                        <div>
                          <strong>{campaign.title}</strong>
                          <span>{campaign.role}</span>
                        </div>
                        <div className="profileProgressWrap">
                          <div className="profileProgress"><div style={{ width: `${campaign.progress}%` }} /></div>
                          <small>{campaign.progress}%</small>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </aside>
            </section>

            <section className="profileBottom">
              <section className="profileAchievements panel">
                <header>
                  <h3>Osiagniecia</h3>
                </header>

                <div className="profileAchievementsGrid">
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
          </section>
        </div>
      )}
    </div>
  );
}
