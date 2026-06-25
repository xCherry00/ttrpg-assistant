import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyProfile, updateDisplayName, updateProfileImages } from "../api/settings";
import { listCampaigns, listCampaignSessions } from "../api/campaigns";
import { getSocialOverview } from "../api/social";
import ImageLibraryPicker from "../components/common/ImageLibraryPicker";
import { imagePlaceholder } from "../data/imageLibrary";
import { BASIC_RULES } from "../data/basicRules";
import "../styles/profile.css";

const RECENT_GENERATIONS_KEY = "ttrpg_recent_generations_v1";
const MAX_PROFILE_SESSION_HOURS = 24;

const TOOL_META = {
  npc: { name: "Generator NPC", desc: "Postacie niezależne do sesji" },
  monster: { name: "Generator potworów", desc: "Spotkania i bestie" },
  loot: { name: "Generator łupu", desc: "Nagrody i skarby" },
  tavern: { name: "Generator karczm", desc: "Miejsca spotkań" },
  faction: { name: "Generator frakcji", desc: "Organizacje i konflikty" },
  settlement: { name: "Generator osad", desc: "Miasta i regiony" },
  region: { name: "Generator regionów", desc: "Krainy i szlaki" },
  poetry: { name: "Poezja i lore", desc: "Klimat i opisy" },
  spellbook: { name: "Księga zaklęć", desc: "Magia kampanii" },
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
  close: "M6 6l12 12 M18 6L6 18",
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
    favoriteSystem: profile?.favoriteSystem || "",
    timezone: profile?.timezone || "",
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
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() <= 1971) return null;
  return d;
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
  if (diff <= 0) return 0;
  return Math.min(diff / (1000 * 60 * 60), MAX_PROFILE_SESSION_HOURS);
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
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [nameSuccess, setNameSuccess] = useState("");
  const [avatarSrc, setAvatarSrc] = useState("");
  const [bannerSrc, setBannerSrc] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [profileDraft, setProfileDraft] = useState(() => readProfileDraft());
  const [modalDraft, setModalDraft] = useState(() => readProfileDraft());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imagePicker, setImagePicker] = useState(null);
  const [imagePickerValue, setImagePickerValue] = useState("");
  const [imageSaving, setImageSaving] = useState(false);
  const [activeProfilePanel, setActiveProfilePanel] = useState("activity");

  const closeEditModal = useCallback((force = false) => {
    if (nameSaving && !force) return;
    setIsEditModalOpen(false);
    setNameError("");
    setProfileFieldErrors({});
    setAvatarError("");
  }, [nameSaving]);

  const closeImagePicker = useCallback(() => {
    if (imageSaving) return;
    setImagePicker(null);
    setImagePickerValue("");
  }, [imageSaving]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await getMyProfile(token);
        if (cancelled) return;

        const storedAvatar = localStorage.getItem(getAvatarStorageKey(me?.email)) || "";
        const storedBanner = localStorage.getItem(getBannerStorageKey(me?.email)) || "";
        let currentProfile = me;
        if ((!me?.avatarUrl && storedAvatar) || (!me?.profileBannerUrl && storedBanner)) {
          currentProfile = await updateProfileImages(token, me?.avatarUrl || storedAvatar, me?.profileBannerUrl || storedBanner);
          if (cancelled) return;
        }

        setProfile(currentProfile);
        setDisplayNameInput(me?.displayName || (me?.email ? me.email.split("@")[0] : ""));
        setAvatarSrc(currentProfile?.avatarUrl || storedAvatar);
        setBannerSrc(currentProfile?.profileBannerUrl || storedBanner);
        setProfileDraft(readProfileDraft(me?.email, currentProfile));
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
        if (!cancelled) setError(err?.message || "Nie udało się pobrać profilu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!isEditModalOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeEditModal();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeEditModal, isEditModalOpen]);

  useEffect(() => {
    if (!imagePicker) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeImagePicker();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeImagePicker, imagePicker]);

  const displayName = useMemo(() => {
    if (profile?.displayName?.trim()) return profile.displayName.trim();
    if (profile?.email) return profile.email.split("@")[0];
    return "Użytkownik";
  }, [profile]);

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
        desc: TOOL_META[key]?.desc || "Ostatnio używane narzędzie",
      }));

    return ranked.length > 0 ? ranked : [];
  }, [recentGenerations]);

  const recentActivity = useMemo(() => {
    const generationEvents = recentGenerations.slice(0, 8).map((entry) => ({
      id: `gen-${entry.createdAt}-${entry.id}`,
      title: entry?.title || "Wygenerowano materiał",
      subtitle: TOOL_META[String(entry?.id || "").toLowerCase()]?.name || "Generator",
      at: entry?.createdAt,
      icon: "generator",
    }));

    const sessionEvents = sessions.map((session) => ({
      id: `ses-${session.id}`,
      title: session?.status === "finished"
        ? `Zakończono sesję "${session.title || "Sesja"}"`
        : `Zaktualizowano sesję "${session.title || "Sesja"}"`,
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
      .map((campaign) => ({
        id: campaign.id,
        title: campaign.title || "Kampania",
        role: campaign.owner ? "Mistrz Gry" : "Gracz",
        status: campaign.status || campaign.state || "Brak statusu",
        system: campaign.system || campaign.rpgSystem || "Brak",
        updatedAt: campaign.updatedAt || campaign.lastActivityAt || campaign.createdAt,
      }));
  }, [campaigns]);

  const gmCampaigns = useMemo(() => recentCampaigns.filter((campaign) => campaign.role === "Mistrz Gry"), [recentCampaigns]);
  const playerCampaigns = useMemo(() => recentCampaigns.filter((campaign) => campaign.role !== "Mistrz Gry"), [recentCampaigns]);

  function openEditModal() {
    setNameError("");
    setProfileFieldErrors({});
    setNameSuccess("");
    setAvatarError("");
    setDisplayNameInput(displayName);
    setModalDraft(profileDraft);
    setIsEditModalOpen(true);
  }

  function openImagePicker(kind) {
    setAvatarError("");
    setNameSuccess("");
    setImagePicker(kind);
    setImagePickerValue(kind === "banner" ? bannerSrc : avatarSrc);
  }

  async function saveProfileImage() {
    if (!imagePicker) return;
    setAvatarError("");
    setNameSuccess("");
    setImageSaving(true);
    try {
      const nextAvatarSrc = imagePicker === "avatar" ? imagePickerValue : avatarSrc;
      const nextBannerSrc = imagePicker === "banner" ? imagePickerValue : bannerSrc;

      if (nextAvatarSrc) {
        localStorage.setItem(getAvatarStorageKey(profile?.email), nextAvatarSrc);
      } else {
        localStorage.removeItem(getAvatarStorageKey(profile?.email));
      }
      if (nextBannerSrc) {
        localStorage.setItem(getBannerStorageKey(profile?.email), nextBannerSrc);
      } else {
        localStorage.removeItem(getBannerStorageKey(profile?.email));
      }

      const updated = await updateProfileImages(token, nextAvatarSrc, nextBannerSrc);
      setProfile((prev) => ({ ...(prev || {}), ...updated }));
      setAvatarSrc(nextAvatarSrc);
      setBannerSrc(nextBannerSrc);
      setNameSuccess(imagePicker === "banner" ? "Zapisano baner profilu." : "Zapisano avatar profilu.");
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
      setImagePicker(null);
      setImagePickerValue("");
    } catch (err) {
      setAvatarError(err?.message || "Nie udało się zapisać obrazu profilu.");
    } finally {
      setImageSaving(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setNameError("");
    setProfileFieldErrors({});
    setNameSuccess("");
    setAvatarError("");

    const trimmed = displayNameInput.trim();
    const trimmedBio = (modalDraft.bio || "").trim();
    const nextErrors = {};
    if (!trimmed) {
      nextErrors.displayName = "Nazwa publiczna nie może być pusta.";
    }
    if (trimmed.length > 120) {
      nextErrors.displayName = "Nazwa publiczna może mieć maksymalnie 120 znaków.";
    }
    if (trimmedBio.length > 300) {
      nextErrors.bio = "Opis może mieć maksymalnie 300 znaków.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setProfileFieldErrors(nextErrors);
      return;
    }

    setNameSaving(true);
    try {
      let updated = trimmed === displayName ? { displayName: trimmed } : await updateDisplayName(token, trimmed);
      const nextDraft = { ...modalDraft, bio: trimmedBio };
      writeProfileDraft(profile?.email, nextDraft);
      setProfile((prev) => ({ ...(prev || {}), ...updated, displayName: updated.displayName || trimmed, ...nextDraft }));
      setDisplayNameInput(updated.displayName || trimmed);
      setProfileDraft(nextDraft);
      setNameSuccess("Zapisano zmiany profilu.");
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
      closeEditModal(true);
    } catch (err) {
      setNameError(err?.message || "Nie udało się zapisać.");
    } finally {
      setNameSaving(false);
    }
  }

  const tabs = [
    ["activity", "Aktywność"],
    ["campaigns", "Kampanie"],
  ];

  const profileBio = profileDraft.bio?.trim() || "Ten użytkownik nie dodał jeszcze opisu.";
  const profileFavoriteSystem = safeText(profileDraft.favoriteSystem, "Brak");
  const profileTimezone = safeText(profileDraft.timezone, "Brak");
  const imagePickerTitle = imagePicker === "banner" ? "Zmień baner profilu" : "Zmień avatar profilu";
  const imagePickerType = imagePicker === "banner" ? "campaignBanners" : "avatars";
  const imagePickerPreviewAlt = imagePicker === "banner" ? "Baner profilu" : "Avatar profilu";

  return (
    <div className="page profileDesk">
      {loading && <div className="profileState profileStateLight">Ładowanie profilu...</div>}
      {error && <div className="profileState profileStateLight is-error">{error}</div>}

      {!loading && !error && (
        <div className="profileShell">
          <aside className="profileCardPanel">
            <button type="button" className="profileBanner profileBanner--forest profileBannerUpload profileImageTrigger" onClick={() => openImagePicker("banner")} aria-label="Zmień baner profilu">
              <img src={bannerSrc || imagePlaceholder("campaignBanners")} alt="Baner profilu" onError={() => setBannerSrc("")} />
              <span>Zmień baner</span>
            </button>
            <div className="profileAvatarRow">
              <button type="button" className="profileAvatarLarge profileAvatarUpload profileImageTrigger" onClick={() => openImagePicker("avatar")} aria-label="Zmień avatar profilu">
                <img src={avatarSrc || imagePlaceholder("avatars")} alt="Avatar użytkownika" onError={() => setAvatarSrc("")} />
                <i aria-hidden="true" />
                <span>Zmień avatar</span>
              </button>
            </div>

            <div className="profileCardBody">
              <h2>{displayName}</h2>
              <p className="profileHandle">{profile?.handle ? `@${profile.handle}` : profile?.email || "Brak email"}</p>
              <p className="profileQuote">{profileBio}</p>

              <div className="profileMetaList">
                <InfoRow label="Rola" value={getRoleLabel(profile)} />
                <InfoRow label="Ulubiony system" value={profileFavoriteSystem} />
                <InfoRow label="Strefa czasowa" value={profileTimezone} />
                <InfoRow label="Dołączył" value={formatDate(profile?.createdAt || profile?.joinedAt)} />
              </div>

              <div className="profileCardActions">
                <button type="button" className="profilePrimaryAction" onClick={openEditModal}>
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
              <StatCard icon="friends" label="Znajomi" value={stats.friendsCount} hint="Społeczność" />
              <StatCard icon="clock" label="Czas spędzony" value={`${stats.spentHours} h`} hint="Prowadzenie sesji" />
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
                  <h2>Ostatnia aktywność</h2>
                  <Link to="/messages">Zobacz wszystkie</Link>
                </header>
                {recentActivity.length === 0 ? (
                  <EmptyState title="Brak aktywności" text="Gdy pojawią się sesje, notatki albo generatory, zobaczysz je tutaj." />
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
                  <h2>Narzędzia</h2>
                  <Link to="/generators">Otwórz generatory</Link>
                </header>
                {favoriteTools.length === 0 ? (
                  <EmptyState title="Brak ostatnich narzędzi" text="Po użyciu generatorów pokażemy tu najczęściej wybierane moduły." />
                ) : (
                  <div className="profileToolGrid">
                    {favoriteTools.map((tool) => (
                      <Link key={tool.key} to="/generators" className="profileToolCard">
                        <span><Icon name="tools" /></span>
                        <strong>{tool.name}</strong>
                        <p>{tool.desc}</p>
                        <small>{tool.count} użyć</small>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeProfilePanel === "campaigns" && (
              <section className="profileContentPanel profileContentPanel--campaigns">
                <header className="profileSectionHeader">
                  <h2>Kampanie</h2>
                  <Link to="/campaigns">Zobacz kampanie</Link>
                </header>
                {recentCampaigns.length === 0 ? (
                  <div className="profileEmptyState">
                    <span><Icon name="campaign" /></span>
                    <strong>Brak kampanii</strong>
                    <p>Twoje kampanie pojawią się tutaj po utworzeniu albo dołączeniu.</p>
                    <Link className="profilePrimaryAction" to="/campaigns">Przejdź do kampanii</Link>
                  </div>
                ) : (
                  <div className="profileCampaignSections">
                    <section>
                      <h3>Prowadzone jako MG</h3>
                      {gmCampaigns.length === 0 ? (
                        <p className="profileSubtleText">Brak kampanii prowadzonych jako MG.</p>
                      ) : (
                        <div className="profileCampaignListV3">
                          {gmCampaigns.map((campaign) => (
                            <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
                              <span><Icon name="campaign" /></span>
                              <div>
                                <strong>{campaign.title}</strong>
                                <small>{campaign.status} · {campaign.system} · ostatnio {formatDate(campaign.updatedAt)}</small>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                    <section>
                      <h3>Jako gracz</h3>
                      {playerCampaigns.length === 0 ? (
                        <p className="profileSubtleText">Brak kampanii, w których grasz jako uczestnik.</p>
                      ) : (
                        <div className="profileCampaignListV3">
                          {playerCampaigns.map((campaign) => (
                            <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
                              <span><Icon name="campaign" /></span>
                              <div>
                                <strong>{campaign.title}</strong>
                                <small>{campaign.status} · {campaign.system} · ostatnio {formatDate(campaign.updatedAt)}</small>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </section>
            )}

          </main>
        </div>
      )}

      {isEditModalOpen && (
        <div className="profileModalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && closeEditModal()}>
          <section className="profileEditModal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <header className="profileEditModal__header">
              <div>
                <h2 id="profile-edit-title">Edytuj profil</h2>
                <p>Zmień podstawowe informacje widoczne na Twoim profilu.</p>
              </div>
              <button type="button" className="profileModalClose" onClick={() => closeEditModal()} aria-label="Zamknij modal" disabled={nameSaving}>
                <Icon name="close" />
              </button>
            </header>

            <form className="profileEditModal__body" onSubmit={handleSaveProfile}>
              <div className="profileEditModal__form">
                <section className="profileModalSection">
                  <h3>Dane publiczne</h3>
                  <div className="profileEditForm">
                    <label className={profileFieldErrors.displayName ? "is-invalid" : ""}>
                      <span>Nazwa publiczna</span>
                      <input
                        value={displayNameInput}
                        onChange={(event) => {
                          setDisplayNameInput(event.target.value);
                          setProfileFieldErrors((current) => ({ ...current, displayName: "" }));
                        }}
                        maxLength={120}
                        placeholder="Nazwa wyświetlana"
                        aria-invalid={profileFieldErrors.displayName ? "true" : "false"}
                        aria-describedby={profileFieldErrors.displayName ? "profile-display-name-error" : undefined}
                      />
                      {profileFieldErrors.displayName ? (
                        <small id="profile-display-name-error" className="profileFieldError" role="alert">
                          {profileFieldErrors.displayName}
                        </small>
                      ) : null}
                    </label>
                    <label className={profileFieldErrors.bio ? "is-invalid" : ""}>
                      <span>Opis / bio</span>
                      <textarea
                        value={modalDraft.bio}
                        onChange={(event) => {
                          setModalDraft((draft) => ({ ...draft, bio: event.target.value.slice(0, 300) }));
                          setProfileFieldErrors((current) => ({ ...current, bio: "" }));
                        }}
                        maxLength={300}
                        placeholder="Napisz kilka zdań o swoim stylu gry, postaciach albo kampaniach."
                        aria-invalid={profileFieldErrors.bio ? "true" : "false"}
                        aria-describedby={profileFieldErrors.bio ? "profile-bio-error" : undefined}
                      />
                      <small>{(modalDraft.bio || "").length}/300</small>
                      {profileFieldErrors.bio ? (
                        <small id="profile-bio-error" className="profileFieldError" role="alert">
                          {profileFieldErrors.bio}
                        </small>
                      ) : null}
                    </label>
                    <label>
                      <span>Ulubiony system</span>
                      <select
                        value={modalDraft.favoriteSystem}
                        onChange={(event) => setModalDraft((draft) => ({ ...draft, favoriteSystem: event.target.value }))}
                      >
                        <option value="">Brak</option>
                        {BASIC_RULES.map((system) => (
                          <option key={system.rulesApiCode || system.name} value={system.name}>{system.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Strefa czasowa</span>
                      <input
                        value={modalDraft.timezone}
                        onChange={(event) => setModalDraft((draft) => ({ ...draft, timezone: event.target.value }))}
                        placeholder="Europe/Warsaw"
                      />
                    </label>
                  </div>
                </section>
              </div>

              {(nameError || avatarError) && <div className="profileInlineMsg is-error">{nameError || avatarError}</div>}

              <footer className="profileEditModal__footer">
                <button type="button" className="profileSecondaryAction" onClick={() => closeEditModal()} disabled={nameSaving}>Anuluj</button>
                <button type="submit" className="profilePrimaryAction" disabled={nameSaving}>{nameSaving ? "Zapisywanie..." : "Zapisz zmiany"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {imagePicker && (
        <div className="profileModalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && closeImagePicker()}>
          <section className="profileImagePickerModal" role="dialog" aria-modal="true" aria-labelledby="profile-image-picker-title">
            <header className="profileEditModal__header">
              <div>
                <h2 id="profile-image-picker-title">{imagePickerTitle}</h2>
                <p>Wybierz gotowy obraz z biblioteki profilu.</p>
              </div>
              <button type="button" className="profileModalClose" onClick={closeImagePicker} aria-label="Zamknij modal" disabled={imageSaving}>
                <Icon name="close" />
              </button>
            </header>

            <div className="profileImagePickerModal__body">
              <ImageLibraryPicker
                type={imagePickerType}
                label={imagePicker === "banner" ? "Baner" : "Avatar"}
                helpText={imagePicker === "banner" ? "Wybierz gotowy baner profilu z biblioteki." : "Wybierz gotowy avatar z biblioteki."}
                value={imagePickerValue}
                onChange={setImagePickerValue}
                onRemove={() => setImagePickerValue("")}
                previewAlt={imagePickerPreviewAlt}
                disabled={imageSaving}
              />
              {avatarError && <div className="profileInlineMsg is-error">{avatarError}</div>}
            </div>

            <footer className="profileEditModal__footer">
              <button type="button" className="profileSecondaryAction" onClick={closeImagePicker} disabled={imageSaving}>Anuluj</button>
              <button type="button" className="profilePrimaryAction" onClick={saveProfileImage} disabled={imageSaving}>
                {imageSaving ? "Zapisywanie..." : "Zapisz obraz"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
