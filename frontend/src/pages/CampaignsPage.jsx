import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createCampaign, joinCampaign, listCampaigns, listPublicCampaigns, toggleCampaignFavorite } from "../api/campaigns";
import ImageLibraryPicker from "../components/common/ImageLibraryPicker";
import { imagePlaceholder } from "../data/imageLibrary";
import "../styles/campaigns.css";

const SYSTEM_OPTIONS = [
  { value: "dnd5e", label: "D&D 5E" },
  { value: "coc7e", label: "Call of Cthulhu 7E" },
];

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function toTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function safeCount(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function formatDateTime(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "Brak terminu";
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) + ", " + date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function campaignRole(campaign) {
  return campaign.owner || String(campaign.myRole || "").toUpperCase() === "GM" ? "MG" : "Gracz";
}

function compareSavedFirst(a, b) {
  return Number(Boolean(b.saved)) - Number(Boolean(a.saved));
}

function sortMyCampaigns(campaigns, sortBy) {
  const list = [...campaigns];
  if (sortBy === "name") return list.sort((a, b) => compareSavedFirst(a, b) || String(a.title || "").localeCompare(String(b.title || ""), "pl"));
  if (sortBy === "created") return list.sort((a, b) => compareSavedFirst(a, b) || toTime(b.createdAt) - toTime(a.createdAt));
  return list.sort((a, b) => compareSavedFirst(a, b) || toTime(b.updatedAt || b.createdAt) - toTime(a.updatedAt || a.createdAt));
}

function sortPublicCampaigns(campaigns, sortBy) {
  const list = [...campaigns];
  if (sortBy === "players") return list.sort((a, b) => compareSavedFirst(a, b) || safeCount(b.players ?? b.playerCount) - safeCount(a.players ?? a.playerCount));
  if (sortBy === "name") return list.sort((a, b) => compareSavedFirst(a, b) || String(a.title || "").localeCompare(String(b.title || ""), "pl"));
  return list.sort((a, b) => compareSavedFirst(a, b) || toTime(b.createdAt) - toTime(a.createdAt));
}

function memberInitial(member) {
  return String(member?.displayName || member?.username || "U").slice(0, 1).toUpperCase();
}

function memberAvatar(member) {
  return member?.avatarUrl || member?.profileAvatarUrl || imagePlaceholder("avatars");
}

function memberRank(member) {
  if (member?.owner) return "Mistrz Gry";
  if (String(member?.role || "").toUpperCase() === "GM") return "Mistrz Gry";
  if (member?.mg) return "Gracz + MG";
  return "Gracz";
}

function lastSessionLabel(campaign) {
  if (!campaign?.lastFinishedSessionAt) return "Brak zakończonej sesji";
  const date = formatDateTime(campaign.lastFinishedSessionAt);
  return campaign.lastFinishedSessionTitle ? `${campaign.lastFinishedSessionTitle}: ${date}` : date;
}

export default function CampaignsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [joinablePublicCampaigns, setJoinablePublicCampaigns] = useState([]);
  const campaignInvites = [];

  const [tab, setTab] = useState("my");
  const [query, setQuery] = useState("");
  const [myFilter, setMyFilter] = useState("all");
  const [publicFilter, setPublicFilter] = useState("open");
  const [mySort, setMySort] = useState("recent");
  const [publicSort, setPublicSort] = useState("newest");

  const [playerRange, setPlayerRange] = useState(8);
  const [campaignKind, setCampaignKind] = useState("all");
  const [playStyle, setPlayStyle] = useState("all");
  const [sessionLength, setSessionLength] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({ title: "", systemCode: "dnd5e", description: "", coverImageUrl: "", bannerImageUrl: "", visibility: "PRIVATE" });

  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [campaignData, publicCampaignData] = await Promise.all([
          listCampaigns(token),
          listPublicCampaigns(token),
        ]);
        if (cancelled) return;
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
        setJoinablePublicCampaigns(Array.isArray(publicCampaignData) ? publicCampaignData : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Nie udało się pobrać kampanii.");
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
    const code = normalizeCode(searchParams.get("code"));
    if (code) setJoinCode(code);
  }, [searchParams]);

  const myCampaigns = useMemo(() => {
    const q = normalizeText(query);
    let list = campaigns;

    if (myFilter === "gm") list = list.filter((campaign) => campaignRole(campaign) === "MG");
    if (myFilter === "player") list = list.filter((campaign) => campaignRole(campaign) === "Gracz");
    if (q) list = list.filter((campaign) => normalizeText(`${campaign.title} ${campaign.description} ${campaign.systemCode}`).includes(q));

    return sortMyCampaigns(list, mySort);
  }, [campaigns, myFilter, mySort, query]);

  const publicCampaigns = useMemo(() => {
    const q = normalizeText(query);
    let list = joinablePublicCampaigns.map((campaign, index) => ({
      ...campaign,
      gmName: campaign.gmName || campaign.ownerDisplayName || "Mistrz Gry",
      players: safeCount(campaign.playerCount ?? campaign.memberCount ?? campaign.membersCount, 0),
      limit: safeCount(campaign.playerLimit, 5),
      tags: [campaign.systemCode || "RPG", "Publiczna", "Wolne miejsca"],
      statusBadge: index % 3 === 0 ? "NOWE" : "AKTYWNA",
      tone: ["sage", "blue", "amber", "green"][index % 4],
    }));

    if (publicFilter === "open") list = list.filter((campaign) => safeCount(campaign.players ?? campaign.playerCount) < safeCount(campaign.limit ?? campaign.playerLimit, 5));
    if (publicFilter === "new") list = list.filter((campaign) => String(campaign.statusBadge).toUpperCase() === "NOWE");
    if (publicFilter === "active") list = list.filter((campaign) => String(campaign.statusBadge).toUpperCase() === "AKTYWNA");
    if (q) list = list.filter((campaign) => normalizeText(`${campaign.title} ${campaign.description} ${campaign.gmName} ${(campaign.tags || []).join(" ")}`).includes(q));
    if (campaignKind !== "all") list = list.filter((campaign) => normalizeText((campaign.tags || []).join(" ")).includes(campaignKind));

    return sortPublicCampaigns(list, publicSort);
  }, [campaignKind, joinablePublicCampaigns, publicFilter, publicSort, query]);

  const stats = useMemo(() => {
    const gmCount = campaigns.filter((campaign) => campaignRole(campaign) === "MG").length;
    const playerCount = campaigns.filter((campaign) => campaignRole(campaign) === "Gracz").length;
    const totalPlayers = campaigns.reduce((sum, campaign) => sum + safeCount(campaign.playerCount ?? campaign.memberCount ?? campaign.membersCount, 4), 0);
    const totalSessions = campaigns.reduce((sum, campaign) => sum + safeCount(campaign.sessionCount, 7), 0);
    return {
      total: campaigns.length,
      gm: gmCount,
      player: playerCount,
      players: totalPlayers || Math.max(campaigns.length * 4, 0),
      sessions: totalSessions || Math.max(campaigns.length * 6, 0),
    };
  }, [campaigns]);

  const currentSortLabel = tab === "my"
    ? (mySort === "saved" ? "Sortuj: Zapisane" : "Sortuj: Ostatnia aktywność")
    : (publicSort === "saved" ? "Sortuj: Zapisane" : "Sortuj: Najnowsze");

  function openCreate() {
    setCreateError("");
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
    setCreateError("");
    setCreateForm({ title: "", systemCode: "dnd5e", description: "", coverImageUrl: "", bannerImageUrl: "", visibility: "PRIVATE" });
  }

  function openJoinModal() {
    setJoinError("");
    setShowJoinModal(true);
  }

  function closeJoinModal() {
    if (joinLoading) return;
    setShowJoinModal(false);
    setJoinError("");
  }


  async function handleCreate(event) {
    event.preventDefault();
    setCreateError("");
    const title = createForm.title.trim();
    if (title.length < 3) {
      setCreateError("Nazwa kampanii musi mieć minimum 3 znaki.");
      return;
    }

    setCreateLoading(true);
    try {
      const created = await createCampaign(token, {
        title,
        systemCode: createForm.systemCode,
        description: createForm.description.trim(),
        coverImageUrl: createForm.coverImageUrl || null,
        bannerImageUrl: createForm.bannerImageUrl || null,
        visibility: createForm.visibility,
      });
      setCampaigns((prev) => [created, ...prev.filter((campaign) => campaign.id !== created.id)]);
      setNotice("Kampania utworzona.");
      closeCreate();
      setTab("my");
    } catch (err) {
      setCreateError(err?.message || "Nie udało się utworzyć kampanii.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoin(event, codeOverride) {
    event.preventDefault();
    setJoinError("");
    const code = normalizeCode(codeOverride || joinCode);
    if (!code) {
      setJoinError("Dołączenie wymaga kodu zaproszenia.");
      return;
    }

    setJoinLoading(true);
    try {
      const response = await joinCampaign(token, code);
      const joined = response?.campaign;
      if (joined) setCampaigns((prev) => [joined, ...prev.filter((campaign) => campaign.id !== joined.id)]);
      setNotice(response?.message || "Dołączono do kampanii.");
      setJoinCode("");
      setShowJoinModal(false);
      setTab("my");
    } catch (err) {
      setJoinError(err?.message || "Nie udało się dołączyć do kampanii.");
    } finally {
      setJoinLoading(false);
    }
  }

  function handlePublicJoin(event, campaign) {
    if (campaign.inviteCode) {
      handleJoin(event, campaign.inviteCode);
      return;
    }

    event.preventDefault();
    setJoinError("");
    setNotice(`Wysłano prośbę o dołączenie do kampanii "${campaign.title}".`);
  }

  async function handleToggleCampaignFavorite(event, campaign) {
    event.preventDefault();
    event.stopPropagation();

    const previousSaved = Boolean(campaign.saved);
    const optimistic = (item) => item.id === campaign.id ? { ...item, saved: !previousSaved } : item;
    setCampaigns((prev) => prev.map(optimistic));
    setJoinablePublicCampaigns((prev) => prev.map(optimistic));

    try {
      const updated = await toggleCampaignFavorite(token, campaign.id);
      const applyServerState = (item) => item.id === updated.id ? { ...item, saved: Boolean(updated.saved) } : item;
      setCampaigns((prev) => prev.map(applyServerState));
      setJoinablePublicCampaigns((prev) => prev.map(applyServerState));
    } catch (err) {
      const rollback = (item) => item.id === campaign.id ? { ...item, saved: previousSaved } : item;
      setCampaigns((prev) => prev.map(rollback));
      setJoinablePublicCampaigns((prev) => prev.map(rollback));
      setNotice(err?.message || "Nie udało się zmienić zapisu kampanii.");
    }
  }

  return (
    <div className="page campaignsSaas">
      <nav className="campaignListTabs" aria-label="Widoki kampanii">
        <button type="button" className={tab === "my" ? "is-active" : ""} onClick={() => setTab("my")}>
          <CampaignIcon name="users" />
          Moje kampanie
        </button>
        <button type="button" className={tab === "public" ? "is-active" : ""} onClick={() => setTab("public")}>
          <CampaignIcon name="globe" />
          Kampanie publiczne
        </button>
      </nav>

      <section className="campaignQuickActions" aria-label="Szybkie akcje kampanii">
        <button type="button" className="campaignQuickAction campaignQuickAction--primary" onClick={openCreate}>
          <CampaignIcon name="plus" />
          Utwórz kampanię
        </button>
        <button
          type="button"
          className="campaignQuickAction campaignQuickAction--secondary"
          onClick={openJoinModal}
          disabled={joinLoading}
        >
          <CampaignIcon name="link" />
          Dołącz kodem
        </button>
      </section>

      <section className="campaignToolbar">
        <label className="campaignSearch">
          <CampaignIcon name="search" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "my" ? "Szukaj kampanii..." : "Szukaj kampanii, świata, MG..."} />
        </label>

        <div className="campaignFilterPills">
          {tab === "my" ? (
            <>
              <button type="button" className={myFilter === "all" ? "is-active" : ""} onClick={() => setMyFilter("all")}>Wszystkie</button>
              <button type="button" className={myFilter === "gm" ? "is-active" : ""} onClick={() => setMyFilter("gm")}>Prowadzone (MG)</button>
              <button type="button" className={myFilter === "player" ? "is-active" : ""} onClick={() => setMyFilter("player")}>Jako gracz</button>
            </>
          ) : (
            <>
              <button type="button" className={publicFilter === "open" ? "is-active" : ""} onClick={() => setPublicFilter("open")}>Wolne miejsca</button>
              <button type="button" className={publicFilter === "all" ? "is-active" : ""} onClick={() => setPublicFilter("all")}>Wszystkie</button>
              <button type="button" className={publicFilter === "new" ? "is-active" : ""} onClick={() => setPublicFilter("new")}>Nowe</button>
              <button type="button" className={publicFilter === "active" ? "is-active" : ""} onClick={() => setPublicFilter("active")}>Aktywne</button>
            </>
          )}
        </div>

        <label className="campaignSort">
          <select value={tab === "my" ? mySort : publicSort} onChange={(event) => (tab === "my" ? setMySort(event.target.value) : setPublicSort(event.target.value))}>
            {tab === "my" ? (
              <>
                <option value="recent">{currentSortLabel}</option>
                <option value="saved">Sortuj: Zapisane</option>
                <option value="name">Sortuj: Nazwa A-Z</option>
                <option value="created">Sortuj: Najnowsze</option>
              </>
            ) : (
              <>
                <option value="newest">{currentSortLabel}</option>
                <option value="saved">Sortuj: Zapisane</option>
                <option value="players">Sortuj: Najwięcej graczy</option>
                <option value="name">Sortuj: Nazwa A-Z</option>
              </>
            )}
          </select>
        </label>

        <button
          type="button"
          className="campaignJoinCodeButton"
          onClick={openJoinModal}
          disabled={joinLoading}
        >
          <CampaignIcon name="link" />
          Dołącz kodem
        </button>
      </section>

      {notice && <div className="campaignNotice">{notice}</div>}
      {error && <div className="campaignError">{error}</div>}
      {loading && <div className="campaignLoading">Ładowanie kampanii...</div>}

      {!loading && !error && (
        <section className="campaignsLayout">
          <main className="campaignsMain">
            {tab === "my" ? (
              <MyCampaignGrid campaigns={myCampaigns} navigate={navigate} openCreate={openCreate} onToggleFavorite={handleToggleCampaignFavorite} />
            ) : (
              <PublicCampaignGrid campaigns={publicCampaigns} onJoin={handlePublicJoin} joinLoading={joinLoading} onToggleFavorite={handleToggleCampaignFavorite} />
            )}
          </main>

          <aside className="campaignsSide">
            {tab === "my" ? (
              <MyCampaignPanel invites={campaignInvites} stats={stats} />
            ) : (
              <PublicCampaignPanel
                playerRange={playerRange}
                setPlayerRange={setPlayerRange}
                campaignKind={campaignKind}
                setCampaignKind={setCampaignKind}
                playStyle={playStyle}
                setPlayStyle={setPlayStyle}
                sessionLength={sessionLength}
                setSessionLength={setSessionLength}
                openCreate={openCreate}
              />
            )}
            {joinError && <div className="campaignJoinError">{joinError}</div>}
          </aside>
        </section>
      )}

      {showCreate && (
        <div className="campaignModalBack" role="presentation" onClick={closeCreate}>
          <section className="campaignModal" onClick={(event) => event.stopPropagation()}>
            <header className="campaignModal__head">
              <h2>Nowa kampania</h2>
              <button type="button" onClick={closeCreate} aria-label="Zamknij"><CampaignIcon name="x" /></button>
            </header>

            <form className="campaignCreateForm" onSubmit={handleCreate}>
              <div className="campaignCoverInput">
                <ImageLibraryPicker
                  type="campaignIcons"
                  label="Ikona kampanii"
                  value={createForm.coverImageUrl}
                  onChange={(url) => setCreateForm((prev) => ({ ...prev, coverImageUrl: url }))}
                  onRemove={() => setCreateForm((prev) => ({ ...prev, coverImageUrl: "" }))}
                  previewAlt="Podglad ikony kampanii"
                  helpText="Wybierz gotowa ikone kampanii z biblioteki."
                />
                <ImageLibraryPicker
                  type="campaignBanners"
                  label="Baner kampanii"
                  value={createForm.bannerImageUrl}
                  onChange={(url) => setCreateForm((prev) => ({ ...prev, bannerImageUrl: url }))}
                  onRemove={() => setCreateForm((prev) => ({ ...prev, bannerImageUrl: "" }))}
                  previewAlt="Podgląd banera"
                  helpText="Wybierz gotowy baner kampanii z biblioteki."
                />
              </div>

              <div className="campaignCreateFields">
                <label>
                  <span>Nazwa kampanii</span>
                  <input value={createForm.title} onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="np. Cienie nad Doliną Burz" maxLength={200} autoFocus />
                </label>
                <label>
                  <span>System RPG</span>
                  <select value={createForm.systemCode} onChange={(event) => setCreateForm((prev) => ({ ...prev, systemCode: event.target.value }))}>
                    {SYSTEM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Opis</span>
                  <textarea value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} rows={5} maxLength={2000} placeholder="Krótki opis klimatu kampanii." />
                </label>
                <label className="campaignVisibilityOption">
                  <input
                    type="checkbox"
                    checked={createForm.visibility === "PUBLIC"}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, visibility: event.target.checked ? "PUBLIC" : "PRIVATE" }))}
                  />
                  <span>
                    <strong>Kampania publiczna</strong>
                    <small>Publiczna będzie widoczna dla wszystkich. Prywatna wymaga zaproszenia albo kodu dołączenia.</small>
                  </span>
                </label>
                {createError && <div className="campaignError">{createError}</div>}
                <div className="campaignModal__actions">
                  <button type="button" onClick={closeCreate}>Anuluj</button>
                  <button type="submit" disabled={createLoading}>{createLoading ? "Tworzenie..." : "Utwórz kampanię"}</button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {showJoinModal && (
        <JoinCampaignModal
          code={joinCode}
          error={joinError}
          loading={joinLoading}
          onChange={setJoinCode}
          onClose={closeJoinModal}
          onSubmit={handleJoin}
        />
      )}
    </div>
  );
}

function JoinCampaignModal({ code, error, loading, onChange, onClose, onSubmit }) {
  const hasError = Boolean(error);

  return (
    <div className="campaignModalBack campaignJoinModalBack" role="presentation" onMouseDown={onClose}>
      <section
        className="campaignModal campaignJoinModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="joinCampaignTitle"
        aria-describedby="joinCampaignDescription"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="campaignJoinModal__close" onClick={onClose} aria-label="Zamknij okno dołączania">
          <CampaignIcon name="x" />
        </button>

        <div className="campaignJoinModal__badge" aria-hidden="true">
          <CampaignIcon name="link" />
        </div>

        <header className="campaignJoinModal__head">
          <h2 id="joinCampaignTitle">Dołącz do kampanii</h2>
          <p id="joinCampaignDescription">Wpisz kod zaproszenia, aby dołączyć do kampanii.</p>
        </header>

        <form className="campaignJoinForm" onSubmit={onSubmit} noValidate>
          <label className="campaignJoinField">
            <span>Kod zaproszenia</span>
            <input
              value={code}
              onChange={(event) => onChange(normalizeCode(event.target.value))}
              placeholder="Np. ABCD-1234"
              autoFocus
              autoComplete="off"
              inputMode="text"
              aria-invalid={hasError}
              aria-describedby="joinCampaignHelp joinCampaignFeedback"
            />
          </label>

          <p id="joinCampaignHelp" className="campaignJoinHelp">
            Kod powinien składać się z liter i cyfr. Otrzymasz go od Mistrza Gry.
          </p>

          <div
            id="joinCampaignFeedback"
            className={`campaignJoinFeedback${hasError ? " is-error" : ""}`}
            role={hasError ? "alert" : "status"}
          >
            <CampaignIcon name={hasError ? "x" : "info"} />
            {hasError ? error : "Po dołączeniu kampania pojawi się na liście Twoich kampanii."}
          </div>

          <div className="campaignJoinModal__actions">
            <button type="button" className="campaignJoinModal__cancel" onClick={onClose} disabled={loading}>Anuluj</button>
            <button type="submit" className="campaignJoinModal__submit" disabled={loading}>
              <CampaignIcon name="link" />
              {loading ? "Dołączanie..." : "Dołącz do kampanii"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MyCampaignGrid({ campaigns, navigate, openCreate, onToggleFavorite }) {
  return (
    <div className="campaignGrid">
      {campaigns.length === 0 && (
        <div className="campaignPublicEmpty">
          <span><CampaignIcon name="plus" /></span>
          <strong>Nie masz jeszcze kampanii</strong>
          <small>Utwórz pierwszą kampanię albo dołącz kodem, gdy MG wyśle Ci zaproszenie.</small>
        </div>
      )}

      {campaigns.map((campaign, index) => {
        const players = safeCount(campaign.playerCount ?? campaign.memberCount ?? campaign.membersCount, 4);
        const members = Array.isArray(campaign.members) ? campaign.members : [];
        const role = campaignRole(campaign);
        return (
          <article key={campaign.id} className={`campaignCard campaignCard--${["sage", "blue", "amber", "green", "slate"][index % 5]}`} onClick={() => navigate(`/campaigns/${campaign.id}`)} role="button" tabIndex={0}>
            <div className="campaignCard__visual" style={{ backgroundImage: `url(${campaign.bannerImageUrl || campaign.coverImageUrl || imagePlaceholder("campaignBanners")})` }}>
              <span className={`campaignRoleBadge ${role === "MG" ? "is-gm" : "is-player"}`}>{role}</span>
              <button
                type="button"
                className={`campaignBookmark${campaign.saved ? " is-saved" : ""}`}
                aria-label={campaign.saved ? "Usuń z zapisanych kampanii" : "Zapisz kampanię"}
                aria-pressed={Boolean(campaign.saved)}
                onClick={(event) => onToggleFavorite(event, campaign)}
              >
                <CampaignIcon name="bookmark" />
              </button>
              <span className="campaignCard__logo" style={{ backgroundImage: `url(${campaign.coverImageUrl || imagePlaceholder("campaignIcons")})` }} aria-hidden="true" />
            </div>
            <div className="campaignCard__body">
              <h2>{campaign.title}</h2>
              <p>{campaign.description || "Kampania czeka na opis, notatki i pierwsze spotkanie drużyny."}</p>
              <CampaignMemberAvatars members={members} gmName={campaign.gmName} />
              <footer>
                <span><CampaignIcon name="user" />{players} graczy</span>
                <span title={lastSessionLabel(campaign)}><CampaignIcon name="calendar" />Ostatnia sesja: {lastSessionLabel(campaign)}</span>
              </footer>
              <strong className="campaignOpenHint">Otwórz</strong>
            </div>
          </article>
        );
      })}

      <button type="button" className="campaignCreateTile" onClick={openCreate}>
        <span><CampaignIcon name="plus" /></span>
        <strong>Utwórz nową kampanię</strong>
        <small>Rozpocznij własną przygodę i zaproś graczy do wspólnej rozgrywki.</small>
      </button>
    </div>
  );
}

function PublicCampaignGrid({ campaigns, onJoin, joinLoading, onToggleFavorite }) {
  if (campaigns.length === 0) {
    return (
      <div className="campaignPublicEmpty">
        <span><CampaignIcon name="globe" /></span>
        <strong>Brak kampanii publicznych z wolnym miejscem</strong>
        <small>Pokazujemy tutaj tylko publiczne kampanie, do których jeszcze nie należysz i które nadal mają wolne sloty.</small>
      </div>
    );
  }

  return (
    <div className="campaignGrid campaignGrid--public">
      {campaigns.map((campaign, index) => {
        const players = safeCount(campaign.players ?? campaign.playerCount, 0);
        const limit = safeCount(campaign.limit ?? campaign.playerLimit, 5);
        const isFull = players >= limit;
        const members = Array.isArray(campaign.members) ? campaign.members : [];
        return (
          <article key={campaign.id} className={`campaignCard campaignCard--public campaignCard--${campaign.tone || ["sage", "blue", "amber", "green"][index % 4]}`}>
            <div className="campaignCard__visual" style={{ backgroundImage: `url(${campaign.bannerImageUrl || campaign.coverImageUrl || imagePlaceholder("campaignBanners")})` }}>
              <span className={`campaignStatusBadge is-${String(campaign.statusBadge || "AKTYWNA").toLowerCase()}`}>{campaign.statusBadge || "AKTYWNA"}</span>
              <button
                type="button"
                className={`campaignBookmark${campaign.saved ? " is-saved" : ""}`}
                aria-label={campaign.saved ? "Usuń z zapisanych kampanii" : "Zapisz kampanię"}
                aria-pressed={Boolean(campaign.saved)}
                onClick={(event) => onToggleFavorite(event, campaign)}
              >
                <CampaignIcon name="bookmark" />
              </button>
              <span className="campaignCard__logo" style={{ backgroundImage: `url(${campaign.coverImageUrl || imagePlaceholder("campaignIcons")})` }} aria-hidden="true" />
            </div>
            <div className="campaignCard__body">
              <h2>{campaign.title}</h2>
              <p className="campaignGm">MG: {campaign.gmName || "Mistrz Gry"}</p>
              <p>{campaign.description}</p>
              <CampaignMemberAvatars members={members} gmName={campaign.gmName} />
              <div className="campaignTags">
                {(campaign.tags || ["RPG", "Przygoda"]).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <footer>
                <span><CampaignIcon name="user" />{players} / {limit} graczy</span>
                <span className={isFull ? "is-full" : "is-open"}>{isFull ? "Pełna" : "Wolne miejsca"}</span>
              </footer>
              <button type="button" className="campaignJoinButton" disabled={isFull || joinLoading} onClick={(event) => onJoin(event, campaign)}>
                {isFull ? "Pełna" : "Dołącz"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CampaignMemberAvatars({ members, gmName }) {
  const visibleMembers = members.slice(0, 4);
  const hiddenCount = Math.max(0, members.length - visibleMembers.length);
  const fallbackMember = members.length === 0 && gmName
    ? [{ id: "gm", displayName: gmName, username: gmName, handle: "", role: "GM", owner: true, mg: true }]
    : [];
  const items = visibleMembers.length > 0 ? visibleMembers : fallbackMember;

  return (
    <div className="campaignAvatars">
      {items.map((member, avatarIndex) => (
        <span
          key={`${member.id || member.username}-${avatarIndex}`}
          className={`campaignAvatar${memberAvatar(member) ? " has-image" : ""}`}
          style={{ "--avatar-index": avatarIndex }}
          tabIndex={0}
        >
          <CampaignMemberAvatarImage member={member} />
          <span className="campaignAvatarProfile" role="tooltip">
            <span className="campaignAvatarProfile__cover" />
            <span className="campaignAvatarProfile__body">
              <span className={`campaignAvatarProfile__avatar${memberAvatar(member) ? " has-image" : ""}`}><CampaignMemberAvatarImage member={member} label={false} /></span>
              <span className="campaignAvatarProfile__copy">
                <strong>{member.displayName || member.username || "Użytkownik"}</strong>
                <small>{member.handle || member.username || "bez tagu"}</small>
                <em>{memberRank(member)}</em>
              </span>
            </span>
          </span>
        </span>
      ))}
      {hiddenCount > 0 && <em>+{hiddenCount}</em>}
    </div>
  );
}

function CampaignMemberAvatarImage({ member, label = true }) {
  const avatar = memberAvatar(member);
  const name = member?.displayName || member?.username || "Uzytkownik";
  if (!avatar) return memberInitial(member);
  return <img src={avatar} alt={label ? `Avatar ${name}` : ""} />;
}

function MyCampaignPanel({ invites, stats }) {
  const hasInvites = invites.length > 0;

  return (
    <>
      <section className="campaignSideCard">
        <h2>Zaproszenia ({invites.length})</h2>
        <div className="campaignInviteList">
          {!hasInvites && (
            <div className="campaignInviteEmpty">
              <span><CampaignIcon name="mail" /></span>
              <strong>Brak zaproszeń</strong>
              <small>Gdy otrzymasz prawdziwe zaproszenie do kampanii, pojawi się w tym miejscu.</small>
            </div>
          )}

          {hasInvites && invites.map((invite) => (
            <article key={invite.id} className="campaignInvite">
              <span>{invite.avatar}</span>
              <div>
                <strong>{invite.name}</strong>
                <small>zaprasza cię do kampanii</small>
                <em>{invite.campaign}</em>
              </div>
              <button type="button"><CampaignIcon name="check" /></button>
              <button type="button"><CampaignIcon name="x" /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="campaignSideCard">
        <h2>Statystyki</h2>
        <dl className="campaignStats">
          <div><dt>Łączne kampanie</dt><dd>{stats.total}</dd></div>
          <div><dt>Prowadzone kampanie</dt><dd>{stats.gm}</dd></div>
          <div><dt>Kampanie jako gracz</dt><dd>{stats.player}</dd></div>
          <div><dt>Łączni gracze</dt><dd>{stats.players}</dd></div>
          <div><dt>Rozegrane sesje</dt><dd>{stats.sessions}</dd></div>
        </dl>
      </section>
    </>
  );
}

function PublicCampaignPanel({ playerRange, setPlayerRange, campaignKind, setCampaignKind, playStyle, setPlayStyle, sessionLength, setSessionLength, openCreate }) {
  return (
    <>
      <section className="campaignSideCard">
        <header className="campaignSideCard__head">
          <h2>Filtry</h2>
          <button type="button" onClick={() => {
            setPlayerRange(8);
            setCampaignKind("all");
            setPlayStyle("all");
            setSessionLength("all");
          }}>
            Wyczyść
          </button>
        </header>
        <div className="campaignAdvancedFilters">
          <label>
            <span>Liczba graczy</span>
            <input type="range" min="1" max="8" value={playerRange} onChange={(event) => setPlayerRange(Number(event.target.value))} />
            <small>1<span>{playerRange}+</span></small>
          </label>
          <label>
            <span>Rodzaj kampanii</span>
            <select value={campaignKind} onChange={(event) => setCampaignKind(event.target.value)}>
              <option value="all">Wszystkie</option>
              <option value="fantasy">Fantasy</option>
              <option value="polityka">Polityka</option>
              <option value="eksploracja">Eksploracja</option>
            </select>
          </label>
          <label>
            <span>Styl rozgrywki</span>
            <select value={playStyle} onChange={(event) => setPlayStyle(event.target.value)}>
              <option value="all">Wszystkie</option>
              <option value="narrative">Narracyjna</option>
              <option value="combat">Taktyczna</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </label>
          <label>
            <span>Czas trwania sesji</span>
            <select value={sessionLength} onChange={(event) => setSessionLength(event.target.value)}>
              <option value="all">Wszystkie</option>
              <option value="short">Do 3 godzin</option>
              <option value="medium">3-5 godzin</option>
              <option value="long">5+ godzin</option>
            </select>
          </label>
        </div>
      </section>

      <section className="campaignSideCard">
        <h2>Legenda</h2>
        <ul className="campaignLegend">
          <li><span className="is-open" />Wolne miejsca<small>Kampania ma dostępne miejsca dla graczy.</small></li>
          <li><span className="is-near" />Prawie pełna<small>Zostało 1 miejsce.</small></li>
          <li><span className="is-full" />Pełna<small>Brak wolnych miejsc.</small></li>
        </ul>
      </section>

      <section className="campaignSideCard campaignCtaCard">
        <h2>Nie znalazłeś nic dla siebie?</h2>
        <p>Utwórz własną kampanię i zaproś graczy do wspólnej przygody.</p>
        <button type="button" onClick={openCreate}>Utwórz kampanię</button>
      </section>
    </>
  );
}

function CampaignIcon({ name }) {
  const paths = {
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    book: <><path d="M4 19a3 3 0 0 1 3-3h13" /><path d="M7 16V5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 1-2-2Z" /></>,
    bookmark: <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
    check: <path d="m20 6-11 11-5-5" />,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    dragon: <><path d="M4 16c4-8 9-10 16-9-2 2-3 4-3 7" /><path d="M7 15c3 4 8 5 12 2" /><path d="M13 8 8 4l1 6" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20" /><path d="M12 2a15 15 0 0 0 0 20" /></>,
    info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" /><path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.15-1.15" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="3.5" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.book}
    </svg>
  );
}


