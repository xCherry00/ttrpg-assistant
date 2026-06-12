import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { listCharacters } from "../../../api/characters";
import {
  assignCharacterToCampaign,
  addFriendToCampaign,
  createCampaignSession,
  deleteCampaign,
  detachCharacterFromCampaign,
  finishCampaignSession,
  getCampaignById,
  getCampaignCharacters,
  getSessionAttendance,
  leaveCampaign,
  listCampaignFriendCandidates,
  listCampaignMembers,
  listCampaignSessions,
  startCampaignSession,
  updateCampaign,
  updateMySessionAttendance,
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
  const [availabilityAttendance, setAvailabilityAttendance] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [campaignData, campaignCharactersData, ownCharacters, membersData, sessionsData] = await Promise.all([
        getCampaignById(token, campaignId),
        getCampaignCharacters(token, campaignId),
        listCharacters(token),
        listCampaignMembers(token, campaignId).catch(() => []),
        listCampaignSessions(token, campaignId),
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

  const loadFriendCandidates = useCallback(async () => {
    const candidates = await listCampaignFriendCandidates(token, campaignId);
    if (Array.isArray(candidates)) return candidates;
    if (Array.isArray(candidates?.content)) return candidates.content;
    if (Array.isArray(candidates?.items)) return candidates.items;
    return [];
  }, [campaignId, token]);

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
      navigate(`/campaigns/${campaignId}/sessions/${sessionId}/live`);
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
    loadFriendCandidates,
    handleInviteFriend: (friendUserId) => runAction(async () => {
      await addFriendToCampaign(token, campaignId, friendUserId);
      setNotice("Zaproszono gracza do kampanii.");
    }),
  }), [campaignId, loadFriendCandidates, navigate, runAction, token]);

  const myMember = members.find((member) => member?.self) || null;
  const isOwner = Boolean(
    campaign?.owner
    || myMember?.owner
    || myMember?.mg
    || String(myMember?.role || "").toUpperCase() === "GM",
  );
  const myUserId = Number(myMember?.id ?? myMember?.userId ?? 0) || null;
  const inviteCode = campaign?.joinCode || campaign?.inviteCode || "";
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
    availabilityAttendance,
    availabilityError,
    isOwner,
    myUserId,
    inviteCode,
    actions,
  };
}
