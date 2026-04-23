import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  addFriendToCampaign,
  createCampaignMaterial,
  createCampaignSession,
  finishCampaignSession,
  getCampaignById,
  getSessionNote,
  leaveCampaign,
  listCampaignFriendCandidates,
  listCampaignMaterials,
  listCampaignMembers,
  listCampaignNotifications,
  listCampaignSessions,
  listSessionAttendance,
  listSessionMessages,
  markCampaignNotificationRead,
  removeCampaignMember,
  saveSessionNote,
  sendSessionMessage,
  startCampaignSession,
  updateCampaign,
  updateSessionAttendance,
} from "../api/campaigns";
import { getMyProfile, updateChatNickColor } from "../api/settings";
import "../styles/campaign-details.css";

const CAMPAIGN_TABS = [
  { id: "overview", label: "Przegląd" },
  { id: "members", label: "Członkowie" },
  { id: "sessions", label: "Sesje" },
  { id: "notes", label: "Notatki" },
  { id: "materials", label: "Materiały" },
  { id: "manage", label: "Zarządzanie" },
];

const ATTENDANCE_OPTIONS = [
  { value: "YES", label: "Będę" },
  { value: "MAYBE", label: "Może" },
  { value: "NO", label: "Nie dam rady" },
];

const MATERIAL_TYPES = ["NOTE", "NPC", "LOCATION", "LOOT"];
const CHAT_NICK_PRESETS = ["#ffd166", "#7bdff2", "#cdb4ff", "#ff8fab", "#80ed99", "#f4a261", "#b8f2e6", "#a0c4ff"];

function fallbackCover(systemCode) {
  const code = (systemCode || "").toLowerCase();
  if (code.includes("coc")) return "linear-gradient(135deg, #3a4a63 0%, #1f232c 60%, #12151b 100%)";
  if (code.includes("wh")) return "linear-gradient(135deg, #7b3a34 0%, #2b1a19 68%, #131010 100%)";
  if (code.includes("mork")) return "linear-gradient(135deg, #67673d 0%, #212115 62%, #111111 100%)";
  if (code.includes("pf")) return "linear-gradient(135deg, #4b426f 0%, #1f1d30 64%, #0f0f16 100%)";
  return "linear-gradient(135deg, #2f4f86 0%, #223051 52%, #141a2a 100%)";
}

function formatDate(value, withTime = false) {
  if (!value) return "Brak";
  const options = withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" };
  return new Intl.DateTimeFormat("pl-PL", options).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function statusLabel(status) {
  switch (status) {
    case "ACTIVE":
      return "Trwa";
    case "FINISHED":
      return "Zakończona";
    case "CANCELLED":
      return "Anulowana";
    default:
      return "Planowana";
  }
}

function memberToCandidate(member) {
  return {
    id: member.id,
    displayName: member.displayName,
    username: member.username,
    tagCode: member.tagCode,
    handle: member.handle,
  };
}

function memberCharacterLabel(member) {
  return (
    member.characterName ||
    member.playerCharacterName ||
    member.campaignCharacterName ||
    member.assignedCharacterName ||
    ""
  );
}

function emptyNoteState() {
  return {
    summary: "",
    importantEvents: "",
    loot: "",
    npcRefs: "",
    decisions: "",
    nextHooks: "",
  };
}

function nicknameColor(name) {
  const source = name || "user";
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = source.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 72% 70%)`;
}

const ATTENDANCE_CHART_CONFIG = [
  { key: "YES", label: "Będę", color: "#59d39a" },
  { key: "MAYBE", label: "Może", color: "#7bb5ff" },
  { key: "NO", label: "Nie dam rady", color: "#ff8f8f" },
];

export default function CampaignDetailsPage() {
  const { token } = useAuth();
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaign, setCampaign] = useState(null);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [friendCandidates, setFriendCandidates] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [inviteBusyId, setInviteBusyId] = useState(null);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [memberBusyId, setMemberBusyId] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionForm, setSessionForm] = useState({ title: "", description: "", scheduledFor: "" });
  const [sessionBusy, setSessionBusy] = useState("");

  const [attendance, setAttendance] = useState([]);
  const [attendancePreview, setAttendancePreview] = useState([]);
  const [hoveredAttendanceStatus, setHoveredAttendanceStatus] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatUtilityPanel, setChatUtilityPanel] = useState("");
  const [note, setNote] = useState(null);
  const [noteForm, setNoteForm] = useState(emptyNoteState());
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  const [sessionDetailError, setSessionDetailError] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [hoverDismissedNotificationIds, setHoverDismissedNotificationIds] = useState([]);

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");
  const [materialForm, setMaterialForm] = useState({ type: "NOTE", title: "", content: "" });
  const [materialBusy, setMaterialBusy] = useState(false);

  const [manageForm, setManageForm] = useState({ title: "", description: "", coverImageUrl: "" });
  const [manageBusy, setManageBusy] = useState(false);
  const chatFeedRef = useRef(null);
  const lastSeenMessageIdRef = useRef(null);
  const [myChatNickColor, setMyChatNickColor] = useState("");

  const selectedSession = useMemo(
    () => sessions.find((session) => String(session.id) === String(selectedSessionId)) || null,
    [sessions, selectedSessionId]
  );

  const visibleTabs = useMemo(
    () => CAMPAIGN_TABS.filter((tab) => campaign?.owner || tab.id !== "manage"),
    [campaign?.owner]
  );

  const attendanceSession = useMemo(() => {
    const active = sessions.find((session) => session.status === "ACTIVE");
    if (active) return active;

    return [...sessions]
      .filter((session) => session.status === "PLANNED")
      .sort((left, right) => new Date(left.scheduledFor || 0).getTime() - new Date(right.scheduledFor || 0).getTime())[0] || null;
  }, [sessions]);

  const groupedSessions = useMemo(() => ({
    active: sessions.filter((session) => session.status === "ACTIVE"),
    planned: sessions.filter((session) => session.status === "PLANNED"),
    finished: sessions.filter((session) => session.status === "FINISHED" || session.status === "CANCELLED"),
  }), [sessions]);

  const noteSessions = groupedSessions.finished;

  const coverStyle = useMemo(() => {
    if (!campaign) return { backgroundImage: fallbackCover("dnd5e") };
    if (campaign.coverImageUrl) return { backgroundImage: `url(${campaign.coverImageUrl})` };
    return { backgroundImage: fallbackCover(campaign.systemCode) };
  }, [campaign]);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaign() {
      setLoading(true);
      setError("");
      try {
        const data = await getCampaignById(token, campaignId);
        if (!cancelled) {
          setCampaign(data);
          setManageForm({
            title: data.title || "",
            description: data.description || "",
            coverImageUrl: data.coverImageUrl || "",
          });
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Nie udało się pobrać szczegółów kampanii.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCampaign();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadMyProfile() {
      try {
        const me = await getMyProfile(token);
        if (!cancelled) {
          setMyChatNickColor(me.chatNickColor || "");
        }
      } catch {
        if (!cancelled) {
          setMyChatNickColor("");
        }
      }
    }

    loadMyProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setMembersLoading(true);
      setMembersError("");
      try {
        const data = await listCampaignMembers(token, campaignId);
        if (!cancelled) setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setMembersError(err?.message || "Nie udało się pobrać listy członków kampanii.");
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadFriendCandidates() {
      if (!campaign?.owner) {
        if (!cancelled) {
          setFriendCandidates([]);
          setFriendsError("");
          setFriendsLoading(false);
        }
        return;
      }

      setFriendsLoading(true);
      setFriendsError("");
      try {
        const data = await listCampaignFriendCandidates(token, campaignId);
        if (!cancelled) setFriendCandidates(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setFriendsError(err?.message || "Nie udało się pobrać listy znajomych.");
      } finally {
        if (!cancelled) setFriendsLoading(false);
      }
    }

    loadFriendCandidates();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId, campaign?.owner]);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      setSessionsLoading(true);
      setSessionsError("");
      try {
        const data = await listCampaignSessions(token, campaignId);
        if (!cancelled) {
          const nextSessions = Array.isArray(data) ? data : [];
          setSessions(nextSessions);
          if (nextSessions.length > 0 && !nextSessions.some((item) => String(item.id) === String(selectedSessionId))) {
            const preferredSession = nextSessions.find((item) => item.status === "ACTIVE")
              || nextSessions.find((item) => item.status === "PLANNED")
              || nextSessions[0];
            setSelectedSessionId(preferredSession.id);
          }
          if (nextSessions.length === 0) {
            setSelectedSessionId(null);
          }
        }
      } catch (err) {
        if (!cancelled) setSessionsError(err?.message || "Nie udało się pobrać sesji kampanii.");
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    }

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setNotificationsLoading(true);
      try {
        const data = await listCampaignNotifications(token, campaignId);
        if (!cancelled) setNotifications(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      setMaterialsLoading(true);
      setMaterialsError("");
      try {
        const data = await listCampaignMaterials(token, campaignId);
        if (!cancelled) setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setMaterialsError(err?.message || "Nie udało się pobrać materiałów kampanii.");
      } finally {
        if (!cancelled) setMaterialsLoading(false);
      }
    }

    loadMaterials();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionDetails() {
      if (!selectedSessionId) {
        setAttendance([]);
        setMessages([]);
        setNote(null);
        setNoteForm(emptyNoteState());
        return;
      }

      setSessionDetailLoading(true);
      setSessionDetailError("");
      try {
        const [attendanceData, messagesData, noteData] = await Promise.all([
          listSessionAttendance(token, campaignId, selectedSessionId),
          listSessionMessages(token, campaignId, selectedSessionId),
          getSessionNote(token, campaignId, selectedSessionId),
        ]);
        if (!cancelled) {
          setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
          setMessages(Array.isArray(messagesData) ? messagesData : []);
          setNote(noteData || null);
          setNoteForm(noteData ? {
            summary: noteData.summary || "",
            importantEvents: noteData.importantEvents || "",
            loot: noteData.loot || "",
            npcRefs: noteData.npcRefs || "",
            decisions: noteData.decisions || "",
            nextHooks: noteData.nextHooks || "",
          } : emptyNoteState());
        }
      } catch (err) {
        if (!cancelled) setSessionDetailError(err?.message || "Nie udało się pobrać szczegółów sesji.");
      } finally {
        if (!cancelled) setSessionDetailLoading(false);
      }
    }

    loadSessionDetails();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId, selectedSessionId]);

  useEffect(() => {
    if (!selectedSession || selectedSession.status !== "ACTIVE") return undefined;
    const interval = window.setInterval(async () => {
      try {
        const [sessionList, messageList, notificationList] = await Promise.all([
          listCampaignSessions(token, campaignId),
          listSessionMessages(token, campaignId, selectedSession.id),
          listCampaignNotifications(token, campaignId),
        ]);
        setSessions(Array.isArray(sessionList) ? sessionList : []);
        setMessages(Array.isArray(messageList) ? messageList : []);
        setNotifications(Array.isArray(notificationList) ? notificationList : []);
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [token, campaignId, selectedSession]);

  useEffect(() => {
    if (!chatModalOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setChatModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatModalOpen]);

  useEffect(() => {
    if (!chatModalOpen || !chatFeedRef.current) return;

    const lastMessage = messages[messages.length - 1] || null;
    const lastMessageId = lastMessage?.id ?? null;

    if (lastSeenMessageIdRef.current === null) {
      lastSeenMessageIdRef.current = lastMessageId;
      return;
    }

    if (lastSeenMessageIdRef.current !== lastMessageId) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      lastSeenMessageIdRef.current = lastMessageId;
    }
  }, [chatModalOpen, messages]);

  useEffect(() => {
    if (!chatModalOpen) {
      lastSeenMessageIdRef.current = null;
      setChatUtilityPanel("");
    }
  }, [chatModalOpen]);

  useEffect(() => {
    if (!campaign?.owner && activeTab === "manage") {
      setActiveTab("overview");
    }
  }, [campaign?.owner, activeTab]);

  useEffect(() => {
    if (activeTab !== "notes") return;
    if (noteSessions.length === 0) return;
    if (!noteSessions.some((session) => String(session.id) === String(selectedSessionId))) {
      setSelectedSessionId(noteSessions[0].id);
    }
  }, [activeTab, noteSessions, selectedSessionId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttendancePreview() {
      if (!attendanceSession?.id) {
        setAttendancePreview([]);
        return;
      }

      try {
        const data = await listSessionAttendance(token, campaignId, attendanceSession.id);
        if (!cancelled) {
          setAttendancePreview(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setAttendancePreview([]);
        }
      }
    }

    loadAttendancePreview();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId, attendanceSession?.id]);

  useEffect(() => {
    function handleColorUpdate(event) {
      setMyChatNickColor(event?.detail?.chatNickColor || "");
    }
    window.addEventListener("ttrpg-chat-color-updated", handleColorUpdate);
    return () => window.removeEventListener("ttrpg-chat-color-updated", handleColorUpdate);
  }, []);

  async function copyInvite() {
    if (!campaign?.inviteCode) return;
    const link = `${window.location.origin}/campaigns?code=${campaign.inviteCode}`;
    const text = `Dolacz do kampanii "${campaign.title}": ${link} (kod: ${campaign.inviteCode})`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Skopiowano zaproszenie do schowka.");
    } catch {
      setNotice("Nie udało się skopiować zaproszenia.");
    }
  }

  async function inviteFriend(friend) {
    setInviteBusyId(friend.id);
    setFriendsError("");
    try {
      await addFriendToCampaign(token, campaignId, friend.id);
      setFriendCandidates((prev) => prev.filter((item) => item.id !== friend.id));
      setMembers((prev) => [...prev, {
        id: friend.id,
        displayName: friend.displayName,
        username: friend.username,
        tagCode: friend.tagCode,
        handle: friend.handle,
        role: "PLAYER",
        owner: false,
        mg: false,
        self: false,
        joinedAt: new Date().toISOString(),
      }]);
      setNotifications(await listCampaignNotifications(token, campaignId));
      setNotice(`Dodano ${friend.displayName} do kampanii.`);
    } catch (err) {
      setFriendsError(err?.message || "Nie udało się dodać znajomego do kampanii.");
    } finally {
      setInviteBusyId(null);
    }
  }

  async function handleRemoveMember(member) {
    if (!window.confirm(`Usunac ${member.displayName} z kampanii?`)) return;
    setMemberBusyId(member.id);
    setMembersError("");
    try {
      const response = await removeCampaignMember(token, campaignId, member.id);
      setMembers((prev) => prev.filter((item) => item.id !== member.id));
      setFriendCandidates((prev) => [memberToCandidate(member), ...prev]);
      setNotifications(await listCampaignNotifications(token, campaignId));
      setNotice(response?.message || `${member.displayName} zostal usuniety z kampanii.`);
    } catch (err) {
      setMembersError(err?.message || "Nie udało się usunąć członka kampanii.");
    } finally {
      setMemberBusyId(null);
    }
  }

  async function handleLeaveCampaign() {
    if (!window.confirm("Na pewno chcesz opuscic te kampanie?")) return;
    setMemberBusyId("leave");
    setMembersError("");
    try {
      await leaveCampaign(token, campaignId);
      navigate("/campaigns");
    } catch (err) {
      setMembersError(err?.message || "Nie udało się opuścić kampanii.");
    } finally {
      setMemberBusyId(null);
    }
  }

  async function handleCreateSession(event) {
    event.preventDefault();
    setSessionBusy("create");
    setSessionsError("");
    try {
      const created = await createCampaignSession(token, campaignId, {
        title: sessionForm.title,
        description: sessionForm.description,
        scheduledFor: fromLocalInput(sessionForm.scheduledFor),
      });
      const sessionList = await listCampaignSessions(token, campaignId);
      setSessions(Array.isArray(sessionList) ? sessionList : []);
      setSelectedSessionId(created.id);
      setSessionForm({ title: "", description: "", scheduledFor: "" });
      setNotifications(await listCampaignNotifications(token, campaignId));
      setNotice("Dodano nowa sesje.");
    } catch (err) {
      setSessionsError(err?.message || "Nie udało się utworzyć sesji.");
    } finally {
      setSessionBusy("");
    }
  }

  async function handleSessionStatusChange(action) {
    if (!selectedSession) return;
    setSessionBusy(action);
    setSessionsError("");
    try {
      const updated = action === "start"
        ? await startCampaignSession(token, campaignId, selectedSession.id)
        : await finishCampaignSession(token, campaignId, selectedSession.id);
      const sessionList = await listCampaignSessions(token, campaignId);
      setSessions(Array.isArray(sessionList) ? sessionList : []);
      setSelectedSessionId(updated.id);
      setNotifications(await listCampaignNotifications(token, campaignId));
      setNotice(action === "start" ? "Sesja została rozpoczęta." : "Sesja została zakończona.");
    } catch (err) {
      setSessionsError(err?.message || "Nie udało się zmienić statusu sesji.");
    } finally {
      setSessionBusy("");
    }
  }

  async function handleAttendance(status, sessionId = attendanceSession?.id) {
    if (!sessionId) return;
    setSessionBusy(`attendance-${status}`);
    try {
      const data = await updateSessionAttendance(token, campaignId, sessionId, status);
      setAttendance(Array.isArray(data) ? data : []);
      const sessionList = await listCampaignSessions(token, campaignId);
      setSessions(Array.isArray(sessionList) ? sessionList : []);
    } catch (err) {
      setSessionDetailError(err?.message || "Nie udało się zapisać obecności.");
    } finally {
      setSessionBusy("");
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!selectedSession || !messageDraft.trim()) return;
    setSessionBusy("message");
    try {
      await sendSessionMessage(token, campaignId, selectedSession.id, messageDraft);
      setMessages(await listSessionMessages(token, campaignId, selectedSession.id));
      setMessageDraft("");
      const sessionList = await listCampaignSessions(token, campaignId);
      setSessions(Array.isArray(sessionList) ? sessionList : []);
    } catch (err) {
      setSessionDetailError(err?.message || "Nie udało się wysłać wiadomości.");
    } finally {
      setSessionBusy("");
    }
  }

  async function handleQuickRoll(sides) {
    if (!selectedSession || selectedSession.status !== "ACTIVE") return;
    setSessionBusy(`roll-${sides}`);
    try {
      const result = Math.floor(Math.random() * sides) + 1;
      await sendSessionMessage(token, campaignId, selectedSession.id, `rzuca k${sides}: ${result}`);
      setMessages(await listSessionMessages(token, campaignId, selectedSession.id));
      const sessionList = await listCampaignSessions(token, campaignId);
      setSessions(Array.isArray(sessionList) ? sessionList : []);
    } catch (err) {
      setSessionDetailError(err?.message || "Nie udało się wysłać rzutu na chat.");
    } finally {
      setSessionBusy("");
    }
  }

  async function handleQuickColorChange(color) {
    try {
      const updated = await updateChatNickColor(token, color);
      const nextColor = updated.chatNickColor || "";
      setMyChatNickColor(nextColor);
      window.dispatchEvent(new CustomEvent("ttrpg-chat-color-updated", { detail: { chatNickColor: nextColor } }));
      setMessages((prev) => prev.map((message) => (
        message.self ? { ...message, authorNickColor: nextColor } : message
      )));
    } catch (err) {
      setSessionDetailError(err?.message || "Nie udało się zapisać koloru nicku.");
    }
  }

  async function handleSaveNote(event) {
    event.preventDefault();
    if (!selectedSession) return;
    setSessionBusy("note");
    try {
      const saved = await saveSessionNote(token, campaignId, selectedSession.id, noteForm);
      setNote(saved);
      setNotifications(await listCampaignNotifications(token, campaignId));
      setNotice("Notatka sesji zostala zapisana.");
    } catch (err) {
      setSessionDetailError(err?.message || "Nie udało się zapisać notatki.");
    } finally {
      setSessionBusy("");
    }
  }

  async function handleMarkNotificationRead(notificationId) {
    try {
      const updated = await markCampaignNotificationRead(token, campaignId, notificationId);
      setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      // ignore
    }
  }

  async function handleCreateMaterial(event) {
    event.preventDefault();
    setMaterialBusy(true);
    setMaterialsError("");
    try {
      const created = await createCampaignMaterial(token, campaignId, materialForm);
      setMaterials((prev) => [created, ...prev]);
      setMaterialForm({ type: "NOTE", title: "", content: "" });
      setNotifications(await listCampaignNotifications(token, campaignId));
      setNotice("Dodano material kampanii.");
    } catch (err) {
      setMaterialsError(err?.message || "Nie udało się dodać materiału.");
    } finally {
      setMaterialBusy(false);
    }
  }

  async function handleUpdateCampaign(event) {
    event.preventDefault();
    setManageBusy(true);
    try {
      const updated = await updateCampaign(token, campaignId, manageForm);
      setCampaign(updated);
      setNotifications(await listCampaignNotifications(token, campaignId));
      setNotice("Zapisano zmiany kampanii.");
    } catch (err) {
      setError(err?.message || "Nie udało się zaktualizować kampanii.");
    } finally {
      setManageBusy(false);
    }
  }

  function findSessionIdFromNotification(notification) {
    const rawTitle = notification?.message?.split(":").slice(1).join(":").trim();
    if (!rawTitle) return null;
    const matchingSession = sessions.find((session) => (session.title || "").trim().toLowerCase() === rawTitle.toLowerCase());
    return matchingSession?.id ?? null;
  }

  async function handleNotificationClick(notification) {
    try {
      await markCampaignNotificationRead(token, campaignId, notification.id);
    } catch {
      // ignore
    }

    setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
    setHoverDismissedNotificationIds((prev) => prev.filter((id) => id !== notification.id));

    const relatedSessionId = findSessionIdFromNotification(notification);
    if (relatedSessionId) {
      setSelectedSessionId(relatedSessionId);
    }

    switch (notification.type) {
      case "SESSION_NOTE_UPDATED":
        setActiveTab("notes");
        break;
      case "MATERIAL_CREATED":
        setActiveTab("materials");
        break;
      case "SESSION_CREATED":
      case "SESSION_STARTED":
      case "SESSION_FINISHED":
        setActiveTab("sessions");
        break;
      case "CAMPAIGN_UPDATED":
      default:
        setActiveTab("overview");
        break;
    }
  }

  function renderNotificationsCard() {
    const unreadNotifications = notifications.filter((item) => !item.read);

    return (
      <article className="campaignDetailsCard panel-soft">
        <h3 className="campaignDetailsCardTitle">Powiadomienia kampanii</h3>
        {notificationsLoading && <div className="campaignDetailsState">Ładowanie powiadomień...</div>}
        {!notificationsLoading && unreadNotifications.length === 0 && (
          <div className="campaignDetailsEmpty">Na razie brak nowych powiadomien kampanijnych.</div>
        )}
        {!notificationsLoading && unreadNotifications.length > 0 && (
          <div className="campaignNotificationList">
            {unreadNotifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className="campaignNotificationItem is-new"
                onMouseEnter={() =>
                  setHoverDismissedNotificationIds((prev) => (
                    prev.includes(item.id) ? prev : [...prev, item.id]
                  ))
                }
                onClick={() => handleNotificationClick(item)}
              >
                <span className={`campaignNotificationBadge${hoverDismissedNotificationIds.includes(item.id) ? " is-hidden" : ""}`}>Nowe</span>
                <div className="campaignNotificationBody">
                  <strong>{item.message}</strong>
                </div>
              </button>
            ))}
          </div>
        )}
      </article>
    );
  }

  function renderSessionPicker(sessionItems = sessions, variant = "default", options = {}) {
    const { includeFinished = true } = options;
    const sourceGroups = {
      active: sessionItems.filter((session) => session.status === "ACTIVE"),
      planned: sessionItems.filter((session) => session.status === "PLANNED"),
      finished: sessionItems.filter((session) => session.status === "FINISHED" || session.status === "CANCELLED"),
    };

    const groups = [
      { key: "active", label: "Trwajace", items: sourceGroups.active },
      { key: "planned", label: "Nadchodzace", items: sourceGroups.planned },
      ...(includeFinished ? [{ key: "finished", label: "Archiwum", items: sourceGroups.finished }] : []),
    ].filter((group) => group.items.length > 0);

    return (
      <div className={`campaignSessionList${variant === "compact" ? " campaignSessionList--compact" : ""}`}>
        {groups.map((group) => (
          <div key={group.key} className="campaignSessionGroup">
            <div className="campaignSessionGroupLabel">{group.label}</div>
            {group.items.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`campaignSessionCard${selectedSessionId === session.id ? " is-active" : ""}`}
                onClick={() => setSelectedSessionId(session.id)}
              >
                <div className="campaignSessionCard__top">
                  <strong>{session.title}</strong>
                  <span className={`campaignSessionStatus is-${session.status?.toLowerCase()}`}>{statusLabel(session.status)}</span>
                </div>
                <div className="campaignSessionCard__meta">
                  <span>{formatDate(session.scheduledFor, true)}</span>
                  <span>Obecnosc: {session.yesCount}/{session.maybeCount}/{session.noCount}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  }

  function renderAttendanceCard() {
    if (!attendanceSession) {
      return (
        <article className="campaignDetailsCard panel-soft">
          <h3 className="campaignDetailsCardTitle">Frekwencja</h3>
          <div className="campaignDetailsEmpty">Brak nadchodzącej albo aktywnej sesji do potwierdzenia obecności.</div>
        </article>
      );
    }

    const attendanceLocked = attendanceSession.status !== "PLANNED";
    const chartRows = ATTENDANCE_CHART_CONFIG.map((item) => ({
      ...item,
      count:
        item.key === "YES"
          ? attendanceSession.yesCount
          : item.key === "MAYBE"
            ? attendanceSession.maybeCount
            : attendanceSession.noCount,
      members: attendancePreview.filter((entry) => entry.status === item.key).map((entry) => entry.displayName),
    }));
    const totalVotes = chartRows.reduce((sum, item) => sum + item.count, 0);
    const circumference = 2 * Math.PI * 42;
    let offsetAccumulator = 0;

    return (
      <article className="campaignDetailsCard panel-soft">
        <div className="campaignPanelHeader">
          <div>
            <h3 className="campaignDetailsCardTitle">Frekwencja</h3>
            <p className="campaignDetailsHelpText">
              {attendanceSession.title} • {formatDate(attendanceSession.scheduledFor, true)}
            </p>
          </div>
          <span className={`campaignSessionStatus is-${attendanceSession.status?.toLowerCase()}`}>
            {statusLabel(attendanceSession.status)}
          </span>
        </div>

        <div className="campaignAttendanceChartSection">
          <div className="campaignAttendanceChartWrap">
            <svg viewBox="0 0 120 120" className="campaignAttendanceChart" aria-label="Diagram frekwencji">
              <circle cx="60" cy="60" r="42" className="campaignAttendanceChart__track" />
              {chartRows.map((item) => {
                const fraction = totalVotes > 0 ? item.count / totalVotes : 0;
                const dash = fraction * circumference;
                const node = (
                  <circle
                    key={item.key}
                    cx="60"
                    cy="60"
                    r="42"
                    className="campaignAttendanceChart__segment"
                    style={{
                      "--segment-color": item.color,
                      strokeDasharray: `${dash} ${circumference - dash}`,
                      strokeDashoffset: `${-offsetAccumulator}`,
                    }}
                    onMouseEnter={() => setHoveredAttendanceStatus(item.key)}
                    onMouseLeave={() => setHoveredAttendanceStatus("")}
                  />
                );
                offsetAccumulator += dash;
                return node;
              })}
              <text x="60" y="56" textAnchor="middle" className="campaignAttendanceChart__totalLabel">Glosy</text>
              <text x="60" y="72" textAnchor="middle" className="campaignAttendanceChart__totalValue">{totalVotes}</text>
            </svg>
          </div>

          <div className="campaignAttendanceLegend">
            {chartRows.map((item) => (
              <div
                key={item.key}
                className={`campaignAttendanceLegendItem${hoveredAttendanceStatus === item.key ? " is-active" : ""}`}
                onMouseEnter={() => setHoveredAttendanceStatus(item.key)}
                onMouseLeave={() => setHoveredAttendanceStatus("")}
              >
                <span className="campaignAttendanceLegendDot" style={{ "--dot-color": item.color }} />
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>

          <div className="campaignAttendanceHoverCard">
            <strong>
              {hoveredAttendanceStatus
                ? chartRows.find((item) => item.key === hoveredAttendanceStatus)?.label
                : "Najedz na kolor"}
            </strong>
            <div>
              {hoveredAttendanceStatus
                ? (chartRows.find((item) => item.key === hoveredAttendanceStatus)?.members.length
                  ? chartRows.find((item) => item.key === hoveredAttendanceStatus)?.members.join(", ")
                  : "Nikt jeszcze nie wybral tej opcji.")
                : "Zobaczysz tutaj, kto zaznaczyl dana odpowiedz."}
            </div>
          </div>
        </div>

        <div className="campaignAttendanceActions">
          {ATTENDANCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`campaignAttendanceBtn${attendanceSession.myAttendance === option.value ? " is-active" : ""}`}
              disabled={attendanceLocked || sessionBusy === `attendance-${option.value}`}
              onClick={() => handleAttendance(option.value, attendanceSession.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {attendanceLocked && (
          <div className="campaignDetailsEmpty">
            {attendanceSession.status === "ACTIVE"
              ? "Sesja juz trwa, wiec frekwencja jest zablokowana i zostaje tylko podglad."
              : "Ta sesja jest juz zakonczona, dlatego nie mozna zmienic frekwencji."}
          </div>
        )}

        <div className="campaignAttendanceList">
          {attendance.map((item) => (
            <div key={item.userId} className="campaignAttendanceItem">
              <strong>{item.displayName}</strong>
              <span>{item.status}</span>
            </div>
          ))}
        </div>
      </article>
    );
  }

  function renderSessionCreateCard() {
    if (!campaign?.owner) return null;
    return (
      <form className="campaignDetailsCard panel-soft campaignFormCard" onSubmit={handleCreateSession}>
        <h3 className="campaignDetailsCardTitle">Nowa sesja</h3>
        <label className="campaignField">
          <span>Tytul</span>
          <input value={sessionForm.title} onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))} required />
        </label>
        <label className="campaignField">
          <span>Termin</span>
          <input type="datetime-local" value={sessionForm.scheduledFor} onChange={(e) => setSessionForm((prev) => ({ ...prev, scheduledFor: e.target.value }))} />
        </label>
        <label className="campaignField">
          <span>Opis</span>
          <textarea rows={4} value={sessionForm.description} onChange={(e) => setSessionForm((prev) => ({ ...prev, description: e.target.value }))} />
        </label>
        <button type="submit" className="campaignDetailsPrimaryBtn" disabled={sessionBusy === "create"}>
          {sessionBusy === "create" ? "Tworzenie..." : "Dodaj sesje"}
        </button>
      </form>
    );
  }

  function renderNoteArchivePicker() {
    return (
      <div className="campaignNoteSessionRail">
        {noteSessions.map((session) => (
          <button
            key={session.id}
            type="button"
            className={`campaignNoteSessionCard${selectedSessionId === session.id ? " is-active" : ""}`}
            onClick={() => setSelectedSessionId(session.id)}
          >
            <div className="campaignNoteSessionCard__top">
              <strong>{session.title}</strong>
              <span className={`campaignSessionStatus is-${session.status?.toLowerCase()}`}>{statusLabel(session.status)}</span>
            </div>
            <div className="campaignNoteSessionCard__meta">
              <span>{formatDate(session.scheduledFor, true)}</span>
              <span>Obecnosc: {session.yesCount}/{session.maybeCount}/{session.noCount}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="page campaignDetailsPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Szczegoly kampanii</h1>
          <p className="pageSubtitle">Pelny panel kampanii: sklad druzyny, sesje, notatki, materialy i zarzadzanie w jednym miejscu.</p>
        </div>
        <Link to="/campaigns" className="campaignDetailsBackBtn">Wroc do hubu</Link>
      </div>

      {notice && <div className="campaignDetailsNotice">{notice}</div>}
      {loading && <div className="campaignDetailsState">Ładowanie kampanii...</div>}
      {!loading && error && <div className="campaignDetailsError">{error}</div>}

      {!loading && !error && campaign && (
        <>
          <section className="campaignHero panel-soft">
            <div className="campaignHeroCover" style={coverStyle} />
            <div className="campaignHeroBody">
              <h2 className="campaignHeroTitle">{campaign.title}</h2>
              <div className="campaignHeroMeta">
                <span className="campaignHeroTag">System: {campaign.systemCode?.toUpperCase()}</span>
                <span className="campaignHeroTag">Twoja rola: {campaign.owner ? "MG" : campaign.myRole}</span>
                <span className="campaignHeroTag">Członkowie: {members.length || "..."}</span>
                <span className="campaignHeroTag">Sesje: {sessions.length}</span>
              </div>
              <p className="campaignHeroDescription">{campaign.description || "Brak opisu kampanii."}</p>
            </div>
          </section>

          <section className="campaignTabs" aria-label="Nawigacja kampanii">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`campaignTabBtn${activeTab === tab.id ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </section>

          {activeTab === "overview" && (
            <section className="campaignOverviewLayout">
              {renderAttendanceCard()}

              {renderNotificationsCard()}
            </section>
          )}

          {activeTab === "members" && (
            <section className="campaignWorkspaceGrid">
              <div className="campaignWorkspaceColumn">
                <article className="campaignDetailsCard panel-soft">
                  <h3 className="campaignDetailsCardTitle">Zapraszanie do kampanii</h3>
                  <div className="campaignDetailsInfoRow">
                    <span>Kod kampanii</span>
                    <strong>{campaign.inviteCode}</strong>
                  </div>
                  <div className="campaignDetailsInfoRow">
                    <span>Link dolaczenia</span>
                    <code>{`/campaigns?code=${campaign.inviteCode}`}</code>
                  </div>
                  <button type="button" className="campaignDetailsPrimaryBtn" onClick={copyInvite}>Kopiuj zaproszenie</button>
                </article>

                {campaign.owner && (
                  <article className="campaignDetailsCard panel-soft">
                    <h3 className="campaignDetailsCardTitle">Dodaj po znajomych</h3>
                    <p className="campaignDetailsHelpText">Tutaj dodasz do kampanii swoich znajomych bez kodu i bez linku.</p>
                    {friendsLoading && <div className="campaignDetailsState">Ładowanie znajomych...</div>}
                    {friendsError && <div className="campaignDetailsError">{friendsError}</div>}
                    {!friendsLoading && !friendsError && friendCandidates.length === 0 && (
                      <div className="campaignDetailsEmpty">Brak znajomych do dodania.</div>
                    )}
                    {!friendsLoading && !friendsError && friendCandidates.length > 0 && (
                      <div className="campaignFriendList">
                        {friendCandidates.map((friend) => (
                          <div key={friend.id} className="campaignFriendItem">
                            <div className="campaignFriendIdentity">
                              <strong>{friend.displayName}</strong>
                              <span>{friend.username}#{String(friend.tagCode).padStart(4, "0")}</span>
                            </div>
                            <button
                              type="button"
                              className="campaignDetailsPrimaryBtn campaignDetailsPrimaryBtn--small"
                              disabled={inviteBusyId === friend.id}
                              onClick={() => inviteFriend(friend)}
                            >
                              {inviteBusyId === friend.id ? "Dodawanie..." : "Dodaj"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )}
              </div>

              <section className="campaignMembersSection panel-soft">
                <div className="campaignMembersHeader">
                  <div>
                    <h3 className="campaignDetailsCardTitle">Członkowie kampanii</h3>
                    <p className="campaignDetailsHelpText">Tutaj masz liste osob w kampanii razem z podstawowymi informacjami o ich roli i postaci.</p>
                  </div>
                  {!campaign.owner && (
                    <button type="button" className="campaignDetailsDangerBtn" disabled={memberBusyId === "leave"} onClick={handleLeaveCampaign}>
                      {memberBusyId === "leave" ? "Opuszczanie..." : "Opusc kampanie"}
                    </button>
                  )}
                </div>

                {membersLoading && <div className="campaignDetailsState">Ładowanie członków kampanii...</div>}
                {membersError && <div className="campaignDetailsError">{membersError}</div>}
                {!membersLoading && !membersError && (
                  <div className="campaignMemberList">
                    {members.map((member) => {
                      const characterLabel = memberCharacterLabel(member);
                      const showCharacterMeta = !member.owner && member.role !== "MG";
                      return (
                        <article key={member.id} className="campaignMemberCard">
                          <Link to={`/users/${member.handle}`} className="campaignMemberAvatarLink" aria-label={`Profil ${member.displayName}`}>
                            <div className="campaignMemberAvatar">{(member.displayName || member.username || "U").slice(0, 1).toUpperCase()}</div>
                          </Link>
                          <div className="campaignMemberBody">
                            <div className="campaignMemberTopRow">
                              <div>
                                <h4>{member.displayName}</h4>
                                <div className="campaignMemberTag">{member.username}#{String(member.tagCode).padStart(4, "0")}</div>
                              </div>
                              <div className="campaignMemberAside">
                                <div className="campaignMemberJoined">Dołączył: {formatDate(member.joinedAt)}</div>
                                <div className="campaignMemberBadges">
                                  {member.owner && <span className="campaignMemberBadge">Wlasciciel</span>}
                                  <span className="campaignMemberBadge">{member.role}</span>
                                  {member.self && <span className="campaignMemberBadge">Ty</span>}
                                </div>
                              </div>
                            </div>
                            {showCharacterMeta && (
                              <div className="campaignMemberMeta">
                                <div className="campaignMemberMetaItem">
                                  <span>Postac</span>
                                  <strong>{characterLabel || "Brak przypisanej postaci"}</strong>
                                </div>
                              </div>
                            )}
                            {campaign.owner && !member.owner && (
                              <div className="campaignMemberActions">
                                <button type="button" className="campaignDetailsDangerBtn" disabled={memberBusyId === member.id} onClick={() => handleRemoveMember(member)}>
                                  {memberBusyId === member.id ? "Usuwanie..." : "Usun z kampanii"}
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </section>
          )}

          {activeTab === "sessions" && (
            <section className="campaignWorkspaceGrid">
              <div className="campaignWorkspaceColumn">
                {renderSessionCreateCard()}
                <article className="campaignDetailsCard panel-soft">
                  <h3 className="campaignDetailsCardTitle">Lista sesji</h3>
                  {sessionsLoading && <div className="campaignDetailsState">Ładowanie sesji...</div>}
                  {sessionsError && <div className="campaignDetailsError">{sessionsError}</div>}
                  {!sessionsLoading && sessions.length === 0 && <div className="campaignDetailsEmpty">Nie masz jeszcze zadnych sesji w tej kampanii.</div>}
                  {!sessionsLoading && sessions.length > 0 && renderSessionPicker(sessions, "default", { includeFinished: false })}
                </article>
              </div>

              <article className="campaignDetailsCard panel-soft">
                <h3 className="campaignDetailsCardTitle">Panel sesji</h3>
                {!selectedSession && <div className="campaignDetailsEmpty">Wybierz sesje z listy po lewej stronie.</div>}
                {selectedSession && (
                  <div className="campaignSessionDetail">
                    {selectedSession.status === "ACTIVE" && (
                      <div className="campaignSessionShortcutCard">
                        <div>
                          <h4>Okno sesji na zywo</h4>
                          <p>Czat otwiera sie w osobnym oknie podczas prowadzenia sesji.</p>
                        </div>
                        <button
                          type="button"
                          className="campaignDetailsPrimaryBtn"
                          onClick={() => setChatModalOpen(true)}
                        >
                          Otworz okno sesji
                        </button>
                      </div>
                    )}

                    <div className="campaignSessionDetail__hero">
                      <div>
                        <h4>{selectedSession.title}</h4>
                        <p>{selectedSession.description || "Brak opisu sesji."}</p>
                      </div>
                      <div className={`campaignSessionStatusLarge is-${selectedSession.status?.toLowerCase()}`}>{statusLabel(selectedSession.status)}</div>
                    </div>
                    <div className="campaignSessionFactGrid">
                      <div><span>Termin</span><strong>{formatDate(selectedSession.scheduledFor, true)}</strong></div>
                      <div><span>Start</span><strong>{formatDate(selectedSession.startedAt, true)}</strong></div>
                      <div><span>Koniec</span><strong>{formatDate(selectedSession.finishedAt, true)}</strong></div>
                      <div><span>Chat</span><strong>{selectedSession.status === "ACTIVE" ? "Aktywny" : "Archiwum"}</strong></div>
                    </div>

                    {campaign.owner && (
                      <div className="campaignSessionOwnerActions">
                        {selectedSession.status === "PLANNED" && (
                          <button type="button" className="campaignDetailsPrimaryBtn" disabled={sessionBusy === "start"} onClick={() => handleSessionStatusChange("start")}>
                            {sessionBusy === "start" ? "Uruchamianie..." : "Rozpocznij sesję"}
                          </button>
                        )}
                        {selectedSession.status === "ACTIVE" && (
                          <button type="button" className="campaignDetailsDangerBtn" disabled={sessionBusy === "finish"} onClick={() => handleSessionStatusChange("finish")}>
                            {sessionBusy === "finish" ? "Zamykanie..." : "Zakończ sesję"}
                          </button>
                        )}
                      </div>
                    )}

                    {sessionDetailLoading && <div className="campaignDetailsState">Ładowanie danych sesji...</div>}
                    {sessionDetailError && <div className="campaignDetailsError">{sessionDetailError}</div>}
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === "notes" && (
            <section className="campaignNotesLayout">
              {noteSessions.length > 0 && (
                <article className="campaignDetailsCard panel-soft">
                  <h3 className="campaignDetailsCardTitle">Historia sesji</h3>
                  <p className="campaignDetailsHelpText">Wybierz zakonczona sesje, zeby podejrzec notatke MG.</p>
                  {renderNoteArchivePicker()}
                </article>
              )}

              <article className="campaignDetailsCard panel-soft">
                <h3 className="campaignDetailsCardTitle">Notatka sesji</h3>
                {!selectedSession && <div className="campaignDetailsEmpty">Wybierz sesje, aby zobaczyc lub edytowac notatke.</div>}
                {selectedSession && selectedSession.status !== "FINISHED" && selectedSession.status !== "CANCELLED" && (
                  <div className="campaignDetailsEmpty">W panelu notatek pokazujemy tylko zakonczone sesje razem z ich notatka i archiwum czatu.</div>
                )}
                {selectedSession && !campaign.owner && selectedSession.status !== "FINISHED" && selectedSession.status !== "CANCELLED" && (
                  <div className="campaignDetailsEmpty">Notatka bedzie widoczna dla graczy po zakonczeniu sesji.</div>
                )}
                {selectedSession && (campaign.owner || selectedSession.status === "FINISHED" || selectedSession.status === "CANCELLED") && (
                  <>
                    <div className="campaignNoteSessionHero">
                      <div>
                        <h4>{selectedSession.title}</h4>
                        <p>{selectedSession.description || "Brak opisu sesji."}</p>
                      </div>
                      <div className={`campaignSessionStatusLarge is-${selectedSession.status?.toLowerCase()}`}>{statusLabel(selectedSession.status)}</div>
                    </div>
                    <div className="campaignNoteSessionFacts">
                      <div><span>Termin</span><strong>{formatDate(selectedSession.scheduledFor, true)}</strong></div>
                      <div><span>Start</span><strong>{formatDate(selectedSession.startedAt, true)}</strong></div>
                      <div><span>Koniec</span><strong>{formatDate(selectedSession.finishedAt, true)}</strong></div>
                    </div>
                    <div className="campaignNoteArchiveAction">
                      <div>
                        <h4>Archiwum chatu</h4>
                        <p>Z tej zakladki mozesz od razu podejrzec rozmowe z zakonczonej sesji.</p>
                      </div>
                      <button
                        type="button"
                        className="campaignDetailsPrimaryBtn"
                        onClick={() => setChatModalOpen(true)}
                      >
                        Otworz archiwum chatu
                      </button>
                    </div>
                    {note?.updatedAfterFinish && (
                      <div className="campaignDetailsNotice">
                        MG zaktualizowal notatke juz po zakonczeniu sesji. Ostatnia zmiana: {formatDate(note.updatedAt, true)}.
                      </div>
                    )}
                    <div className="campaignNoteMeta">
                      <span>Ostatnia zmiana: {formatDate(note?.updatedAt, true)}</span>
                      <span>Autor: {note?.updatedByDisplayName || "MG"}</span>
                    </div>
                    {campaign.owner ? (
                      <form className="campaignNoteForm" onSubmit={handleSaveNote}>
                        {[
                          ["summary", "Podsumowanie"],
                          ["importantEvents", "Wazne wydarzenia"],
                          ["loot", "Loot"],
                          ["npcRefs", "NPC i frakcje"],
                          ["decisions", "Decyzje druzyny"],
                          ["nextHooks", "Hooki na kolejna sesje"],
                        ].map(([key, label]) => (
                          <label key={key} className="campaignField">
                            <span>{label}</span>
                            <textarea rows={4} value={noteForm[key]} onChange={(e) => setNoteForm((prev) => ({ ...prev, [key]: e.target.value }))} />
                          </label>
                        ))}
                        <button type="submit" className="campaignDetailsPrimaryBtn" disabled={sessionBusy === "note"}>
                          {sessionBusy === "note" ? "Zapisywanie..." : "Zapisz notatke"}
                        </button>
                      </form>
                    ) : (
                      <div className="campaignNoteReadOnly">
                        {[
                          ["Podsumowanie", note?.summary],
                          ["Wazne wydarzenia", note?.importantEvents],
                          ["Loot", note?.loot],
                          ["NPC i frakcje", note?.npcRefs],
                          ["Decyzje druzyny", note?.decisions],
                          ["Hooki na kolejna sesje", note?.nextHooks],
                        ].map(([label, value]) => (
                          <div key={label} className="campaignNoteBlock">
                            <h4>{label}</h4>
                            <p>{value || "Brak wpisu."}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </article>
            </section>
          )}

          {activeTab === "materials" && (
            <section className="campaignWorkspaceGrid">
              {campaign.owner && (
                <form className="campaignDetailsCard panel-soft campaignFormCard" onSubmit={handleCreateMaterial}>
                  <h3 className="campaignDetailsCardTitle">Dodaj material</h3>
                  <label className="campaignField">
                    <span>Typ</span>
                    <select value={materialForm.type} onChange={(e) => setMaterialForm((prev) => ({ ...prev, type: e.target.value }))}>
                      {MATERIAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="campaignField">
                    <span>Tytul</span>
                    <input value={materialForm.title} onChange={(e) => setMaterialForm((prev) => ({ ...prev, title: e.target.value }))} required />
                  </label>
                  <label className="campaignField">
                    <span>Tresc</span>
                    <textarea rows={6} value={materialForm.content} onChange={(e) => setMaterialForm((prev) => ({ ...prev, content: e.target.value }))} />
                  </label>
                  <button type="submit" className="campaignDetailsPrimaryBtn" disabled={materialBusy}>
                    {materialBusy ? "Dodawanie..." : "Dodaj material"}
                  </button>
                </form>
              )}

              <article className="campaignDetailsCard panel-soft">
                <h3 className="campaignDetailsCardTitle">Biblioteka kampanii</h3>
                {materialsLoading && <div className="campaignDetailsState">Ładowanie materiałów...</div>}
                {materialsError && <div className="campaignDetailsError">{materialsError}</div>}
                {!materialsLoading && materials.length === 0 && <div className="campaignDetailsEmpty">Na razie brak materialow kampanii.</div>}
                {!materialsLoading && materials.length > 0 && (
                  <div className="campaignMaterialList">
                    {materials.map((material) => (
                      <div key={material.id} className="campaignMaterialCard">
                        <div className="campaignMaterialCard__top">
                          <strong>{material.title}</strong>
                          <span className="campaignMemberBadge">{material.type}</span>
                        </div>
                        <p>{material.content || "Brak opisu."}</p>
                        <div className="campaignMaterialMeta">
                          <span>{material.createdByDisplayName}</span>
                          <span>{formatDate(material.updatedAt, true)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === "manage" && campaign.owner && (
            <section className="campaignWorkspaceGrid">
              <form className="campaignDetailsCard panel-soft campaignFormCard" onSubmit={handleUpdateCampaign}>
                <h3 className="campaignDetailsCardTitle">Panel MG</h3>
                <p className="campaignDetailsHelpText">Tutaj zmieniasz informacje widoczne na gorze panelu kampanii, czyli nazwe, opis i banner / cover.</p>
                <label className="campaignField">
                  <span>Nazwa</span>
                  <input value={manageForm.title} onChange={(e) => setManageForm((prev) => ({ ...prev, title: e.target.value }))} required />
                </label>
                <label className="campaignField">
                  <span>Opis</span>
                  <textarea rows={6} value={manageForm.description} onChange={(e) => setManageForm((prev) => ({ ...prev, description: e.target.value }))} />
                </label>
                <label className="campaignField">
                  <span>Banner / cover URL</span>
                  <input value={manageForm.coverImageUrl} onChange={(e) => setManageForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))} />
                </label>
                <button type="submit" className="campaignDetailsPrimaryBtn" disabled={manageBusy}>
                  {manageBusy ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </form>

              <article className="campaignDetailsCard panel-soft">
                <h3 className="campaignDetailsCardTitle">Podglad banera</h3>
                <div className="campaignDetailsInfoRow"><span>Status</span><strong>{campaign.status}</strong></div>
                <div className="campaignDetailsInfoRow"><span>Liczba sesji</span><strong>{sessions.length}</strong></div>
                <div className="campaignDetailsInfoRow"><span>Nieprzeczytane powiadomienia</span><strong>{notifications.filter((item) => !item.read).length}</strong></div>
                <div className="campaignDetailsInfoRow"><span>Nazwa na banerze</span><strong>{manageForm.title || "Brak"}</strong></div>
                <div className="campaignDetailsInfoRow"><span>Opis na banerze</span><strong>{manageForm.description || "Brak opisu"}</strong></div>
              </article>
            </section>
          )}

          {chatModalOpen && selectedSession && (
            <div className="campaignSessionModalOverlay" onMouseDown={() => setChatModalOpen(false)}>
              <div className="campaignSessionModalCard" onMouseDown={(event) => event.stopPropagation()}>
                <div className="campaignSessionModalTop">
                  <div>
                    <div className="campaignSessionModalEyebrow">
                      {selectedSession.status === "ACTIVE" ? "Sesja na żywo" : "Archiwum chatu"}
                    </div>
                    <h3>{selectedSession.title}</h3>
                    <p>
                      {selectedSession.status === "ACTIVE"
                        ? "Pisz wygodnie w osobnym oknie podczas prowadzenia sesji."
                        : "Ta rozmowa jest juz zamknieta i dostepna tylko do podgladu."}
                    </p>
                  </div>
                  <button type="button" className="campaignDetailsGhostBtn" onClick={() => setChatModalOpen(false)}>
                    Zamknij
                  </button>
                </div>

                <div className="campaignSessionModalMeta">
                  <span>{statusLabel(selectedSession.status)}</span>
                  <span>{selectedSession.messageCount} wiadomosci</span>
                  <span>{formatDate(selectedSession.startedAt || selectedSession.scheduledFor, true)}</span>
                </div>

                <div className={`campaignSessionModalBody${selectedSession.status !== "ACTIVE" ? " is-archive" : ""}`}>
                  <div ref={chatFeedRef} className="campaignChatFeed campaignChatFeed--modal">
                    {messages.length === 0 && <div className="campaignDetailsEmpty">Brak wiadomości dla tej sesji.</div>}
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`campaignChatMessage${message.self ? " is-self" : ""}`}
                      >
                        <div className="campaignChatMessage__line">
                          <span
                            className="campaignChatMessage__author"
                            style={{ color: message.authorNickColor || nicknameColor(message.authorDisplayName) }}
                          >
                            {message.authorDisplayName}:
                          </span>
                          <p>{message.content}</p>
                        </div>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                    ))}
                  </div>

                  {selectedSession.status === "ACTIVE" && (
                    <aside className="campaignSessionUtilityDock">
                      <div className="campaignSessionUtilityButtons">
                        <button
                          type="button"
                          className={`campaignSessionUtilityToggle${chatUtilityPanel === "dice" ? " is-active" : ""}`}
                          onClick={() => setChatUtilityPanel((prev) => (prev === "dice" ? "" : "dice"))}
                        >
                          Kości
                        </button>
                        <button
                          type="button"
                          className={`campaignSessionUtilityToggle${chatUtilityPanel === "color" ? " is-active" : ""}`}
                          onClick={() => setChatUtilityPanel((prev) => (prev === "color" ? "" : "color"))}
                        >
                          Kolor nicku
                        </button>
                      </div>

                      {chatUtilityPanel === "dice" && (
                        <div className="campaignSessionUtilityPanel">
                          <div className="campaignSessionUtilityPanel__head">
                            <strong>Szybkie rzuty</strong>
                            <span>Wynik trafi od razu na chat.</span>
                          </div>
                          <div className="campaignQuickRollBar campaignQuickRollBar--panel">
                            {[20, 12, 10, 8, 6, 4].map((sides) => (
                              <button
                                key={sides}
                                type="button"
                                className="campaignQuickRollBtn"
                                disabled={sessionBusy === `roll-${sides}`}
                                onClick={() => handleQuickRoll(sides)}
                              >
                                {sessionBusy === `roll-${sides}` ? `k${sides}...` : `k${sides}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {chatUtilityPanel === "color" && (
                        <div className="campaignSessionUtilityPanel">
                          <div className="campaignSessionUtilityPanel__head">
                            <strong>Kolor nicku</strong>
                            <span>Zmienisz go od razu dla swoich wiadomosci.</span>
                          </div>
                          <div className="campaignChatColorSwatches campaignChatColorSwatches--panel">
                            {CHAT_NICK_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                className={`campaignChatColorSwatch${myChatNickColor === preset ? " is-active" : ""}`}
                                style={{ "--swatch": preset }}
                                onClick={() => handleQuickColorChange(preset)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </aside>
                  )}
                </div>

                {selectedSession.status === "ACTIVE" ? (
                  <>
                    <form className="campaignChatComposer campaignChatComposer--modal" onSubmit={handleSendMessage}>
                      <input
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        placeholder="Napisz wiadomosc dla uczestnikow sesji..."
                      />
                      <button type="submit" className="campaignDetailsPrimaryBtn" disabled={sessionBusy === "message" || !messageDraft.trim()}>
                        {sessionBusy === "message" ? "Wysyłanie..." : "Wyślij"}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="campaignChatComposer campaignChatComposer--modal is-disabled is-readonly">
                    <input
                      value=""
                      readOnly
                      disabled
                      placeholder={
                        selectedSession.status === "PLANNED"
                          ? "Rozpocznij sesję, aby odblokować pisanie na chacie."
                          : "Sesja jest zakonczona, wiec chat pozostaje tylko do podgladu."
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
