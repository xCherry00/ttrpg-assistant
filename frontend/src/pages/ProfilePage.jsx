import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyProfile, updateDisplayName } from "../api/settings";
import { listCampaigns, listCampaignSessions } from "../api/campaigns";
import { getSocialOverview } from "../api/social";
import { uploadImage } from "../api/uploads";
import { BASIC_RULES } from "../data/basicRules";
import "../styles/profile.css";

const RECENT_GENERATIONS_KEY = "ttrpg_recent_generations_v1";

const TOOL_META = {
  npc: { name: "Generator NPC", desc: "Postacie niezalezne do sesji" },
  monster: { name: "Generator potworow", desc: "Spotkania i bestie" },
  loot: { name: "Generator lupu", desc: "Nagrody i skarby" },
  tavern: { name: "Generator karczm", desc: "Miejsca spotkan" },
  faction: { name: "Generator frakcji", desc: "Organizacje i konflikty" },
  settlement: { name: "Generator osad", desc: "Miasta i regiony" },
  region: { name: "Generator regionow", desc: "Krainy i szlaki" },
  poetry: { name: "Poezja i lore", desc: "Klimat i opisy" },
  spellbook: { name: "Ksiega zaklec", desc: "Magia kampanii" },
  dungeon: { name: "Generator podziemi", desc: "Wyprawy i lokacje" },
};

const ICONS = {
  campaign: "M4 6h16v12H4z M8 6V4h8v2 M8 10h8 M8 14h5",
  session: "M6 4h12v16H6z M9 8h6 M9 12h6 M9 16h3",
  generator: "M12 3v4 M12 17v4 M4.2 7.5l3.5 2 M16.3 14.5l3.5 2 M19.8 7.5l-3.5 2 M7.7 14.5l-3.5 2 M12 8l4 2.3v4.4L12 17l-4-2.3v-4.4z",
  friends: "M16 11a4 4 0 1 0-8 0 M4 20c.8-3.3 3.7-5 8-5s7.2 1.7 8 5 M18 8a3 3 0 0 1 0 6 M20 20c-.3-1.3-1-2.4-2-3.2",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v5l3 2",
  edit: "M4 20h4l10-10-4-4L4 16z M13 7l4 4",
  upload: "M12 16V4 M8 8l4-4 4 4 M5 20h14",
  trash: "M5 7h14 M10 11v6 M14 11v6 M8 7l1-3h6l1 3 M7 7l1 13h8l1-13",
  activity: "M5 12h4l2-6 4 12 2-6h2",
  tools: "M14 4l6 6-4 4-6-6z M4 14l6 6 4-4-6-6z",
  trophy: "M8 5h8v3a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 3 M16 6h3a3 3 0 0 1-3 3 M12 12v5 M9 20h6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1.2-4 4-6 8-6s6.8 2 8 6",
  calendar: "M7 4v3 M17 4v3 M5 8h14 M6 6h12v14H6z",
};

function Icon({ name }) {
  return (
    <svg className="profileIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name] || ICONS.user} />
    </svg>
  );
}

function getAvatarStorageKey(email) {
  return `ttrpg_avatar_${email || "default"}`;
}

function getBannerStorageKey(email) {
  return `ttrpg_banner_${email || "default"}`;
}

function getProfileDraftStorageKey(email) {
  return `ttrpg_profile_draft_${email || "default"}`;
}

function readProfileDraft(email, profile = {}) {
  const fallback = {
    bio: profile?.bio || "",
    favoriteSystem: profile?.favoriteSystem || BASIC_RULES[0]?.name || "D&D 5e",
    timezone: profile?.timezone || "Europe/Warsaw",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(getProfileDraftStorageKey(email));
    return { ...fallback, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return fallback;
  }
}

function writeProfileDraft(email, draft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getProfileDraftStorageKey(email), JSON.stringify(draft));
}

function getRoleLabel(profile) {
  const role = String(profile?.role || "PLAYER").toUpperCase();
  const roleLabel = role === "PLAYER" ? "Gracz" : role;
  return profile?.isMg ? `${roleLabel} + MG` : roleLabel;
}

function safeText(value, fallback = "Brak danych") {
  const text = typeof value === "string" ? value.trim() : value;
  if (text === null || text === undefined || text === "") return fallback;
  return String(text);
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

function formatDate(value, fallback = "Brak danych") {
  const d = safeDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString("pl-PL");
}

function formatRelative(value) {
  const d = safeDate(value);
  if (!d) return "niedawno";
  const diffMs = Math.max(0, Date.now() - d.getTime());
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
  return diff > 0 ? diff / (1000 * 60 * 60) : 0;
}

function StatCard({ icon, label, value, hint }) {
  return (
    <article className="profileStatCard">
      <span className="profileStatIcon"><Icon name={icon} /></span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
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
      <span><Icon name="activity" /></span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { token } = useAuth();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

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
  const [bannerSrc, setBannerSrc] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [profileDraft, setProfileDraft] = useState(() => readProfileDraft());
  const [activeProfilePanel, setActiveProfilePanel] = useState("activity");

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
        setBannerSrc(localStorage.getItem(getBannerStorageKey(me?.email)) || "");
        setProfileDraft(readProfileDraft(me?.email, me));
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

          if (!cancelled) setSessions(allSessions);
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

    return { campaignTotal, mgCampaigns, sessionTotal, friendsCount, generatedTotal, npcCount, spentHours };
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
        desc: TOOL_META[key]?.desc || "Ostatnio uzywane narzedzie",
      }));

    return ranked.length > 0 ? ranked : [];
  }, [recentGenerations]);

  const recentActivity = useMemo(() => {
    const generationEvents = recentGenerations.slice(0, 8).map((entry) => ({
      id: `gen-${entry.createdAt}-${entry.id}`,
      title: entry?.title || "Wygenerowano material",
      subtitle: TOOL_META[String(entry?.id || "").toLowerCase()]?.name || "Generator",
      at: entry?.createdAt,
      icon: "generator",
    }));

    const sessionEvents = sessions.map((session) => ({
      id: `ses-${session.id}`,
      title: session?.status === "finished"
        ? `Zakonczono sesje "${session.title || "Sesja"}"`
        : `Zaktualizowano sesje "${session.title || "Sesja"}"`,
      subtitle: session?.campaignTitle || "Kampania",
      at: session?.updatedAt || session?.finishedAt || session?.startedAt || session?.createdAt,
      icon: "session",
    }));

    return [...generationEvents, ...sessionEvents]
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
  }, [recentGenerations, sessions]);

  const recentCampaigns = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 4)
      .map((campaign) => ({
        id: campaign.id,
        title: campaign.title || "Kampania",
        role: campaign.owner ? "Mistrz Gry" : "Gracz",
        system: campaign.system || campaign.rpgSystem || "System RPG",
      }));
  }, [campaigns]);

  const achievements = useMemo(() => [
    { id: "first-session", title: "Pierwsza sesja", desc: "Przeprowadz lub rozegraj pierwsza sesje", unlocked: stats.sessionTotal >= 1 },
    { id: "world-builder", title: "Tworca swiatow", desc: "Utworz 10 wygenerowanych materialow", unlocked: stats.generatedTotal >= 10 },
    { id: "chronicle", title: "Kronikarz", desc: "Zgromadz 50 materialow do sesji", unlocked: stats.generatedTotal >= 50 },
    { id: "social-table", title: "Stol druzyny", desc: "Dodaj pierwszego znajomego", unlocked: stats.friendsCount >= 1 },
  ], [stats.friendsCount, stats.generatedTotal, stats.sessionTotal]);

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
      writeProfileDraft(profile?.email, profileDraft);
      setProfile((prev) => ({ ...(prev || {}), ...updated, displayName: updated.displayName || trimmed, ...profileDraft }));
      setDisplayNameInput(updated.displayName || trimmed);
      setNameSuccess("Zapisano zmiany profilu.");
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
    } catch (err) {
      setNameError(err?.message || "Nie udalo sie zapisac.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleProfileImageSelected(event, kind) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError("");
    try {
      const uploaded = await uploadImage(token, file);
      const url = uploaded.url || "";
      if (kind === "banner") {
        localStorage.setItem(getBannerStorageKey(profile?.email), url);
        setBannerSrc(url);
      } else {
        localStorage.setItem(getAvatarStorageKey(profile?.email), url);
        setAvatarSrc(url);
      }
      event.target.value = "";
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
    } catch (err) {
      setAvatarError(err?.message || "Nie udalo sie wgrac obrazu.");
    } finally {
      setAvatarBusy(false);
    }
  }

  const tabs = [
    ["activity", "Aktywnosc"],
    ["campaigns", "Kampanie"],
    ["achievements", "Osiagniecia"],
    ["edit", "Edycja profilu"],
  ];

  return (
    <div className="page profileDesk">
      <header className="profilePageHeader">
        <div>
          <h1>Moj profil</h1>
          <p>Zarzadzaj swoim profilem, aktywnoscia i skrotami do narzedzi.</p>
        </div>
      </header>

      {loading && <div className="profileState profileStateLight">Ladowanie profilu...</div>}
      {error && <div className="profileState profileStateLight is-error">{error}</div>}

      {!loading && !error && (
        <div className="profileShell">
          <aside className="profileCardPanel">
            <button
              type="button"
              className="profileBanner profileBanner--forest profileUploadHover profileBannerUpload"
              onClick={() => bannerInputRef.current?.click()}
              disabled={avatarBusy}
              aria-label="Zmien baner profilu"
            >
              {bannerSrc && <img src={bannerSrc} alt="Baner profilu" />}
              <span>Zmien baner</span>
            </button>
            <div className="profileAvatarRow">
              <button
                type="button"
                className="profileAvatarLarge profileUploadHover profileAvatarUpload"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarBusy}
                aria-label={`Zmien avatar ${displayName}`}
              >
                {avatarSrc ? <img src={avatarSrc} alt="Avatar uzytkownika" /> : avatarLabel}
                <i aria-hidden="true" />
                <span>Zmien avatar</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleProfileImageSelected(event, "avatar")}
                hidden
              />
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleProfileImageSelected(event, "banner")}
                hidden
              />
            </div>

            <div className="profileCardBody">
              <h2>{displayName}</h2>
              <p className="profileHandle">{profile?.handle ? `@${profile.handle}` : profile?.email || "Brak email"}</p>
              <p className="profileQuote">{profileDraft.bio ? `"${profileDraft.bio}"` : "\"Wyobraznia to poczatek tworzenia.\""}</p>

              <div className="profileMetaList">
                <InfoRow label="Rola" value={getRoleLabel(profile)} />
                <InfoRow label="Ulubiony system" value={safeText(profileDraft.favoriteSystem, "D&D 5e")} />
                <InfoRow label="Strefa czasowa" value={safeText(profileDraft.timezone, "Europe/Warsaw")} />
                <InfoRow label="Dolaczyl" value={formatDate(profile?.createdAt || profile?.joinedAt)} />
              </div>

              <div className="profileCardActions">
                <button type="button" className="profilePrimaryAction" onClick={() => setActiveProfilePanel("edit")}>
                  <Icon name="edit" /> Edytuj profil
                </button>
              </div>

              {nameError && <div className="profileInlineMsg is-error">{nameError}</div>}
              {nameSuccess && <div className="profileInlineMsg is-ok">{nameSuccess}</div>}
              {avatarError && <div className="profileInlineMsg is-error">{avatarError}</div>}
            </div>
          </aside>

          <main className="profileMainPanel">
            <section className="profileStatsGrid" aria-label="Statystyki profilu">
              <StatCard icon="campaign" label="Kampanie" value={stats.campaignTotal} hint={`Aktywne: ${stats.campaignTotal}`} />
              <StatCard icon="session" label="Sesje" value={stats.sessionTotal} hint={`Jako MG: ${stats.mgCampaigns}`} />
              <StatCard icon="generator" label="Wygenerowane" value={stats.generatedTotal} hint={`NPC: ${stats.npcCount}`} />
              <StatCard icon="friends" label="Znajomi" value={stats.friendsCount} hint="Spolecznosc" />
              <StatCard icon="clock" label="Czas spedzony" value={`${stats.spentHours} h`} hint="Prowadzenie sesji" />
            </section>

            <nav className="profileTabs" aria-label="Sekcje profilu">
              {tabs.map(([id, label]) => (
                <button key={id} type="button" className={activeProfilePanel === id ? "is-active" : ""} onClick={() => setActiveProfilePanel(id)}>
                  {label}
                </button>
              ))}
            </nav>

            {activeProfilePanel === "activity" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader">
                  <h2>Ostatnia aktywnosc</h2>
                  <Link to="/messages">Zobacz wszystkie</Link>
                </header>
                {recentActivity.length === 0 ? (
                  <EmptyState title="Brak aktywnosci" text="Gdy pojawia sie sesje, notatki albo generatory, zobaczysz je tutaj." />
                ) : (
                  <div className="profileActivityListV3">
                    {recentActivity.map((item) => (
                      <article key={item.id}>
                        <span className="profileItemIcon"><Icon name={item.icon} /></span>
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.subtitle}</small>
                        </div>
                        <time>{formatRelative(item.at)}</time>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeProfilePanel === "tools" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader">
                  <h2>Narzedzia</h2>
                  <Link to="/generators">Otworz generatory</Link>
                </header>
                {favoriteTools.length === 0 ? (
                  <EmptyState title="Brak ostatnich narzedzi" text="Po uzyciu generatorow pokazemy tu najczesciej wybierane moduly." />
                ) : (
                  <div className="profileToolGrid">
                    {favoriteTools.map((tool) => (
                      <Link key={tool.key} to="/generators" className="profileToolCard">
                        <span><Icon name="tools" /></span>
                        <strong>{tool.name}</strong>
                        <p>{tool.desc}</p>
                        <small>{tool.count} uzyc</small>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeProfilePanel === "campaigns" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader">
                  <h2>Kampanie</h2>
                  <Link to="/campaigns">Zobacz kampanie</Link>
                </header>
                {recentCampaigns.length === 0 ? (
                  <EmptyState title="Brak kampanii" text="Twoje kampanie pojawia sie tutaj po utworzeniu albo dolaczeniu." />
                ) : (
                  <div className="profileCampaignListV3">
                    {recentCampaigns.map((campaign) => (
                      <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
                        <span><Icon name="campaign" /></span>
                        <div>
                          <strong>{campaign.title}</strong>
                          <small>{campaign.role} · {campaign.system}</small>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeProfilePanel === "achievements" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader">
                  <h2>Osiagniecia</h2>
                </header>
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

            {activeProfilePanel === "edit" && (
              <section className="profileContentPanel">
                <header className="profileSectionHeader">
                  <h2>Edycja profilu</h2>
                </header>
                <form className="profileEditForm" onSubmit={handleSaveName}>
                  <label>
                    <span>Nazwa publiczna</span>
                    <input value={displayNameInput} onChange={(event) => setDisplayNameInput(event.target.value)} maxLength={120} placeholder="Nazwa wyswietlana" />
                  </label>
                  <label>
                    <span>Opis</span>
                    <textarea
                      value={profileDraft.bio}
                      onChange={(event) => setProfileDraft((draft) => ({ ...draft, bio: event.target.value }))}
                      placeholder="Napisz kilka zdan o swoim stylu gry, postaciach albo kampaniach."
                    />
                  </label>
                  <label>
                    <span>Ulubiony system</span>
                    <select
                      value={profileDraft.favoriteSystem}
                      onChange={(event) => setProfileDraft((draft) => ({ ...draft, favoriteSystem: event.target.value }))}
                    >
                      {BASIC_RULES.map((system) => (
                        <option key={system.rulesApiCode || system.name} value={system.name}>{system.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Strefa czasowa</span>
                    <input
                      value={profileDraft.timezone}
                      onChange={(event) => setProfileDraft((draft) => ({ ...draft, timezone: event.target.value }))}
                      placeholder="Europe/Warsaw"
                    />
                  </label>
                  <div className="profileFormActions">
                    <button type="submit" className="profilePrimaryAction" disabled={nameSaving}>{nameSaving ? "Zapisywanie..." : "Zapisz zmiany"}</button>
                  </div>
                </form>
              </section>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
