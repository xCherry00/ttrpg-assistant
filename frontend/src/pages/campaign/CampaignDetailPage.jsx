import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { listCharacters } from "../../api/characters";
import {
  assignCharacterToCampaign,
  createCampaignSession,
  deleteCampaign,
  detachCharacterFromCampaign,
  finishCampaignSession,
  getCampaignById,
  getCampaignCharacters,
  listCampaignMembers,
  listCampaignMaterials,
  listCampaignSessions,
  startCampaignSession,
  updateCampaign,
} from "../../api/campaigns";
import "../../styles/campaign-details.css";
import CampaignOverviewPanel from "./components/CampaignOverviewPanel";
import UpcomingSessionPanel from "./components/UpcomingSessionPanel";
import CampaignPlayersPanel from "./components/CampaignPlayersPanel";
import CampaignCharactersPanel from "./components/CampaignCharactersPanel";
import CampaignSessionsPanel from "./components/CampaignSessionsPanel";
import CampaignMaterialsPanel from "./components/CampaignMaterialsPanel";
import CampaignPlaceholderPanel from "./components/CampaignPlaceholderPanel";

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

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [campaignData, campaignCharactersData, ownCharacters, membersData, sessionsData, materialsData] = await Promise.all([
        getCampaignById(token, campaignId),
        getCampaignCharacters(token, campaignId),
        listCharacters(token),
        listCampaignMembers(token, campaignId).catch(() => []),
        listCampaignSessions(token, campaignId),
        listCampaignMaterials(token, campaignId),
      ]);
      setCampaign(campaignData);
      setCampaignCharacters(Array.isArray(campaignCharactersData) ? campaignCharactersData : []);
      setMyCharacters(Array.isArray(ownCharacters) ? ownCharacters : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
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

  return (
    <div className="page campaignDetailsPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">Campaign Workspace</span>
          <h1 className="pageTitle">{campaign?.title || "Kampania"}</h1>
          <p className="pageSubtitle">
            Centrum zarzadzania kampania, sesjami, postaciami, materialami oraz wejsciami do aktywnej sesji.
          </p>
        </div>
      </div>

      {loading && <div className="campaignDetailsState">Ladowanie workspace kampanii...</div>}
      {error && <div className="campaignDetailsError">{error}</div>}
      {notice && <div className="campaignDetailsNotice">{notice}</div>}

      {!loading && campaign && (
        <div className="campaignWorkspaceGrid">
          <div className="campaignDashboardRow campaignDashboardRow--top">
            <CampaignOverviewPanel
              campaign={campaign}
              isOwner={Boolean(campaign.owner)}
              busy={busy}
              onUpdate={handleUpdateCampaign}
              onDelete={handleDeleteCampaign}
            />
            <UpcomingSessionPanel campaignId={campaignId} sessions={sessions} />
            <CampaignPlayersPanel members={members} />
          </div>

          <div className="campaignDashboardRow">
            <CampaignCharactersPanel
              campaignCharacters={campaignCharacters}
              myCharacters={myCharacters}
              campaignSystemCode={campaign.systemCode}
              canManage={Boolean(campaign.owner)}
              busy={busy}
              onAssign={handleAssignCharacter}
              onDetach={handleDetachCharacter}
            />

            <CampaignSessionsPanel
              campaignId={campaignId}
              sessions={sessions}
              isOwner={Boolean(campaign.owner)}
              busy={busy}
              onCreate={handleCreateSession}
              onStart={handleStartSession}
              onFinish={handleFinishSession}
            />

            <CampaignMaterialsPanel materials={materials} materialsAvailable />
          </div>

          <div className="campaignDashboardRow campaignDashboardRow--bottom">
            <CampaignPlaceholderPanel
              title="Frekwencja / Glosowanie"
              text="Brak aktywnego glosowania. Placeholder pod przyszly attendance/voting panel."
              actionLabel="Utworz glosowanie"
            />
            <CampaignPlaceholderPanel
              title="Notatki graczy"
              text="Brak notatek. Placeholder pod prywatne notatki graczy i widok GM."
              actionLabel="Dodaj notatke"
            />
          </div>
        </div>
      )}

      {!loading && !campaign && !error && <div className="campaignDetailsEmpty">Nie znaleziono kampanii.</div>}
    </div>
  );
}
