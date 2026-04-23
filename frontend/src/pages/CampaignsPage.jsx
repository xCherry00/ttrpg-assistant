import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createCampaign, joinCampaign, listCampaigns } from "../api/campaigns";
import "../styles/campaigns.css";

const SYSTEM_OPTIONS = [
  { value: "dnd5e", label: "D&D 5E" },
  { value: "pf2e", label: "Pathfinder 2E" },
  { value: "coc7e", label: "Call of Cthulhu 7E" },
  { value: "wh4e", label: "Warhammer 4E" },
  { value: "morkborg", label: "Mork Borg" },
  { value: "other", label: "Inny" },
];

function sortCampaigns(campaigns) {
  return [...campaigns].sort((a, b) => {
    const left = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const right = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return left - right;
  });
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function fallbackCover(systemCode) {
  const code = (systemCode || "").toLowerCase();
  if (code.includes("coc")) return "linear-gradient(135deg, #3a4a63 0%, #1f232c 60%, #12151b 100%)";
  if (code.includes("wh")) return "linear-gradient(135deg, #7b3a34 0%, #2b1a19 68%, #131010 100%)";
  if (code.includes("mork")) return "linear-gradient(135deg, #67673d 0%, #212115 62%, #111111 100%)";
  if (code.includes("pf")) return "linear-gradient(135deg, #4b426f 0%, #1f1d30 64%, #0f0f16 100%)";
  return "linear-gradient(135deg, #2f4f86 0%, #223051 52%, #141a2a 100%)";
}

export default function CampaignsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaigns, setCampaigns] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("choose");

  const [createForm, setCreateForm] = useState({
    title: "",
    systemCode: "dnd5e",
    description: "",
    coverImageUrl: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await listCampaigns(token);
        if (!cancelled) {
          setCampaigns(sortCampaigns(Array.isArray(data) ? data : []));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nie udalo sie pobrac kampanii.");
        }
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
    const queryCode = normalizeCode(searchParams.get("code"));
    if (!queryCode) return;
    setJoinCode(queryCode);
    setModalMode("join");
    setModalOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setModalOpen(false);
        setModalMode("choose");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const inviteBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/campaigns`;
  }, []);

  function openModal(mode = "choose") {
    setNotice("");
    setCreateError("");
    setJoinError("");
    setModalMode(mode);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalMode("choose");
    setCreateError("");
    setJoinError("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreateError("");

    const title = createForm.title.trim();
    if (title.length < 3) {
      setCreateError("Nazwa kampanii musi miec co najmniej 3 znaki.");
      return;
    }

    setCreateLoading(true);
    try {
      const created = await createCampaign(token, {
        title,
        systemCode: createForm.systemCode,
        description: createForm.description.trim(),
        coverImageUrl: createForm.coverImageUrl || null,
      });

      setCampaigns((prev) => sortCampaigns([created, ...prev.filter((item) => item.id !== created.id)]));
      setCreateForm((prev) => ({ ...prev, title: "", description: "", coverImageUrl: "" }));
      setNotice("Kampania utworzona. Otrzymales role MG.");
      closeModal();
    } catch (err) {
      setCreateError(err?.message || "Nie udalo sie utworzyc kampanii.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoin(event) {
    event.preventDefault();
    setJoinError("");

    const code = normalizeCode(joinCode);
    if (!code) {
      setJoinError("Podaj kod zaproszenia.");
      return;
    }

    setJoinLoading(true);
    try {
      const response = await joinCampaign(token, code);
      const joinedCampaign = response?.campaign;
      if (joinedCampaign) {
        setCampaigns((prev) => sortCampaigns([joinedCampaign, ...prev.filter((item) => item.id !== joinedCampaign.id)]));
      }
      setNotice(response?.message || "Dolaczono do kampanii.");
      setJoinCode("");
      closeModal();
    } catch (err) {
      setJoinError(err?.message || "Nie udalo sie dolaczyc do kampanii.");
    } finally {
      setJoinLoading(false);
    }
  }

  function onCoverFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCreateError("Wybierz plik obrazu (PNG/JPG/WebP). ");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setCreateError("Maksymalny rozmiar obrazu to 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setCreateForm((prev) => ({ ...prev, coverImageUrl: result }));
      setCreateError("");
    };
    reader.readAsDataURL(file);
  }

  async function copyInvite(campaign) {
    const code = campaign?.inviteCode;
    if (!code) return;

    const link = `${inviteBaseUrl}?code=${code}`;
    const text = `Dolacz do kampanii \"${campaign.title}\": ${link} (kod: ${code})`;

    try {
      await navigator.clipboard.writeText(text);
      setNotice("Skopiowano zaproszenie do schowka.");
    } catch {
      setNotice("Nie udalo sie skopiowac zaproszenia.");
    }
  }

  return (
    <div className="page campaignsPage campaignsPage--tiles">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Kampanie</h1>
          <p className="pageSubtitle">Wybierz kampanie z hubu albo utworz nowa przez kafelek plus.</p>
        </div>
      </div>

      {notice && <div className="campaignToast">{notice}</div>}
      {loading && <div className="campaignState">Ladowanie kampanii...</div>}
      {!loading && error && <div className="campaignError">{error}</div>}

      {!loading && !error && (
        <section className="campaignTiles">
          <button type="button" className="campaignTile campaignTile--add" onClick={() => openModal("choose")}>
            <span className="campaignAddPlus">+</span>
            <span className="campaignAddText">Nowa lub dolacz</span>
          </button>

          {campaigns.map((campaign) => {
            const coverStyle = campaign.coverImageUrl
              ? { backgroundImage: `url(${campaign.coverImageUrl})` }
              : { backgroundImage: fallbackCover(campaign.systemCode) };

            return (
              <article
                key={campaign.id}
                className="campaignTile campaignTile--item"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/campaigns/${campaign.id}`);
                  }
                }}
              >
                <div className="campaignTileCover" style={coverStyle}>
                  <span className="campaignTileRole">{campaign.owner ? "MG" : campaign.myRole}</span>
                </div>
                <div className="campaignTileName">{campaign.title}</div>
                <div className="campaignTileActions">
                  <span className="campaignTileCode">Kod: {campaign.inviteCode}</span>
                  <button
                    type="button"
                    className="campaignTileCopy"
                    onClick={(event) => {
                      event.stopPropagation();
                      copyInvite(campaign);
                    }}
                  >
                    Kopiuj
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modalOpen && (
        <div className="campaignModalOverlay" onMouseDown={closeModal}>
          <div className="campaignModalCard" onMouseDown={(event) => event.stopPropagation()}>
            <div className="campaignModalTop">
              <div className="campaignModalTitle">
                {modalMode === "choose" ? "Wybierz akcje" : modalMode === "create" ? "Utworz kampanie" : "Dolacz do kampanii"}
              </div>
            </div>

            <div className="campaignModalBody">
              {modalMode === "choose" && (
                <div className="campaignChoiceGrid">
                  <button type="button" className="campaignChoiceCard" onClick={() => setModalMode("create")}>
                    <div className="campaignChoiceTitle">Utworz nowa</div>
                    <div className="campaignChoiceText">Wybierz system, nazwe i opcjonalne tlo kampanii.</div>
                  </button>

                  <button type="button" className="campaignChoiceCard" onClick={() => setModalMode("join")}>
                    <div className="campaignChoiceTitle">Dolacz do istniejacej</div>
                    <div className="campaignChoiceText">Podaj kod zaproszenia, aby dolaczyc do kampanii MG.</div>
                  </button>
                </div>
              )}

              {modalMode === "create" && (
                <form className="campaignForm" onSubmit={handleCreate}>
                  <label className="campaignLabel">Nazwa kampanii</label>
                  <input
                    className="campaignInput"
                    value={createForm.title}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="np. Cienie nad Dolina Burz"
                    maxLength={200}
                  />

                  <label className="campaignLabel">System</label>
                  <select
                    className="campaignInput"
                    value={createForm.systemCode}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, systemCode: event.target.value }))}
                  >
                    {SYSTEM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <label className="campaignLabel">Opis (opcjonalnie)</label>
                  <textarea
                    className="campaignInput campaignTextarea"
                    value={createForm.description}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                    maxLength={2000}
                    placeholder="Krotki opis klimatu kampanii"
                  />

                  <label className="campaignLabel">Tlo kampanii (opcjonalnie)</label>
                  <input className="campaignInput" type="file" accept="image/*" onChange={onCoverFileChange} />

                  {createForm.coverImageUrl && (
                    <div className="campaignCoverPreviewWrap">
                      <div className="campaignCoverPreview" style={{ backgroundImage: `url(${createForm.coverImageUrl})` }} />
                      <button
                        type="button"
                        className="campaignRemoveCoverBtn"
                        onClick={() => setCreateForm((prev) => ({ ...prev, coverImageUrl: "" }))}
                      >
                        Usun tlo
                      </button>
                    </div>
                  )}

                  {createError && <div className="campaignError">{createError}</div>}

                  <div className="campaignModalActionsRow">
                    <button type="button" className="campaignGhostBtn" onClick={() => setModalMode("choose")}>
                      Wstecz
                    </button>
                    <button type="submit" className="campaignActionBtn" disabled={createLoading}>
                      {createLoading ? "Tworzenie..." : "Utworz"}
                    </button>
                  </div>
                </form>
              )}

              {modalMode === "join" && (
                <form className="campaignForm" onSubmit={handleJoin}>
                  <label className="campaignLabel">Kod zaproszenia</label>
                  <input
                    className="campaignInput"
                    value={joinCode}
                    onChange={(event) => setJoinCode(normalizeCode(event.target.value))}
                    placeholder="np. A7K9P2QW"
                    maxLength={20}
                  />

                  {joinError && <div className="campaignError">{joinError}</div>}

                  <div className="campaignModalActionsRow">
                    <button type="button" className="campaignGhostBtn" onClick={() => setModalMode("choose")}>
                      Wstecz
                    </button>
                    <button type="submit" className="campaignActionBtn campaignActionBtnJoin" disabled={joinLoading}>
                      {joinLoading ? "Dolaczanie..." : "Dolacz"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
