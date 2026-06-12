import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import ImageLibraryPicker from "../../components/common/ImageLibraryPicker";
import { imagePlaceholder, imageOrPlaceholder } from "../../data/imageLibrary";
import "../../styles/campaign-details.css";
import { useCampaignDetailWorkspace } from "./hooks/useCampaignDetailWorkspace";

const ADMIN_TABS = [
  { key: "session", label: "Sesje", icon: "calendar" },
  { key: "availability", label: "Dostępność", icon: "clock" },
  { key: "characters", label: "Postacie", icon: "shield" },
  { key: "players", label: "Gracze", icon: "users" },
  { key: "settings", label: "Ustawienia", icon: "settings" },
];

const PLAYER_TABS = ADMIN_TABS.filter((tab) => tab.key !== "settings");

const WEEK_DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
const LEGACY_WEEK_DAYS = ["Dzis", "Jutro", "Pojutrze", "Czw", "Pt", "Sob", "Nd"];
const ASCII_WEEK_DAYS = ["Pn", "Wt", "Sr", "Cz", "Pt", "Sb", "Nd"];
const WEEK_NOTE_PREFIX = "AVAILABILITY_WEEK_V1:";
const EMPTY_WEEK = Object.fromEntries(WEEK_DAYS.map((day) => [day, "none"]));

function formatDate(value, fallback = "Brak terminu") {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}
function formatWeekRange(value, fallback = "Brak terminu") {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return fallback;
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const start = sameMonth
    ? monday.toLocaleDateString("pl-PL", { day: "numeric" })
    : monday.toLocaleDateString("pl-PL", { day: "numeric", month: "2-digit" });
  const end = sunday.toLocaleDateString("pl-PL", { day: "numeric", month: "2-digit" });
  return `${start}-${end}`;
}
function formatTime(value, fallback = "--:--") {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function toTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function systemLabel(code) {
  const normalized = String(code || "").toLowerCase();
  if (normalized === "dnd5e") return "D&D 5E";
  if (normalized === "coc7e") return "Call of Cthulhu 7E";
  return code || "System RPG";
}

function statusLabel(status) {
  const normalized = String(status || "active").toLowerCase();
  if (["active", "aktywny", "aktywna"].includes(normalized)) return "Aktywna";
  if (normalized === "archived") return "Archiwalna";
  if (normalized === "finished") return "Zakończona";
  return status || "Aktywna";
}

function memberName(member) {
  return member?.displayName || member?.username || member?.name || "Gracz";
}

function memberInitial(member) {
  return memberName(member).slice(0, 1).toUpperCase();
}

function memberAvatar(member) {
  return member?.avatarUrl || member?.profileAvatarUrl || "";
}

function memberId(member) {
  return Number(member?.id ?? member?.userId ?? 0) || null;
}

function isGameMasterMember(member) {
  const role = String(member?.role || member?.campaignRole || member?.memberRole || "").trim().toUpperCase();
  return Boolean(
    member?.owner
    || member?.mg
    || member?.gm
    || member?.admin
    || member?.isOwner
    || member?.isGameMaster
    || role === "GM"
    || role === "MG"
    || role === "OWNER"
    || role === "ADMIN"
    || role === "GAME_MASTER"
  );
}
function playerMembersOnly(members) {
  return (members || []).filter((member) => !isGameMasterMember(member));
}

function MemberAvatar({ member, className = "cdMemberAvatar" }) {
  const avatar = memberAvatar(member);
  const name = memberName(member);
  return (
    <span className={`${className}${avatar ? " has-image" : ""}`}>
      {avatar ? <img src={avatar} alt={`Avatar ${name}`} /> : memberInitial(member)}
    </span>
  );
}

function CharacterPortrait({ character }) {
  const portrait = character?.portraitUrl || "";
  const name = character?.characterName || "Postac";
  return (
    <div className={`cdCharacterPortrait${portrait ? " has-image" : ""}`}>
      {portrait ? <img src={portrait} alt={`Portret postaci ${name}`} /> : name.slice(0, 1)}
    </div>
  );
}

function pickUpcomingSession(sessions) {
  const planned = (sessions || [])
    .filter((session) => session.status === "PLANNED")
    .slice()
    .sort((a, b) => toTime(a.scheduledFor) - toTime(b.scheduledFor));
  return planned[0] || (sessions || []).find((session) => session.status === "IN_PROGRESS") || null;
}

function normalizeSessionStatus(status) {
  return String(status || "").toUpperCase();
}

function pickActiveSession(sessions) {
  return (sessions || []).find((session) => normalizeSessionStatus(session.status) === "IN_PROGRESS") || null;
}

function normalizeAvailabilityStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "AVAILABLE" || value === "YES") return "available";
  if (value === "MAYBE") return "maybe";
  if (value === "UNAVAILABLE" || value === "NO") return "unavailable";
  return "none";
}

function parseWeekNote(note, fallbackStatus = "none") {
  const raw = String(note || "");
  if (!raw.startsWith(WEEK_NOTE_PREFIX)) {
    return { ...EMPTY_WEEK, Pn: normalizeAvailabilityStatus(fallbackStatus) };
  }

  try {
    const parsed = JSON.parse(raw.slice(WEEK_NOTE_PREFIX.length));
    const normalized = { ...EMPTY_WEEK };
    WEEK_DAYS.forEach((day, index) => {
      normalized[day] = normalizeAvailabilityStatus(parsed?.[day] || parsed?.[ASCII_WEEK_DAYS[index]] || parsed?.[LEGACY_WEEK_DAYS[index]]);
    });
    return normalized;
  } catch {
    return { ...EMPTY_WEEK };
  }
}

function stringifyWeekNote(week) {
  return `${WEEK_NOTE_PREFIX}${JSON.stringify(week)}`;
}

function apiStatusFromWeek(week) {
  const values = Object.values(week || {});
  if (values.includes("available")) return "AVAILABLE";
  if (values.includes("maybe")) return "MAYBE";
  if (values.includes("unavailable")) return "UNAVAILABLE";
  return "MAYBE";
}

function sessionStatusLabel(status) {
  const normalized = normalizeSessionStatus(status);
  if (normalized === "IN_PROGRESS") return "Live";
  if (normalized === "FINISHED") return "Zakończona";
  return "Zaplanowana";
}

function coverStyle(url) {
  return url ? { backgroundImage: `url(${url})` } : undefined;
}

function campaignBannerUrl(campaign) {
  return campaign?.bannerImageUrl || campaign?.coverImageUrl || imagePlaceholder("campaignBanners");
}

function campaignUpdatePayload(campaign, overrides = {}) {
  return {
    title: campaign?.title || "Kampania",
    description: campaign?.description || "",
    coverImageUrl: campaign?.coverImageUrl || null,
    bannerImageUrl: campaign?.bannerImageUrl || null,
    visibility: String(campaign?.visibility || "PRIVATE").toUpperCase(),
    playerLimit: Number(campaign?.playerLimit || campaign?.maxPlayers || 5),
    ...overrides,
  };
}

function copyText(value) {
  if (!value) return;
  void navigator.clipboard?.writeText(value);
}

function weekValueToDate(weekValue, timeValue) {
  const match = String(weekValue || "").match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const firstThursday = new Date(year, 0, 4);
  const firstThursdayDay = firstThursday.getDay() || 7;
  const monday = new Date(firstThursday);
  monday.setDate(firstThursday.getDate() - firstThursdayDay + 1 + (week - 1) * 7);
  const [hours, minutes] = String(timeValue || "18:00").split(":").map((part) => Number(part));
  monday.setHours(Number.isFinite(hours) ? hours : 18, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return monday;
}

export default function CampaignDetailPage() {
  const [activeTab, setActiveTab] = useState("session");
  const [showInviteCode, setShowInviteCode] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mediaModal, setMediaModal] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteCandidates, setInviteCandidates] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteBusyId, setInviteBusyId] = useState(null);

  const {
    campaignId,
    loading,
    error,
    notice,
    busy,
    campaign,
    campaignCharacters,
    members,
    sessions,
    availabilityAttendance,
    availabilityError,
    isOwner,
    myUserId,
    inviteCode,
    actions,
  } = useCampaignDetailWorkspace();

  const tabs = isOwner ? ADMIN_TABS : PLAYER_TABS;
  const playerLimit = Number(campaign?.maxPlayers || campaign?.playerLimit || 6);
  const playerMembers = useMemo(() => playerMembersOnly(members), [members]);
  const playerCount = members.length > 0 ? playerMembers.length : Number(campaign?.playerCount || campaign?.memberCount || 0);
  const upcomingSession = useMemo(() => pickUpcomingSession(sessions), [sessions]);
  const activeSession = useMemo(() => pickActiveSession(sessions), [sessions]);
  const memberIds = useMemo(() => new Set((members || []).map((member) => memberId(member)).filter(Boolean)), [members]);
  const availableInviteCandidates = useMemo(
    () => (inviteCandidates || []).filter((candidate) => {
      const id = memberId(candidate);
      return id && !memberIds.has(id);
    }),
    [inviteCandidates, memberIds],
  );

  useEffect(() => {
    if (!isOwner && activeTab === "settings") {
      setActiveTab("session");
    }
  }, [activeTab, isOwner]);

  useEffect(() => {
    if (!inviteModalOpen || !isOwner) return undefined;
    let active = true;
    setInviteLoading(true);
    setInviteError("");
    actions.loadFriendCandidates()
      .then((candidates) => {
        if (active) setInviteCandidates(Array.isArray(candidates) ? candidates : []);
      })
      .catch((err) => {
        if (active) {
          setInviteCandidates([]);
          setInviteError(err?.message || "Nie udało się pobrać listy znajomych.");
        }
      })
      .finally(() => {
        if (active) setInviteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [actions, inviteModalOpen, isOwner]);

  async function inviteCandidate(candidate) {
    const id = memberId(candidate);
    if (!id) return;
    setInviteBusyId(id);
    setInviteError("");
    try {
      await actions.handleInviteFriend(id);
      setInviteModalOpen(false);
      setInviteCandidates([]);
    } catch (err) {
      setInviteError(err?.message || "Nie udało się zaprosić gracza.");
    } finally {
      setInviteBusyId(null);
    }
  }

  return (
    <div className={`page campaignDetailsAdminPage${isOwner ? " campaignDetailsAdminPage--owner" : " campaignDetailsAdminPage--player"}`}>
      {loading && <div className="cdAdminState">Ładowanie centrum kampanii...</div>}
      {error && <div className="cdAdminError">{error}</div>}
      {notice && <div className="cdAdminNotice">{notice}</div>}

      {!loading && campaign && (
        <>
          <CampaignAdminHeader
            campaign={campaign}
            campaignId={campaignId}
            activeSession={activeSession}
            upcomingSession={upcomingSession}
            inviteCode={inviteCode}
            playerCount={playerCount}
            playerLimit={playerLimit}
            isOwner={isOwner}
            onCopyInvite={() => copyText(inviteCode)}
            onInvitePlayer={() => setInviteModalOpen(true)}
            onEditCampaign={() => setEditModalOpen(true)}
            onEditIcon={() => setMediaModal("icon")}
            onEditBanner={() => setMediaModal("banner")}
          />

          <nav className="cdAdminTabs" role="tablist" aria-label="Panel zarządzania kampanią">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`cdAdminTab${activeTab === tab.key ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <CampaignAdminIcon name={tab.icon} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className={isOwner ? "cdAdminTabContent" : "campaignPlayerTabContent"}>
          {activeTab === "session" && (
            <SessionsWorkspace
              campaignId={campaignId}
              campaign={campaign}
              sessions={sessions}
              upcomingSession={upcomingSession}
              isOwner={isOwner}
              busy={busy}
              onCreate={actions.handleCreateSession}
              onStart={actions.handleStartSession}
            />
          )}

          {activeTab === "availability" && (
            <AvailabilityWorkspace
              sessions={sessions}
              attendance={availabilityAttendance}
              attendanceError={availabilityError}
              isOwner={isOwner}
              busy={busy}
              onSave={actions.handleUpdateAvailability}
            />
          )}

          {activeTab === "characters" && (
            <CharactersWorkspace
              campaignCharacters={campaignCharacters}
              members={members}
              myUserId={myUserId}
            />
          )}

          {activeTab === "players" && (
            <PlayersWorkspace
              members={members}
              campaignCharacters={campaignCharacters}
              playerCount={playerCount}
              playerLimit={playerLimit}
              inviteCode={inviteCode}
              showInviteCode={showInviteCode}
              setShowInviteCode={setShowInviteCode}
              isOwner={isOwner}
            />
          )}

          {activeTab === "settings" && isOwner && (
            <SettingsWorkspace
              campaign={campaign}
              busy={busy}
              onUpdate={actions.handleUpdateCampaign}
              onLeave={actions.handleLeaveCampaign}
              onDelete={actions.handleDeleteCampaign}
            />
          )}
          </div>

          {editModalOpen && isOwner && (
            <CampaignEditModal
              campaign={campaign}
              busy={busy}
              onClose={() => setEditModalOpen(false)}
              onSave={async (payload) => {
                await actions.handleUpdateCampaign(payload);
                setEditModalOpen(false);
              }}
            />
          )}

          {mediaModal && isOwner && (
            <CampaignMediaModal
              campaign={campaign}
              mode={mediaModal}
              busy={busy}
              onClose={() => setMediaModal(null)}
              onSave={async (url) => {
                const field = mediaModal === "banner" ? "bannerImageUrl" : "coverImageUrl";
                await actions.handleUpdateCampaign(campaignUpdatePayload(campaign, { [field]: url || null }));
                setMediaModal(null);
              }}
            />
          )}

          {inviteModalOpen && isOwner && (
            <CampaignInviteModal
              candidates={availableInviteCandidates}
              loading={inviteLoading}
              error={inviteError}
              busyId={inviteBusyId}
              onClose={() => setInviteModalOpen(false)}
              onInvite={inviteCandidate}
            />
          )}
        </>
      )}

      {!loading && !campaign && !error && <div className="cdAdminState">Nie znaleziono kampanii.</div>}
    </div>
  );
}

function CampaignAdminHeader({ campaign, campaignId, activeSession, upcomingSession, inviteCode, playerCount, playerLimit, isOwner, onCopyInvite, onInvitePlayer, onEditCampaign, onEditIcon, onEditBanner }) {
  const liveTarget = activeSession || (isOwner ? upcomingSession : null);
  const liveHref = liveTarget?.id ? `/campaigns/${campaignId}/sessions/${liveTarget.id}/live` : null;

  return (
    <header className="cdAdminHero">
      <div className={`cdAdminHero__main${campaignBannerUrl(campaign) ? " has-banner" : ""}`} style={coverStyle(campaignBannerUrl(campaign))}>
        {isOwner ? (
          <button type="button" className="cdAdminCover cdAdminCoverButton" style={coverStyle(imageOrPlaceholder(campaign.coverImageUrl, "campaignIcons"))} onClick={onEditIcon} aria-label="Zmien ikone kampanii" />
        ) : (
          <div className="cdAdminCover" style={coverStyle(imageOrPlaceholder(campaign.coverImageUrl, "campaignIcons"))} aria-hidden="true" />
        )}
        <div className="cdAdminHero__copy">
          <div className="cdAdminTitleRow">
            <h1>{campaign.title || "Kampania"}</h1>
          </div>
          <div className="cdAdminMetaLine">
            <span className="cdAdminBadge">{systemLabel(campaign.systemCode)}</span>
            <span className="cdAdminStatus"><i />{statusLabel(campaign.status)}</span>
            <span><CampaignAdminIcon name="users" />{playerCount} / {playerLimit} graczy</span>
            <span className="cdAdminInviteMini">Kod: {inviteCode || "Brak"} <button type="button" onClick={onCopyInvite} aria-label="Kopiuj kod"><CampaignAdminIcon name="copy" /></button></span>
          </div>
          <p>{campaign.description || "Dodaj opis kampanii, aby gracze od razu wiedzieli, jaki klimat i cel ma przygoda."}</p>
        </div>

        <div className="cdAdminHeroActions">
          {isOwner ? <button type="button" className="cdAdminSecondaryBtn" onClick={onInvitePlayer}><CampaignAdminIcon name="user-plus" />Zaproś gracza</button> : null}
          {liveHref ? (
            <Link className={activeSession ? "cdAdminLiveBtn is-active" : "cdAdminLiveBtn"} to={liveHref}>
              <CampaignAdminIcon name="broadcast" />
              {activeSession ? "Aktywna sesja" : "Live session"}
            </Link>
          ) : (
            <button type="button" className="cdAdminLiveBtn" disabled>
              <CampaignAdminIcon name="broadcast" />
              Live session
            </button>
          )}
          {isOwner ? <button type="button" className="cdAdminPrimaryBtn" onClick={onEditCampaign}><CampaignAdminIcon name="edit" />Edytuj kampanię</button> : null}
          {isOwner ? <button type="button" className="cdAdminBannerButton cdAdminBannerButton--inline" onClick={onEditBanner}><CampaignAdminIcon name="image" />Zmien baner</button> : null}
        </div>
        {isOwner ? (
          <button type="button" className="cdAdminBannerButton" onClick={onEditBanner}>
            <CampaignAdminIcon name="image" /> Zmien baner
          </button>
        ) : null}
      </div>
    </header>
  );
}

function CampaignMediaModal({ campaign, mode, busy, onClose, onSave }) {
  const isBanner = mode === "banner";
  const [value, setValue] = useState(isBanner ? campaign.bannerImageUrl || "" : campaign.coverImageUrl || "");
  const type = isBanner ? "campaignBanners" : "campaignIcons";
  const title = isBanner ? "Zmien baner kampanii" : "Zmien ikone kampanii";
  const preview = isBanner ? value || campaign.coverImageUrl || imagePlaceholder("campaignBanners") : imageOrPlaceholder(value, "campaignIcons");

  async function submit(event) {
    event.preventDefault();
    await onSave?.(value);
  }

  return createPortal(
    <div className="cdEditOverlay cdMediaOverlay" role="presentation" onMouseDown={onClose}>
      <section className="cdEditModal cdMediaModal" role="dialog" aria-modal="true" aria-labelledby="cdMediaTitle" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="cdEditClose" aria-label="Zamknij okno wyboru grafiki" disabled={busy} onClick={onClose}>
          <CampaignAdminIcon name="x" />
        </button>
        <h2 id="cdMediaTitle">{title}</h2>
        <form className="cdEditForm" onSubmit={submit}>
          <div className={isBanner ? "cdEditBannerPreview" : "cdEditCoverPreview"} style={coverStyle(preview)} aria-label="Podglad wybranej grafiki" />
          <ImageLibraryPicker
            type={type}
            label={isBanner ? "Baner kampanii" : "Ikona kampanii"}
            value={value}
            onChange={setValue}
            onRemove={() => setValue("")}
            previewAlt={isBanner ? "Baner kampanii" : "Ikona kampanii"}
            helpText={isBanner ? "Wybierz gotowy baner z biblioteki." : "Wybierz gotowa ikone kampanii z biblioteki."}
            disabled={busy}
          />
          <div className="cdEditActions">
            <button type="button" className="cdAdminSecondaryBtn" disabled={busy} onClick={onClose}>Anuluj</button>
            <button type="submit" className="cdAdminPrimaryBtn" disabled={busy}>Zapisz grafike</button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function CampaignInviteModal({ candidates, loading, error, busyId, onClose, onInvite }) {
  return (
    <div className="cdEditOverlay cdInviteOverlay" role="presentation" onMouseDown={onClose}>
      <section className="cdEditModal cdInviteModal" role="dialog" aria-modal="true" aria-labelledby="cdInviteTitle" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="cdEditClose" aria-label="Zamknij okno zaproszenia" onClick={onClose}>
          <CampaignAdminIcon name="x" />
        </button>
        <h2 id="cdInviteTitle">Zaproś gracza</h2>
        <div className="cdInviteModalBody">
          <p className="cdAdminLead">Wybierz znajomego, który nie bierze jeszcze udziału w tej kampanii.</p>

          {error ? <div className="cdAdminError cdInviteError">{error}</div> : null}
          {loading ? <div className="cdAdminState cdInviteState">Ładowanie znajomych...</div> : null}

          {!loading && !error && candidates.length === 0 ? (
            <EmptyState icon="users" title="Brak znajomych do zaproszenia" text="Wszyscy dostępni znajomi są już w tej kampanii albo lista znajomych jest pusta." />
          ) : null}

          {!loading && candidates.length > 0 ? (
            <div className="cdInviteCandidateList" role="list">
              {candidates.map((candidate) => {
                const id = memberId(candidate);
                const name = memberName(candidate);
                const busy = busyId === id;
                return (
                  <div className="cdInviteCandidate" role="listitem" key={id || name}>
                    <MemberAvatar member={candidate} />
                    <div>
                      <strong>{name}</strong>
                      <span>@{candidate.username || candidate.handle || "gracz"}</span>
                    </div>
                    <button type="button" className="cdAdminPrimaryBtn" disabled={!id || busyId !== null} onClick={() => onInvite?.(candidate)}>
                      {busy ? "Zapraszanie..." : "Zaproś"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function CampaignEditModal({ campaign, busy, onClose, onSave }) {
  const [form, setForm] = useState({
    title: campaign.title || "",
    description: campaign.description || "",
    coverImageUrl: campaign.coverImageUrl || "",
    bannerImageUrl: campaign.bannerImageUrl || "",
    visibility: String(campaign.visibility || "PRIVATE").toUpperCase(),
    playerLimit: campaign.playerLimit || 5,
  });
  const descriptionLength = form.description.length;

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    await onSave?.({
      title: form.title.trim(),
      description: form.description.trim(),
      coverImageUrl: form.coverImageUrl || null,
      bannerImageUrl: form.bannerImageUrl || null,
      visibility: form.visibility,
      playerLimit: Number(form.playerLimit) || null,
    });
  }

  return (
    <div className="cdEditOverlay" role="presentation" onMouseDown={onClose}>
      <section className="cdEditModal" role="dialog" aria-modal="true" aria-labelledby="cdEditTitle" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="cdEditClose" aria-label="Zamknij okno edycji" onClick={onClose}>
          <CampaignAdminIcon name="x" />
        </button>
        <h2 id="cdEditTitle">Edytuj kampanię</h2>

        <form className="cdEditForm" onSubmit={submit}>
          <div className="cdEditMedia">
            <div>
              <h3>1. Grafika kampanii</h3>
              <p>Dodaj grafikę, która najlepiej oddaje klimat Twojej kampanii.</p>
            </div>
            <div className="cdEditImageGrid">
              <div className="cdEditCoverPreview" style={coverStyle(imageOrPlaceholder(form.coverImageUrl, "campaignIcons"))} aria-label="Podgląd okładki kampanii" />
              <ImageLibraryPicker
                type="campaignIcons"
                label="Ikona kampanii"
                value={form.coverImageUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, coverImageUrl: url }))}
                onRemove={() => setForm((prev) => ({ ...prev, coverImageUrl: "" }))}
                previewAlt="Ikona kampanii"
                helpText="Wybierz gotowa ikone kampanii z biblioteki."
                disabled={busy}
              />
            </div>
          </div>

          <div className="cdEditBanner">
            <div>
              <h3>2. Baner kampanii</h3>
              <p>Szeroki obraz używany jako tło headera, sesji i kart kampanii.</p>
            </div>
            <div className="cdEditBannerPreview" style={coverStyle(form.bannerImageUrl || form.coverImageUrl || imagePlaceholder("campaignBanners"))} aria-label="Podgląd banera kampanii" />
            <ImageLibraryPicker
              type="campaignBanners"
              label="Baner kampanii"
              value={form.bannerImageUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, bannerImageUrl: url }))}
              onRemove={() => setForm((prev) => ({ ...prev, bannerImageUrl: "" }))}
              previewAlt="Baner kampanii"
              helpText="Wybierz gotowy baner kampanii z biblioteki."
              disabled={busy}
            />
          </div>

          <div className="cdEditTextFields">
            <label>
              <span>3. Nazwa kampanii</span>
              <small>Nazwa widoczna dla graczy.</small>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                maxLength={200}
                required
              />
            </label>

            <label>
              <span>4. Opis kampanii</span>
              <small>Krótki opis fabuły, świata i klimatu kampanii.</small>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value.slice(0, 500) }))}
                rows={5}
                maxLength={500}
              />
              <em>{descriptionLength} / 500 znaków</em>
            </label>
          </div>

          <fieldset className="cdEditVisibility">
            <legend>5. Widoczność kampanii</legend>
            <p>Określ, kto może zobaczyć i dołączyć do Twojej kampanii.</p>
            <div className="cdEditVisibilityGrid">
              {[
                { value: "PRIVATE", title: "Prywatna", text: "Tylko zaproszeni gracze mogą zobaczyć i dołączyć do kampanii.", icon: "lock" },
                { value: "PUBLIC", title: "Publiczna", text: "Kampania widoczna dla wszystkich. Każdy może poprosić o dołączenie.", icon: "globe" },
              ].map((option) => (
                <label key={option.value} className={`cdEditVisibilityCard${form.visibility === option.value ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={form.visibility === option.value}
                    onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
                  />
                  <span><CampaignAdminIcon name={option.icon} /></span>
                  <strong>{option.title}</strong>
                  <small>{option.text}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="cdEditExtra">
            <div>
              <h3>6. Dodatkowe ustawienia</h3>
              <p>Ustawienia pomocnicze dla Twojej kampanii.</p>
            </div>
            <label>
              <span>Maks. liczba graczy</span>
              <small>Opcjonalnie, od 1 do 20.</small>
              <input
                type="number"
                min="1"
                max="20"
                value={form.playerLimit}
                onChange={(event) => setForm((prev) => ({ ...prev, playerLimit: event.target.value }))}
              />
            </label>
          </div>

          <div className="cdEditActions">
            <button type="button" className="cdAdminSecondaryBtn" onClick={onClose} disabled={busy}>Anuluj</button>
            <button type="submit" className="cdAdminPrimaryBtn" disabled={busy}>
              <CampaignAdminIcon name="save" />
              {busy ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SessionsWorkspace({ campaign, campaignId, sessions, upcomingSession, isOwner, busy, onCreate, onStart }) {
  const [sessionFilter, setSessionFilter] = useState("all");
  const filteredSessions = sessions.filter((session) => {
    if (sessionFilter === "planned") return session.status !== "FINISHED";
    if (sessionFilter === "finished") return session.status === "FINISHED";
    return true;
  });

  function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const week = String(formData.get("week") || "");
    const time = String(formData.get("time") || "");
    const durationHours = Number(formData.get("duration"));
    if (!title) return;
    const scheduledDate = weekValueToDate(week, time);
    const scheduledFor = scheduledDate ? scheduledDate.toISOString() : null;
    onCreate?.({ title, description, scheduledFor, durationHours: Number.isFinite(durationHours) ? durationHours : undefined });
    event.currentTarget.reset();
  }

  return (
    <section className="cdAdminWorkspace cdAdminSessionGrid">
      <article className="cdAdminCard cdSessionNext">
        <h2>Najbliższa sesja</h2>
        {!upcomingSession ? (
          <div className="cdSessionNext__body cdSessionNext__body--empty">
            <div className="cdSessionArt" style={coverStyle(imagePlaceholder("campaignBanners"))} aria-hidden="true" />
            <div className="cdSessionInfo">
              <div className="cdAdminRowBetween">
                <h3>Nie masz jeszcze zaplanowanej sesji</h3>
                <span className="cdAdminSoftBadge">Brak terminu</span>
              </div>
              <p>{isOwner ? "Przydałoby się to zmienić: zaplanuj kolejne spotkanie, a tutaj pojawi się najbliższa sesja drużyny." : "MG nie zaplanował jeszcze kolejnej sesji. Gdy pojawi się termin, ten panel pokaże szczegóły spotkania."}</p>
              <div className="cdSessionFacts">
                <span><CampaignAdminIcon name="calendar" />Oczekuje na termin</span>
                <span><CampaignAdminIcon name="clock" />Brak godziny</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="cdSessionNext__body">
            <div className="cdSessionArt" style={coverStyle(campaignBannerUrl(campaign))} />
            <div className="cdSessionInfo">
              <div className="cdAdminRowBetween">
                <h3>{upcomingSession.title}</h3>
                <span className="cdAdminSoftBadge">{sessionStatusLabel(upcomingSession.status)}</span>
              </div>
              <p>{upcomingSession.description || "Gracze poznają kolejny rozdział kampanii."}</p>
              <div className="cdSessionFacts">
                <span><CampaignAdminIcon name="calendar" />{formatWeekRange(upcomingSession.scheduledFor)}</span>
                <span><CampaignAdminIcon name="clock" />{formatTime(upcomingSession.scheduledFor)}</span>
                <span>~ {upcomingSession.durationHours || 4} godz.</span>
              </div>
              {upcomingSession.status === "IN_PROGRESS" ? (
                <Link className="cdAdminPrimaryBtn" to={`/campaigns/${campaignId}/sessions/${upcomingSession.id}/live`}>Otwórz sesję</Link>
              ) : isOwner ? (
                <button type="button" className="cdAdminPrimaryBtn" disabled={busy} onClick={() => onStart?.(upcomingSession.id)}>Otwórz sesję</button>
              ) : null}
            </div>
          </div>
        )}
      </article>

      {isOwner ? <article className="cdAdminCard">
        <h2>Zaplanuj nową sesję</h2>
        <form className="cdAdminForm" onSubmit={submit}>
          <label><span>Tytuł sesji</span><input name="title" placeholder="Np. Spotkanie z Radą" required /></label>
          <label><span>Opis (opcjonalnie)</span><textarea name="description" rows={4} placeholder="Krótki opis tego, co wydarzy się podczas sesji..." /></label>
          <div className="cdAdminTwoCols">
            <label><span>Tydzień</span><input name="week" type="week" /></label>
            <label><span>Godzina rozpoczęcia</span><input name="time" type="time" /></label>
          </div>
          <label><span>Przewidywany czas (godz.)</span><input name="duration" type="number" min="1" max="24" step="0.5" defaultValue="4" inputMode="decimal" /></label>
          <button className="cdAdminPrimaryBtn cdAdminFullBtn" type="submit" disabled={busy}><CampaignAdminIcon name="calendar" />Zaplanuj sesję</button>
        </form>
      </article> : null}

      <article className="cdAdminCard">
        <div className="cdAdminRowBetween">
          <h2>Lista sesji</h2>
        </div>
        <div className="cdAdminSegmented">
          <button type="button" className={sessionFilter === "all" ? "is-active" : ""} onClick={() => setSessionFilter("all")}>Wszystkie</button>
          <button type="button" className={sessionFilter === "planned" ? "is-active" : ""} onClick={() => setSessionFilter("planned")}>Nadchodzące</button>
          <button type="button" className={sessionFilter === "finished" ? "is-active" : ""} onClick={() => setSessionFilter("finished")}>Zakończone</button>
        </div>
        <div className="cdSessionList cdSessionList--table">
          {filteredSessions.length === 0 ? <EmptyState icon="calendar" title="Brak sesji" text="Sesje pojawią się tutaj po zaplanowaniu." /> : filteredSessions.slice(0, 5).map((session) => (
            <div className="cdSessionListItem" key={session.id}>
              <strong>{session.title}</strong>
              <span className="cdSessionWeekDate">{formatWeekRange(session.scheduledFor)} • {formatTime(session.scheduledFor)}</span>
              <span>{formatDate(session.scheduledFor)} • {formatTime(session.scheduledFor)}</span>
              <em>{sessionStatusLabel(session.status)}</em>
              <button type="button" aria-label="Więcej"><CampaignAdminIcon name="more" /></button>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function AvailabilityWorkspace({ sessions, attendance, attendanceError, isOwner, busy, onSave }) {
  const session = pickUpcomingSession(sessions);
  const responses = Array.isArray(attendance?.responses) ? attendance.responses : [];
  const myResponse = responses.find((item) => item.self);
  const [week, setWeek] = useState(() => parseWeekNote(myResponse?.note, myResponse?.status));
  useEffect(() => {
    setWeek(parseWeekNote(myResponse?.note, myResponse?.status));
  }, [myResponse?.note, myResponse?.status]);

  function setAvailabilityDay(day, status) {
    setWeek((current) => ({ ...current, [day]: status }));
  }

  function saveAvailability() {
    if (!session?.id) return;
    onSave?.(session.id, {
      status: apiStatusFromWeek(week),
      note: stringifyWeekNote(week),
    });
  }

  return (
      <section className="cdAdminWorkspace cdAdminSplit cdAdminSplit--wide cdAdminAvailabilityWorkspace">
        <article className="cdAdminCard">
          <h2>Planowanie dostępności</h2>
          <p className="cdAdminLead">Zaznacz, kiedy pasuje Ci gra w tygodniu najbliższej sesji. Odpowiedzi są zapisywane w odpowiedzi frekwencji sesji.</p>
          {!session ? (
            <EmptyState icon="clock" title="Brak sesji, dla której można zebrać dostępność" text={isOwner ? "Najpierw zaplanuj sesję, a potem udostępnij graczom link do odpowiedzi." : "Dostępność pojawi się, gdy MG zaplanuje sesję."} action={isOwner ? "Zaplanuj sesję" : null} />
          ) : (
            <>
              <div className="cdAvailabilitySession">
                <span>Nadchodząca sesja</span>
                <div className="cdAvailabilitySessionTitle"><strong>{session.title}</strong></div>
                <em>{formatWeekRange(session.scheduledFor)} • {formatTime(session.scheduledFor)}</em>
                <b>{sessionStatusLabel(session.status)}</b>
              </div>
              <div className="cdAvailabilityEditor">
                <div>
                  <strong>Twoja dostępność</strong>
                  <span>{myResponse?.updatedAt ? `Ostatnia aktualizacja: ${formatDate(myResponse.updatedAt)}` : "Nie zapisano jeszcze odpowiedzi."}</span>
                </div>
                <div className="cdAvailabilityWeekEditor" aria-label="Twoja tygodniowa dostępność">
                  {WEEK_DAYS.map((day) => (
                    <div key={day} className="cdAvailabilityDayEditor">
                      <span>{day}</span>
                      <div>
                        {[
                          ["available", "Pasuje"],
                          ["maybe", "Może"],
                          ["unavailable", "Nie pasuje"],
                          ["none", "Brak"],
                        ].map(([status, label]) => (
                          <button
                            key={status}
                            type="button"
                            className={`cdAvailabilityChoice is-${status}${week[day] === status ? " is-active" : ""}`}
                            onClick={() => setAvailabilityDay(day, status)}
                            disabled={busy}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {attendanceError ? <div className="cdAdminError">{attendanceError}</div> : null}
              <div className="cdAvailabilityLegend">
                <div className="cdAvailabilityLegendItems">
                <span><AvailabilityMark status="available" />Pasuje</span>
                <span><AvailabilityMark status="maybe" />Ograniczenie</span>
                <span><AvailabilityMark status="unavailable" />Nie pasuje</span>
                <span><AvailabilityMark status="none" />Brak odpowiedzi</span>
                </div>
                <button type="button" className="cdAdminPrimaryBtn" disabled={busy} onClick={saveAvailability}><CampaignAdminIcon name="check" />Zapisz dostępność</button>
              </div>
            </>
          )}
        </article>
      </section>
  );
}

function CharactersWorkspace({ campaignCharacters, members, myUserId }) {
  const membersById = new Map(members.map((member) => [memberId(member), member]));

  return (
    <section className="cdAdminWorkspace cdAdminStack cdAdminCharacterWorkspace">
      <article className="cdAdminCard cdCharacterOverviewCard">
        <div className="cdAdminRowBetween">
          <div>
            <h2>Postacie kampanii <span className="cdCountPill">{campaignCharacters.length}</span></h2>
            <p className="cdAdminLead">Podgląd postaci przypisanych przez graczy do tej kampanii.</p>
          </div>
        </div>
        {campaignCharacters.length === 0 ? (
          <EmptyState icon="shield" title="Brak przypisanych postaci" text="Gdy gracze przypiszą swoje postacie do kampanii, zobaczysz je tutaj." />
        ) : (
          <div className="cdCharacterOverviewTable" role="table" aria-label="Postacie przypisane do kampanii">
            <div className="cdCharacterOverviewHead" role="row">
              <span>Gracz</span>
              <span>Postać</span>
              <span>Klasa / profesja</span>
            </div>
            {campaignCharacters.map((character) => {
              const owner = membersById.get(Number(character.userId));
              const playerLabel = memberName(owner) || (Number(character.userId) === Number(myUserId) ? "Ty" : "Gracz");
              const profession = character.className || character.backgroundName || "Brak klasy/profesji";
              return (
                <div className="cdCharacterOverviewRow" role="row" key={`${character.userId}-${character.characterId}-${character.assignedAt || "assigned"}`}>
                  <div className="cdCharacterPlayerCell">
                    <MemberAvatar member={owner || { displayName: playerLabel }} className="cdCharacterPlayerAvatar" />
                    <strong>{playerLabel}</strong>
                  </div>
                  <div className="cdCharacterNameCell">
                    <CharacterPortrait character={character} />
                    <div>
                      <strong>{character.characterName || "Postać"}</strong>
                      <span>{character.raceName || "Bohater"}</span>
                    </div>
                  </div>
                  <div className="cdCharacterProfessionCell">
                    <strong>{profession}</strong>
                    <span>Poziom {character.level ?? "-"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="cdAdminFooterNote"><CampaignAdminIcon name="users" />{campaignCharacters.length} postaci przypisanych przez graczy</p>
      </article>
    </section>
  );
}
function PlayersWorkspace({ members, campaignCharacters, playerCount, playerLimit, inviteCode, showInviteCode, setShowInviteCode, isOwner }) {
  const progress = Math.min(100, Math.round((playerCount / Math.max(playerLimit, 1)) * 100));
  const charactersByUserId = new Map((campaignCharacters || []).map((character) => [Number(character.userId), character]));
  return (
    <section className="cdAdminWorkspace cdAdminSplit cdAdminPlayersWorkspace">
      <article className="cdAdminCard">
        <div className="cdAdminRowBetween">
          <div><h2>Gracze kampanii <span className="cdCountPill">{playerCount} / {playerLimit}</span></h2><p className="cdAdminLead">{isOwner ? "Zarządzaj członkami kampanii, ich rolami i dostępem." : "Lista uczestników tej kampanii."}</p></div>
          {isOwner ? <button type="button" className="cdAdminSecondaryBtn"><CampaignAdminIcon name="user-plus" />Zarządzaj rolami</button> : null}
        </div>
        {members.length === 0 ? (
          <EmptyState icon="users" title="Brak graczy" text={isOwner ? "Zaproś pierwszego gracza, aby rozpocząć zarządzanie drużyną." : "Lista graczy jest jeszcze pusta."} />
        ) : (
          <div className="cdPlayersTable">
            <div className="cdPlayersHead"><span>Gracz</span><span>Rola</span><span>Status</span><span>Postać</span><span>Ostatnia aktywność</span></div>
            {members.map((member, index) => {
              const character = charactersByUserId.get(Number(memberId(member)));
              const presence = member.online ? "Online" : "Offline";
              const activity = member.activityLabel || (member.online ? "aktywny teraz" : "Brak danych");
              const lastSeen = member.lastActiveAt || member.lastSeenAt || member.updatedAt || member.joinedAt;
              const isGm = member.owner || member.mg || String(member.role || "").toUpperCase() === "GM";
              return (
                <div className="cdPlayerRow" key={memberId(member) || index}>
                  <div className="cdPlayerIdentity"><MemberAvatar member={member} /><strong>{memberName(member)}{member.self ? <em>Ty</em> : null}</strong><small>@{member.username || "gracz"} #{String(memberId(member) || index + 1).padStart(4, "0")}</small></div>
                  <span className={isGm ? "cdRoleBadge is-gm" : "cdRoleBadge"}>{isGm ? "MG" : "Gracz"}</span>
                  <span className={`cdOnline${member.online ? " is-online" : ""}`}><i />{presence}</span>
                  <span>{character?.characterName || character?.name || "Nie przypisano"}</span>
                  <span>{activity}{lastSeen ? ` · ${formatDate(lastSeen)}` : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </article>
      {isOwner ? <article className="cdAdminCard">
        <h2>Zaproś gracza do kampanii</h2>
        <p className="cdAdminLead">Udostępnij kod zaproszenia osobom, które chcesz dodać do kampanii. Kod jest ważny do momentu osiągnięcia limitu graczy.</p>
        <h3>Limit graczy</h3>
        <strong className="cdInviteLimit"><CampaignAdminIcon name="users" />{playerCount} / {playerLimit}</strong>
        <div className="cdProgress"><span style={{ width: `${progress}%` }} /></div>
        <h3>Kod zaproszenia</h3>
        <div className="cdInviteCodeBox"><span>{showInviteCode ? inviteCode || "Brak kodu" : "•••• ••••"}</span><button type="button" onClick={() => setShowInviteCode((prev) => !prev)}><CampaignAdminIcon name="eye" /></button></div>
        <button type="button" className="cdAdminPrimaryBtn cdAdminFullBtn" onClick={() => copyText(inviteCode)}><CampaignAdminIcon name="copy" />Kopiuj kod</button>
        <button type="button" className="cdAdminSecondaryBtn cdAdminFullBtn"><CampaignAdminIcon name="share" />Udostępnij link</button>
        <div className="cdInfoBox"><CampaignAdminIcon name="shield" />Każdy z kodem może dołączyć do kampanii. Kod działa do czasu osiągnięcia limitu graczy.</div>
      </article> : null}
    </section>
  );
}

function SettingsWorkspace({ campaign, busy, onUpdate, onLeave, onDelete }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [form, setForm] = useState({
    title: campaign.title || "",
    description: campaign.description || "",
    status: campaign.status || "active",
    visibility: String(campaign.visibility || "PRIVATE").toUpperCase(),
    playerLimit: campaign.playerLimit || 6,
  });

  useEffect(() => {
    setForm({
      title: campaign.title || "",
      description: campaign.description || "",
      status: campaign.status || "active",
      visibility: String(campaign.visibility || "PRIVATE").toUpperCase(),
      playerLimit: campaign.playerLimit || 6,
    });
  }, [campaign.title, campaign.description, campaign.status, campaign.visibility, campaign.playerLimit]);

  function reset() {
    setForm({
      title: campaign.title || "",
      description: campaign.description || "",
      status: campaign.status || "active",
      visibility: String(campaign.visibility || "PRIVATE").toUpperCase(),
      playerLimit: campaign.playerLimit || 6,
    });
  }

  function submit(event) {
    event.preventDefault();
    onUpdate?.({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      visibility: form.visibility,
      playerLimit: Number(form.playerLimit) || 6,
      coverImageUrl: campaign.coverImageUrl || null,
      bannerImageUrl: campaign.bannerImageUrl || null,
    });
  }

  const confirmConfig = {
    leave: {
      title: "Opuścić kampanię?",
      text: "Po potwierdzeniu zostaniesz usunięty z listy uczestników tej kampanii i stracisz do niej dostęp. Sama kampania oraz dane pozostałych osób zostaną bez zmian.",
      confirmLabel: "Opuść kampanię",
      onConfirm: onLeave,
    },
    archive: {
      title: "Zarchiwizowac kampanie?",
      text: "Kampania zostanie ukryta na listach aktywnych kampanii, ale zachowa swoje dane i bedzie mozna ja przywrocic przez zmiane statusu.",
      confirmLabel: "Archiwizuj kampanie",
      onConfirm: () => onUpdate?.(campaignUpdatePayload(campaign, { status: "archived" })),
    },
    delete: {
      title: "Usunąć kampanię?",
      text: "Ta decyzja trwale usuwa kampanię. Powiązane sesje, notatki, materiały i wpisy kampanii zostaną usunięte, a luźne wyniki generatorów odpięte od kampanii.",
      confirmLabel: "Usuń kampanię",
      danger: true,
      onConfirm: onDelete,
    },
  }[confirmAction];

  return (
    <>
    <section className="cdAdminWorkspace cdAdminSplit cdAdminSettingsWorkspace">
      <article className="cdAdminCard">
        <h2>Ustawienia kampanii</h2>
        <p className="cdAdminLead">Zarządzaj podstawowymi informacjami, ustawieniami widoczności i regułami kampanii.</p>
        <form className="cdAdminForm" onSubmit={submit}>
          <h3>Informacje podstawowe</h3>
          <div className="cdSettingsMediaBlock" hidden>
            <div>
              <h3>Ikona kampanii</h3>
              <p className="cdAdminLead">Obraz widoczny jako kwadratowa ikona kampanii w nagłówku i na kartach.</p>
            </div>
            <div className="cdSettingsCoverEditor">
              <div className="cdAdminCover cdSettingsCoverPreview" style={coverStyle(imageOrPlaceholder(form.coverImageUrl, "campaignIcons"))} aria-label="Podgląd ikony kampanii" />
              <ImageLibraryPicker
                type="campaignIcons"
                label="Ikona kampanii"
                value={form.coverImageUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, coverImageUrl: url }))}
                onRemove={() => setForm((prev) => ({ ...prev, coverImageUrl: "" }))}
                previewAlt="Ikona kampanii"
                helpText="Wybierz gotowa ikone kampanii z biblioteki."
                disabled={busy}
              />
            </div>
          </div>
          <label><span>Nazwa kampanii *</span><input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required /></label>
          <label><span>Opis kampanii</span><textarea rows={4} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
          <div className="cdAdminTwoCols">
            <label><span>Status kampanii</span><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}><option value="active">Aktywna</option><option value="finished">Zakończona</option><option value="archived">Archiwalna</option></select></label>
            <label><span>Widoczność kampanii</span><select value={form.visibility} onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}><option value="PRIVATE">Prywatna</option><option value="PUBLIC">Publiczna</option></select></label>
          </div>
          <div className="cdAdminTwoCols">
            <label><span>System RPG</span><select value={campaign.systemCode || "dnd5e"} disabled><option value={campaign.systemCode || "dnd5e"}>{systemLabel(campaign.systemCode)}</option></select></label>
            <label><span>Limit graczy</span><input type="number" min="1" max="20" value={form.playerLimit} onChange={(event) => setForm((prev) => ({ ...prev, playerLimit: event.target.value }))} /></label>
          </div>
          <div className="cdSettingsActions"><button type="button" className="cdAdminSecondaryBtn" onClick={reset}>Anuluj</button><button type="button" className="cdAdminSecondaryBtn" onClick={reset}>Resetuj zmiany</button><button type="submit" className="cdAdminPrimaryBtn" disabled={busy}>Zapisz zmiany</button></div>
        </form>
      </article>
      <aside className="cdAdminSideStack">
        <article className="cdAdminCard cdDangerZone">
          <h2><CampaignAdminIcon name="warning" />Strefa ryzyka</h2>
          <DangerAction title="Archiwizuj kampanie" text="Zarchiwizowane kampanie sa ukryte, ale mozna je przywrocic." action="Archiwizuj" disabled={busy} onClick={() => setConfirmAction("archive")} />
          <DangerAction title="Opuść kampanię" text="Opuść kampanię i usuń ją z listy swoich kampanii." action="Opuść" disabled={busy} onClick={() => setConfirmAction("leave")} />
          <DangerAction title="Archiwizuj kampanię" text="Zarchiwizowane kampanie są ukryte, ale można je przywrócić." action="Archiwizuj" />
          <DangerAction title="Usuń kampanię" text="Trwale usuń kampanię i wszystkie jej dane." action="Usuń" danger disabled={busy} onClick={() => setConfirmAction("delete")} />
        </article>
      </aside>
    </section>
    {confirmConfig && (
      <ConfirmActionModal
        {...confirmConfig}
        busy={busy}
        onClose={() => setConfirmAction(null)}
      />
    )}
    </>
  );
}


function DangerAction({ title, text, action, danger, disabled, onClick }) {
  if (!onClick) return null;
  return <div className="cdDangerAction"><div><strong>{title}</strong><span>{text}</span></div><button type="button" className={danger ? "is-danger" : ""} disabled={disabled} onClick={onClick}>{action}</button></div>;
}

function ConfirmActionModal({ title, text, confirmLabel, danger, busy, onClose, onConfirm }) {
  async function confirm() {
    await onConfirm?.();
    onClose?.();
  }

  return (
    <div className="cdEditOverlay cdConfirmOverlay" role="presentation" onMouseDown={onClose}>
      <section className="cdConfirmModal" role="dialog" aria-modal="true" aria-labelledby="cdConfirmTitle" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="cdEditClose" aria-label="Zamknij okno potwierdzenia" disabled={busy} onClick={onClose}>
          <CampaignAdminIcon name="x" />
        </button>
        <span className={danger ? "cdConfirmIcon is-danger" : "cdConfirmIcon"}>
          <CampaignAdminIcon name="warning" />
        </span>
        <h2 id="cdConfirmTitle">{title}</h2>
        <p>{text}</p>
        <div className="cdConfirmActions">
          <button type="button" className="cdAdminSecondaryBtn" disabled={busy} onClick={onClose}>Anuluj</button>
          <button type="button" className={danger ? "cdConfirmPrimary is-danger" : "cdConfirmPrimary"} disabled={busy} onClick={confirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

function InviteBox({ label, value }) {
  return <div className="cdInviteBox"><span>{label}</span><strong>{value}</strong><button type="button" onClick={() => copyText(value)} aria-label={`Kopiuj ${label}`}><CampaignAdminIcon name="copy" /></button></div>;
}

function EmptyState({ icon, title, text, action }) {
  return <div className="cdEmptyState"><span><CampaignAdminIcon name={icon} /></span><strong>{title}</strong><p>{text}</p>{action && <button type="button" className="cdAdminSecondaryBtn">{action}</button>}</div>;
}

function AvailabilityMark({ status }) {
  if (status === "available") return <span className="cdAvailMark is-yes"><CampaignAdminIcon name="check" /></span>;
  if (status === "maybe") return <span className="cdAvailMark is-maybe" />;
  if (status === "unavailable") return <span className="cdAvailMark is-no"><CampaignAdminIcon name="x" /></span>;
  return <span className="cdAvailMark is-empty" />;
}

function CampaignAdminIcon({ name }) {
  const paths = {
    "arrow-left": <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    book: <><path d="M4 19a3 3 0 0 1 3-3h13" /><path d="M7 16V5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 1-2-2Z" /></>,
    broadcast: <><path d="M4.9 19.1a10 10 0 0 1 0-14.2" /><path d="M7.8 16.2a6 6 0 0 1 0-8.4" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4" /><path d="M19.1 4.9a10 10 0 0 1 0 14.2" /></>,
    bulb: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12c1 1 1 2 1 4h6c0-2 0-3 1-4a7 7 0 0 0-4-12Z" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
    check: <path d="m20 6-11 11-5-5" />,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="2" y="2" width="13" height="13" rx="2" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    filter: <><path d="M22 3H2l8 9v7l4 2v-9Z" /></>,
    info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
    list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" /></>,
    image: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10.5" r="1.5" /><path d="m21 15-5-5L5 19" /></>,
    map: <><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15" /><path d="M15 6v15" /></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></>,
    more: <><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></>,
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></>,
    settings: <><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4" /><path d="m15.4 6.5-6.8 4" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    "user-plus": <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M22 11h-6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="3.5" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></>,
    warning: <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.note}
    </svg>
  );
}
