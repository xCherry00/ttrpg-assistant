import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { listCharacters } from "../../api/characters";
import {
  assignCharacterToCampaign,
  createCampaignPlayerNote,
  createCampaignSession,
  deleteCampaign,
  deleteCampaignPlayerNote,
  detachCharacterFromCampaign,
  finishCampaignSession,
  getCampaignById,
  getCampaignCharacters,
  getCampaignPlayerNotes,
  listCampaignMembers,
  listCampaignMaterials,
  listCampaignSessions,
  startCampaignSession,
  updateCampaign,
  updateCampaignPlayerNote,
} from "../../api/campaigns";
import "../../styles/campaign-details.css";
import CampaignCharactersPanel from "./components/CampaignCharactersPanel";
import CampaignMaterialsPanel from "./components/CampaignMaterialsPanel";
import CampaignOverviewPanel from "./components/CampaignOverviewPanel";
import CampaignPlayerNotesPanel from "./components/CampaignPlayerNotesPanel";
import CampaignPlayersPanel from "./components/CampaignPlayersPanel";
import UpcomingSessionPanel from "./components/UpcomingSessionPanel";

export default function CampaignDetailPage() {
  const { token } = useAuth();
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [campaign, setCampaign] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [myCharacters, setMyCharacters] = useState([]);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [playerNotes, setPlayerNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("session");
  const [showInviteCode, setShowInviteCode] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [campaignData, campaignCharactersData, ownCharacters, membersData, sessionsData, materialsData, playerNotesData] = await Promise.all([
        getCampaignById(token, campaignId),
        getCampaignCharacters(token, campaignId),
        listCharacters(token),
        listCampaignMembers(token, campaignId).catch(() => []),
        listCampaignSessions(token, campaignId),
        listCampaignMaterials(token, campaignId),
        getCampaignPlayerNotes(token, campaignId).catch(() => []),
      ]);
      setCampaign(campaignData);
      setCampaignCharacters(Array.isArray(campaignCharactersData) ? campaignCharactersData : []);
      setMyCharacters(Array.isArray(ownCharacters) ? ownCharacters : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setPlayerNotes(Array.isArray(playerNotesData) ? playerNotesData : []);
    } catch (err) {
      setError(err?.message || "Nie udalo sie pobrac workspace kampanii.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, token]);

  async function runAction(action) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await action();
      await loadAll();
    } catch (err) {
      setError(err?.message || "Operacja nie powiodla sie.");
    } finally {
      setBusy(false);
    }
  }

  function handleUpdateCampaign(payload) {
    return runAction(async () => {
      await updateCampaign(token, campaignId, payload);
      setNotice("Zapisano kampanie.");
    });
  }

  function handleDeleteCampaign() {
    if (!window.confirm("Usunac kampanie (soft-delete)?")) return;
    return runAction(async () => {
      await deleteCampaign(token, campaignId);
      navigate("/campaigns");
    });
  }

  function handleAssignCharacter(characterId) {
    return runAction(async () => {
      await assignCharacterToCampaign(token, campaignId, characterId);
      setNotice("Przypisano postac.");
    });
  }

  function handleDetachCharacter(characterId) {
    return runAction(async () => {
      await detachCharacterFromCampaign(token, campaignId, characterId);
      setNotice("Odpieto postac.");
    });
  }

  function handleCreateSession(payload) {
    return runAction(async () => {
      await createCampaignSession(token, campaignId, payload);
      setNotice("Utworzono sesje.");
    });
  }

  function handleStartSession(sessionId) {
    return runAction(async () => {
      await startCampaignSession(token, campaignId, sessionId);
      setNotice("Sesja rozpoczeta.");
    });
  }

  function handleFinishSession(sessionId) {
    return runAction(async () => {
      await finishCampaignSession(token, campaignId, sessionId);
      setNotice("Sesja zakonczona.");
    });
  }

  function handleCreatePlayerNote(payload) {
    return runAction(async () => {
      await createCampaignPlayerNote(token, campaignId, payload);
      setNotice("Dodano notatke.");
    });
  }

  function handleUpdatePlayerNote(noteId, payload) {
    return runAction(async () => {
      await updateCampaignPlayerNote(token, campaignId, noteId, payload);
      setNotice("Zapisano notatke.");
    });
  }

  function handleDeletePlayerNote(noteId) {
    return runAction(async () => {
      await deleteCampaignPlayerNote(token, campaignId, noteId);
      setNotice("Usunieto notatke.");
    });
  }

  const myMember = members.find((member) => member?.self) || null;
  const isOwner = Boolean(
    campaign?.owner
    || myMember?.owner
    || myMember?.mg
    || String(myMember?.role || "").toUpperCase() === "GM"
  );
  const myUserId = Number(myMember?.id ?? myMember?.userId ?? 0) || null;
  const inviteCode = campaign?.joinCode || campaign?.inviteCode || "";
  const showMaterialsPanel = materials.length > 0;
  const campaignTabs = isOwner
    ? [
      { key: "session", label: "Sesja" },
      { key: "characters", label: "Postacie" },
      { key: "players", label: "Gracze" },
      ...(showMaterialsPanel ? [{ key: "materials", label: "Materialy" }] : []),
      { key: "notes", label: "Notatki" },
      { key: "settings", label: "Ustawienia" },
    ]
    : [
      { key: "session", label: "Sesja" },
      { key: "characters", label: "Postacie" },
      { key: "players", label: "Gracze" },
      ...(showMaterialsPanel ? [{ key: "materials", label: "Materialy" }] : []),
      { key: "notes", label: "Notatki" },
    ];

  return (
    <div className="page campaignDetailsPage">
      <Link className="campaignDetailsGhostBtn" to="/campaigns">Powrot do kampanii</Link>

      {loading && <div className="campaignDetailsState">Ladowanie workspace kampanii...</div>}
      {error && <div className="campaignDetailsError">{error}</div>}
      {notice && <div className="campaignDetailsNotice">{notice}</div>}

      {!loading && campaign && (
        <>
          <section className="campaignDetailsCard panel-soft">
            <div className="campaignMaterialCard__top">
              <div>
                <h1 className="campaignDetailsCardTitle">{campaign.title || "Kampania"}</h1>
                <p className="campaignDetailsHelpText">{campaign.description || "Brak opisu kampanii."}</p>
              </div>
              <span className="campaignMemberBadge">{isOwner ? "MG Dashboard" : "Player Dashboard"}</span>
            </div>
            <div className="campaignMaterialMeta">
              <span>System: {campaign.systemCode || "-"}</span>
              <span>Status: {campaign.status || "-"}</span>
              <span>Widocznosc: {campaign.visibility || "-"}</span>
            </div>
            {campaign.coverImageUrl ? (
              <img
                src={campaign.coverImageUrl}
                alt={`Okladka kampanii ${campaign.title || ""}`}
                style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12 }}
              />
            ) : null}
            {isOwner ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="campaignDetailsPrimaryBtn" onClick={() => setActiveTab("settings")}>Edytuj kampanie</button>
              </div>
            ) : null}
          </section>

          <nav className="campaignTabs campaignPanelTabs" role="tablist" aria-label="Panel kampanii">
            {campaignTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-label={tab.label}
                className={`campaignTabBtn${activeTab === tab.key ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {isOwner && activeTab === "session" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--session">
                <UpcomingSessionPanel
                  campaignId={campaignId}
                  sessions={sessions}
                  isOwner={isOwner}
                  busy={busy}
                  onCreate={handleCreateSession}
                  onStart={handleStartSession}
                  onFinish={handleFinishSession}
                />
              </div>
            </div>
          ) : null}

          {isOwner && activeTab === "characters" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <CampaignCharactersPanel
                  campaignCharacters={campaignCharacters}
                  myCharacters={myCharacters}
                  members={members}
                  campaignSystemCode={campaign.systemCode}
                  canManage={isOwner}
                  isOwner={isOwner}
                  myUserId={myUserId}
                  busy={busy}
                  onAssign={handleAssignCharacter}
                  onDetach={handleDetachCharacter}
                />
              </div>
            </div>
          ) : null}

          {isOwner && activeTab === "players" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--session">
                <CampaignPlayersPanel members={members} title="Gracze" />
                <section className="campaignDetailsCard panel-soft">
                  <h2 className="campaignDetailsCardTitle">Zaproś gracza</h2>
                  <p className="campaignDetailsHelpText">
                    Kod zaproszenia pokazuj tylko wtedy, gdy faktycznie chcesz zaprosić nową osobę do kampanii.
                  </p>
                  <div className="campaignDetailsInfoRow">
                    <span>Limit graczy</span>
                    <strong>{members.length} / {campaign?.playerLimit || 5}</strong>
                  </div>
                  {showInviteCode && inviteCode ? (
                    <div className="campaignDetailsInfoRow">
                      <span>Kod zaproszenia</span>
                      <code>{inviteCode}</code>
                    </div>
                  ) : null}
                  {!showInviteCode ? (
                    <button type="button" className="campaignDetailsPrimaryBtn" onClick={() => setShowInviteCode(true)}>
                      Pokaż kod zaproszenia
                    </button>
                  ) : (
                    <button type="button" className="campaignDetailsGhostBtn" onClick={() => setShowInviteCode(false)}>
                      Ukryj kod zaproszenia
                    </button>
                  )}
                </section>
              </div>
            </div>
          ) : null}

          {isOwner && activeTab === "materials" && showMaterialsPanel ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <CampaignMaterialsPanel materials={materials} materialsAvailable />
              </div>
            </div>
          ) : null}

          {isOwner && activeTab === "settings" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <section id="campaign-overview">
                  <CampaignOverviewPanel
                    campaign={campaign}
                    isOwner={isOwner}
                    busy={busy}
                    onUpdate={handleUpdateCampaign}
                    onDelete={handleDeleteCampaign}
                  />
                </section>
              </div>
            </div>
          ) : null}

          {isOwner && activeTab === "notes" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <CampaignPlayerNotesPanel
                  notes={playerNotes}
                  campaign={campaign}
                  isOwner={isOwner}
                  myUserId={myUserId}
                  busy={busy}
                  onCreate={handleCreatePlayerNote}
                  onUpdate={handleUpdatePlayerNote}
                  onDelete={handleDeletePlayerNote}
                />
              </div>
            </div>
          ) : null}

          {!isOwner && activeTab === "session" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <UpcomingSessionPanel
                  campaignId={campaignId}
                  sessions={sessions}
                  isOwner={isOwner}
                  busy={busy}
                  onCreate={handleCreateSession}
                  onStart={handleStartSession}
                  onFinish={handleFinishSession}
                />
              </div>
            </div>
          ) : null}

          {!isOwner && activeTab === "characters" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <CampaignCharactersPanel
                  campaignCharacters={campaignCharacters}
                  myCharacters={myCharacters}
                  members={members}
                  campaignSystemCode={campaign.systemCode}
                  canManage={false}
                  isOwner={false}
                  myUserId={myUserId}
                  busy={busy}
                  onAssign={handleAssignCharacter}
                  onDetach={handleDetachCharacter}
                />
              </div>
            </div>
          ) : null}

          {!isOwner && activeTab === "players" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <CampaignPlayersPanel members={members} title="Gracze" />
              </div>
            </div>
          ) : null}

          {!isOwner && activeTab === "materials" && showMaterialsPanel ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <CampaignMaterialsPanel materials={materials} materialsAvailable />
              </div>
            </div>
          ) : null}

          {!isOwner && activeTab === "notes" ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--single">
                <CampaignPlayerNotesPanel
                  notes={playerNotes}
                  campaign={campaign}
                  isOwner={false}
                  myUserId={myUserId}
                  busy={busy}
                  onCreate={handleCreatePlayerNote}
                  onUpdate={handleUpdatePlayerNote}
                  onDelete={handleDeletePlayerNote}
                />
              </div>
            </div>
          ) : null}
        </>
      )}

      {!loading && !campaign && !error && <div className="campaignDetailsEmpty">Nie znaleziono kampanii.</div>}
    </div>
  );
}
