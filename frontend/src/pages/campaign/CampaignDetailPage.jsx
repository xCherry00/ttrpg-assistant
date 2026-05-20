import { useEffect, useMemo, useState } from "react";
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
  listCampaignMaterials,
  listCampaignSessions,
  startCampaignSession,
  updateCampaign,
} from "../../api/campaigns";
import "../../styles/campaign-details.css";
import CampaignOverviewPanel from "./components/CampaignOverviewPanel";
import CampaignCharactersPanel from "./components/CampaignCharactersPanel";
import CampaignSessionsPanel from "./components/CampaignSessionsPanel";
import CampaignMaterialsPanel from "./components/CampaignMaterialsPanel";
import CampaignToolsPanel from "./components/CampaignToolsPanel";

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
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.status === "IN_PROGRESS") || sessions.find((session) => session.status === "PLANNED") || null,
    [sessions]
  );

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [campaignData, campaignCharactersData, ownCharacters, sessionsData, materialsData] = await Promise.all([
        getCampaignById(token, campaignId),
        getCampaignCharacters(token, campaignId),
        listCharacters(token),
        listCampaignSessions(token, campaignId),
        listCampaignMaterials(token, campaignId),
      ]);
      setCampaign(campaignData);
      setCampaignCharacters(Array.isArray(campaignCharactersData) ? campaignCharactersData : []);
      setMyCharacters(Array.isArray(ownCharacters) ? ownCharacters : []);
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
            Centrum zarzadzania kampania, sesjami, postaciami, materialami oraz wejsciami do globalnych narzedzi i przyszlego live room.
          </p>
        </div>
      </div>

      {loading && <div className="campaignDetailsState">Ladowanie workspace kampanii...</div>}
      {error && <div className="campaignDetailsError">{error}</div>}
      {notice && <div className="campaignDetailsNotice">{notice}</div>}

      {!loading && campaign && (
        <div className="campaignWorkspaceGrid">
          <CampaignOverviewPanel
            campaign={campaign}
            isOwner={Boolean(campaign.owner)}
            busy={busy}
            onUpdate={handleUpdateCampaign}
            onDelete={handleDeleteCampaign}
          />

          <CampaignToolsPanel campaignId={campaignId} activeSession={activeSession} />

          <CampaignCharactersPanel
            campaignCharacters={campaignCharacters}
            myCharacters={myCharacters}
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
      )}

      {!loading && !campaign && !error && <div className="campaignDetailsEmpty">Nie znaleziono kampanii.</div>}
    </div>
  );
}
