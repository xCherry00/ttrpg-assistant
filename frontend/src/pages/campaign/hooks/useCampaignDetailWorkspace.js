import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { listCharacters } from "../../../api/characters";
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
  getSessionAttendance,
  getCampaignPlayerNotes,
  leaveCampaign,
  listCampaignMaterials,
  listCampaignMembers,
  listCampaignSessions,
  startCampaignSession,
  updateCampaign,
  updateMySessionAttendance,
  updateCampaignPlayerNote,
} from "../../../api/campaigns";

function toTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function pickAvailabilitySession(sessions) {
  const planned = sessions
    .filter((session) => String(session.status || "").toUpperCase() === "PLANNED")
    .slice()
    .sort((a, b) => toTimestamp(a.scheduledFor) - toTimestamp(b.scheduledFor));

  if (planned.length > 0) return planned[0];

  return sessions.find((session) => String(session.status || "").toUpperCase() === "IN_PROGRESS") || null;
}

export function useCampaignDetailWorkspace() {
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
  const [availabilityAttendance, setAvailabilityAttendance] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");

  const loadAll = useCallback(async () => {
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
      const normalizedSessions = Array.isArray(sessionsData) ? sessionsData : [];
      const availabilitySession = pickAvailabilitySession(normalizedSessions);
      let attendanceData = null;
      setAvailabilityError("");
      if (availabilitySession?.id) {
        try {
          attendanceData = await getSessionAttendance(token, campaignId, availabilitySession.id);
        } catch (attendanceErr) {
          setAvailabilityError(attendanceErr?.message || "Nie udalo sie pobrac dostepnosci.");
        }
      }
      setCampaign(campaignData);
      setCampaignCharacters(Array.isArray(campaignCharactersData) ? campaignCharactersData : []);
      setMyCharacters(Array.isArray(ownCharacters) ? ownCharacters : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setSessions(normalizedSessions);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setPlayerNotes(Array.isArray(playerNotesData) ? playerNotesData : []);
      setAvailabilityAttendance(attendanceData);
    } catch (err) {
      setError(err?.message || "Nie udalo sie pobrac workspace kampanii.");
    } finally {
      setLoading(false);
    }
  }, [campaignId, token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const runAction = useCallback(async (action) => {
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
  }, [loadAll]);

  const actions = useMemo(() => ({
    handleUpdateCampaign: (payload) => runAction(async () => {
      await updateCampaign(token, campaignId, payload);
      setNotice("Zapisano kampanie.");
    }),
    handleLeaveCampaign: () => runAction(async () => {
      await leaveCampaign(token, campaignId);
      navigate("/campaigns");
    }),
    handleDeleteCampaign: () => runAction(async () => {
        await deleteCampaign(token, campaignId);
        navigate("/campaigns");
    }),
    handleAssignCharacter: (characterId) => runAction(async () => {
      await assignCharacterToCampaign(token, campaignId, characterId);
      setNotice("Przypisano postac.");
    }),
    handleDetachCharacter: (characterId) => runAction(async () => {
      await detachCharacterFromCampaign(token, campaignId, characterId);
      setNotice("Odpieto postac.");
    }),
    handleCreateSession: (payload) => runAction(async () => {
      await createCampaignSession(token, campaignId, payload);
      setNotice("Utworzono sesje.");
    }),
    handleStartSession: (sessionId) => runAction(async () => {
      await startCampaignSession(token, campaignId, sessionId);
      setNotice("Sesja rozpoczeta.");
    }),
    handleFinishSession: (sessionId) => runAction(async () => {
      await finishCampaignSession(token, campaignId, sessionId);
      setNotice("Sesja zakonczona.");
    }),
    handleUpdateAvailability: (sessionId, payload) => runAction(async () => {
      const data = await updateMySessionAttendance(token, campaignId, sessionId, payload);
      setAvailabilityAttendance(data);
      setNotice("Zapisano dostepnosc.");
    }),
    handleCreatePlayerNote: (payload) => runAction(async () => {
      await createCampaignPlayerNote(token, campaignId, payload);
      setNotice("Dodano notatke.");
    }),
    handleUpdatePlayerNote: (noteId, payload) => runAction(async () => {
      await updateCampaignPlayerNote(token, campaignId, noteId, payload);
      setNotice("Zapisano notatke.");
    }),
    handleDeletePlayerNote: (noteId) => runAction(async () => {
      await deleteCampaignPlayerNote(token, campaignId, noteId);
      setNotice("Usunieto notatke.");
    }),
  }), [campaignId, navigate, runAction, token]);

  const myMember = members.find((member) => member?.self) || null;
  const isOwner = Boolean(
    campaign?.owner
    || myMember?.owner
    || myMember?.mg
    || String(myMember?.role || "").toUpperCase() === "GM",
  );
  const myUserId = Number(myMember?.id ?? myMember?.userId ?? 0) || null;
  const inviteCode = campaign?.joinCode || campaign?.inviteCode || "";
  const showMaterialsPanel = materials.length > 0;
  const campaignTabs = isOwner
    ? [
      { key: "session", label: "Sesja" },
      { key: "availability", label: "Dostepnosc" },
      { key: "characters", label: "Postacie" },
      { key: "players", label: "Gracze" },
      ...(showMaterialsPanel ? [{ key: "materials", label: "Materialy" }] : []),
      { key: "notes", label: "Notatki" },
      { key: "settings", label: "Ustawienia" },
    ]
    : [
      { key: "session", label: "Sesja" },
      { key: "availability", label: "Dostepnosc" },
      { key: "characters", label: "Postacie" },
      { key: "players", label: "Gracze" },
      ...(showMaterialsPanel ? [{ key: "materials", label: "Materialy" }] : []),
      { key: "notes", label: "Notatki" },
    ];

  return {
    campaignId,
    loading,
    error,
    notice,
    busy,
    campaign,
    campaignCharacters,
    myCharacters,
    members,
    sessions,
    materials,
    playerNotes,
    availabilityAttendance,
    availabilityError,
    isOwner,
    myUserId,
    inviteCode,
    showMaterialsPanel,
    campaignTabs,
    actions,
  };
}
