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
import {
  deleteMySessionNote,
  getMySessionNote,
  saveMySessionNote,
} from "../../api/sessionNotes";
import "../../styles/campaign-details.css";
import CampaignCharactersPanel from "./components/CampaignCharactersPanel";
import CampaignMaterialsPanel from "./components/CampaignMaterialsPanel";
import CampaignOverviewPanel from "./components/CampaignOverviewPanel";
import CampaignPlayerNotesPanel from "./components/CampaignPlayerNotesPanel";
import CampaignPlayersPanel from "./components/CampaignPlayersPanel";
import CampaignSessionsPanel from "./components/CampaignSessionsPanel";
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

  async function handleGetMySessionNote(sessionId) {
    try {
      return await getMySessionNote(token, campaignId, sessionId);
    } catch (err) {
      if (err?.status === 404) return null;
      throw err;
    }
  }

  async function handleSaveMySessionNote(sessionId, payload) {
    return saveMySessionNote(token, campaignId, sessionId, payload);
  }

  async function handleDeleteMySessionNote(sessionId) {
    return deleteMySessionNote(token, campaignId, sessionId);
  }

  const isOwner = Boolean(campaign?.owner);
  const myMember = members.find((member) => member?.self) || null;
  const myCharacter = campaignCharacters.find((character) => {
    if (!myMember) return false;
    return Number(character.userId) === Number(myMember.id);
  }) || null;
  const playerFinishedSessions = sessions
    .filter((session) => String(session.status).toUpperCase() === "FINISHED")
    .slice()
    .sort((a, b) => new Date(b.finishedAt || b.updatedAt || 0).getTime() - new Date(a.finishedAt || a.updatedAt || 0).getTime())
    .slice(0, 5);
  const inviteCode = campaign?.joinCode || campaign?.inviteCode || "";
  const showMaterialsPanel = materials.length > 0;

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
                <a href="#campaign-overview" className="campaignDetailsPrimaryBtn">Edytuj kampanie</a>
                {inviteCode ? <span className="campaignMemberBadge">Kod: {inviteCode}</span> : null}
              </div>
            ) : null}
          </section>

          {isOwner ? (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--top">
                <UpcomingSessionPanel
                  campaignId={campaignId}
                  sessions={sessions}
                  isOwner={isOwner}
                  busy={busy}
                  onStart={handleStartSession}
                  onFinish={handleFinishSession}
                />
                {inviteCode ? (
                  <section className="campaignDetailsCard panel-soft">
                    <h2 className="campaignDetailsCardTitle">Kod zaproszenia</h2>
                    <p className="campaignDetailsHelpText">Udostepnij kod graczom, aby dolaczyli do kampanii.</p>
                    <div className="campaignDetailsInfoRow">
                      <span>Kod</span>
                      <code>{inviteCode}</code>
                    </div>
                  </section>
                ) : (
                  <section className="campaignDetailsCard panel-soft">
                    <h2 className="campaignDetailsCardTitle">Kod zaproszenia</h2>
                    <div className="campaignDetailsEmpty">Brak aktywnego kodu dolaczenia.</div>
                  </section>
                )}
                <CampaignPlayersPanel members={members} title="Gracze" />
              </div>

              <div className="campaignDashboardRow">
                <CampaignSessionsPanel
                  campaignId={campaignId}
                  sessions={sessions}
                  title="Sesje kampanii"
                  isOwner={isOwner}
                  busy={busy}
                  onCreate={handleCreateSession}
                  onStart={handleStartSession}
                  onFinish={handleFinishSession}
                  onGetMySessionNote={handleGetMySessionNote}
                  onSaveMySessionNote={handleSaveMySessionNote}
                  onDeleteMySessionNote={handleDeleteMySessionNote}
                />

                <CampaignCharactersPanel
                  campaignCharacters={campaignCharacters}
                  myCharacters={myCharacters}
                  campaignSystemCode={campaign.systemCode}
                  canManage={isOwner}
                  busy={busy}
                  onAssign={handleAssignCharacter}
                  onDetach={handleDetachCharacter}
                />

                {showMaterialsPanel ? <CampaignMaterialsPanel materials={materials} materialsAvailable /> : null}
              </div>

              <div className="campaignDashboardRow campaignDashboardRow--bottom">
                <section id="campaign-overview">
                  <CampaignOverviewPanel
                    campaign={campaign}
                    isOwner={isOwner}
                    busy={busy}
                    onUpdate={handleUpdateCampaign}
                    onDelete={handleDeleteCampaign}
                  />
                </section>
                <CampaignPlayerNotesPanel
                  notes={playerNotes}
                  campaign={campaign}
                  busy={busy}
                  onCreate={handleCreatePlayerNote}
                  onUpdate={handleUpdatePlayerNote}
                  onDelete={handleDeletePlayerNote}
                />
              </div>
            </div>
          ) : (
            <div className="campaignWorkspaceGrid">
              <div className="campaignDashboardRow campaignDashboardRow--top">
                <UpcomingSessionPanel
                  campaignId={campaignId}
                  sessions={sessions}
                  isOwner={isOwner}
                  busy={busy}
                  onStart={handleStartSession}
                  onFinish={handleFinishSession}
                />
                <section className="campaignDetailsCard panel-soft">
                  <h2 className="campaignDetailsCardTitle">Moja postac</h2>
                  {myCharacter ? (
                    <>
                      <div className="campaignMaterialCard__top">
                        <strong>{myCharacter.characterName || "Postac"}</strong>
                        <span className="campaignMemberBadge">{myCharacter.systemCode || "-"}</span>
                      </div>
                      <p>
                        Rasa/klasa/tlo: {myCharacter.raceName || "-"} / {myCharacter.className || "-"} / {myCharacter.backgroundName || "-"}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="campaignDetailsEmpty">Brak przypisanej postaci do tej kampanii.</div>
                      <Link className="campaignDetailsGhostBtn" to="/characters">Przejdz do postaci</Link>
                    </>
                  )}
                </section>
                <CampaignPlayersPanel members={members} title="Uczestnicy" />
              </div>

              <div className="campaignDashboardRow">
                <CampaignSessionsPanel
                  campaignId={campaignId}
                  sessions={playerFinishedSessions}
                  title="Ostatnie zakonczone sesje"
                  isOwner={false}
                  busy={busy}
                  onCreate={handleCreateSession}
                  onStart={handleStartSession}
                  onFinish={handleFinishSession}
                  onGetMySessionNote={handleGetMySessionNote}
                  onSaveMySessionNote={handleSaveMySessionNote}
                  onDeleteMySessionNote={handleDeleteMySessionNote}
                />
                <section className="campaignDetailsCard panel-soft">
                  <h2 className="campaignDetailsCardTitle">Informacje o kampanii</h2>
                  <div className="campaignDetailsInfoRow"><span>Tytul</span><strong>{campaign.title || "-"}</strong></div>
                  <div className="campaignDetailsInfoRow"><span>System</span><strong>{campaign.systemCode || "-"}</strong></div>
                  <div className="campaignDetailsInfoRow"><span>Status</span><strong>{campaign.status || "-"}</strong></div>
                  <p className="campaignDetailsHelpText">{campaign.description || "Brak opisu kampanii."}</p>
                </section>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !campaign && !error && <div className="campaignDetailsEmpty">Nie znaleziono kampanii.</div>}
    </div>
  );
}
