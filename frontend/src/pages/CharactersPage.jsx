import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  deleteCharacter,
  exportCharacter,
  getCharacter,
  importCharacter,
  listCharacters,
  quickCreateCharacter,
  quickCreateCocCharacter,
  updateCharacterSheet,
} from "../api/characters";
import { listCampaigns } from "../api/campaigns";
import CharacterCreatorRouter from "../components/characters/CharacterCreatorRouter";
import CharacterSheetRouter from "../components/characters/CharacterSheetRouter";
import CharacterSystemSelector from "../components/characters/CharacterSystemSelector";
import ImageLibraryPicker from "../components/common/ImageLibraryPicker";
import { imagePlaceholder } from "../data/imageLibrary";
import "../styles/characters.css";

const TABS = [
  { key: "basic", label: "Podstawowe" },
  { key: "attributes", label: "Atrybuty" },
  { key: "skills", label: "Umiejętności" },
  { key: "inventory", label: "Ekwipunek" },
  { key: "special", label: "Zaklęcia / Zdolności" },
  { key: "history", label: "Historia" },
];

const CHARACTER_DRAFT_STORAGE = "ttrpg_character_sheet_drafts_v1";

function safeText(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function readCharacterDrafts() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CHARACTER_DRAFT_STORAGE) || "{}") || {};
  } catch {
    return {};
  }
}

function writeCharacterDraft(characterId, draft) {
  if (typeof window === "undefined" || !characterId) return;
  try {
    const drafts = readCharacterDrafts();
    drafts[String(characterId)] = draft;
    window.localStorage.setItem(CHARACTER_DRAFT_STORAGE, JSON.stringify(drafts));
  } catch {
    // Local draft persistence is best-effort only.
  }
}

function linesToEntries(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes(":") ? ":" : line.includes("-") ? "-" : null;
      if (!separator) return { label: line, value: "" };
      const [label, ...rest] = line.split(separator);
      return { label: label.trim(), value: rest.join(separator).trim() };
    })
    .filter((item) => hasValue(item.label) || hasValue(item.value));
}

function entriesToLines(entries) {
  return entries
    .map((item) => `${item.label}${hasValue(item.value) ? `: ${item.value}` : ""}`)
    .join("\n");
}

function titleCaseLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function systemLabel(systemCode) {
  const code = String(systemCode || "").toLowerCase();
  if (code === "dnd5e") return "D&D 5e";
  if (code === "coc7e") return "COC 7e";
  return safeText(systemCode, "System");
}

function getSheet(character) {
  return character?.sheetJson && typeof character.sheetJson === "object" ? character.sheetJson : {};
}

function getIdentity(character) {
  const sheet = getSheet(character);
  return sheet.identity && typeof sheet.identity === "object" ? sheet.identity : {};
}

function getCharacterName(character) {
  const identity = getIdentity(character);
  return safeText(character?.name || identity.name || [identity.firstName, identity.lastName].filter(Boolean).join(" "), "Bez nazwy");
}

function getPortrait(character) {
  const identity = getIdentity(character);
  return character?.portraitUrl || identity.portraitUrl || "";
}

function getRace(character) {
  const identity = getIdentity(character);
  return character?.raceName || identity.race || identity.ancestry || identity.species || "";
}

function getProfession(character) {
  const identity = getIdentity(character);
  return character?.className || identity.class || identity.profession || identity.occupation || "";
}

function getLevel(character) {
  const identity = getIdentity(character);
  return character?.level ?? identity.level ?? "";
}

function getCampaign(character) {
  const identity = getIdentity(character);
  return character?.campaignName || character?.campaignTitle || character?.campaign || identity.campaignName || "";
}

function getCampaignOptionLabel(campaign) {
  return campaign?.title || campaign?.name || campaign?.campaignName || "";
}

function getCharacterId(character) {
  return character?.id ?? character?.characterId;
}

function getDescription(character) {
  const sheet = getSheet(character);
  const identity = getIdentity(character);
  const notes = sheet.notes || {};
  const backstory = sheet.backstory || {};
  return (
    character?.description ||
    identity.description ||
    notes.description ||
    backstory.description ||
    backstory.ideology ||
    ""
  );
}

function getShortNotes(character) {
  const sheet = getSheet(character);
  const notes = sheet.notes || {};
  const backstory = sheet.backstory || {};
  return character?.privateNotes || notes.privateNotes || notes.publicNotes || backstory.notes || backstory.personalDescription || "";
}

function getHistory(character) {
  const sheet = getSheet(character);
  const notes = sheet.notes || {};
  const backstory = sheet.backstory || {};
  return backstory.story || backstory.history || backstory.backstory || notes.backstory || "";
}

function getSessionNotes(character) {
  const sheet = getSheet(character);
  const notes = sheet.notes || {};
  const sessionNotes = [
    sheet.sessionNotes,
    notes.sessionNotes,
    notes.session,
    notes.sessions,
    notes.campaignSessionNotes,
    character?.sessionNotes,
  ];
  const normalized = sessionNotes.flatMap((entry) => normalizeEntries(entry));
  const inlineNotes = [
    character?.privateNotes,
    notes.privateNotes,
    notes.publicNotes,
    notes.characterNotes,
    notes.playerNotes,
  ].filter(hasValue);
  return [
    ...normalized.map((item) => `${item.label}${hasValue(item.value) ? `: ${item.value}` : ""}`),
    ...inlineNotes,
  ].join("\n\n");
}

function getBackstoryDraft(character) {
  const sheet = getSheet(character);
  const backstory = sheet.backstory || {};
  const relations = sheet.relations || {};
  return {
    story: getHistory(character),
    family: backstory.family || relations.family || "",
    contacts: backstory.contacts || backstory.friends || relations.contacts || relations.friends || "",
  };
}

function normalizeEntries(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item, index) => {
        if (typeof item === "string" || typeof item === "number") return { label: item, value: "" };
        if (!item || typeof item !== "object") return null;
        return {
          label: item.name || item.label || item.key || `Pozycja ${index + 1}`,
          value: item.value ?? item.score ?? item.total ?? item.description ?? item.desc ?? item.notes ?? "",
        };
      })
      .filter(Boolean)
      .filter((item) => hasValue(item.label) || hasValue(item.value));
  }
  if (typeof input === "object") {
    return Object.entries(input)
      .map(([key, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return {
            label: value.name || value.label || key,
            value: value.value ?? value.score ?? value.total ?? value.modifier ?? value.proficient ?? "",
          };
        }
        return { label: key, value };
      })
      .filter((item) => hasValue(item.label) && hasValue(item.value));
  }
  return [];
}

function getAttributes(character) {
  const sheet = getSheet(character);
  return normalizeEntries(sheet.characteristics || sheet.abilityScores || sheet.attributes || sheet.stats);
}

function getSkills(character) {
  const sheet = getSheet(character);
  return normalizeEntries(sheet.skills);
}

function getInventory(character) {
  const sheet = getSheet(character);
  const equipment = sheet.equipment || {};
  return normalizeEntries(equipment.items || sheet.inventory || equipment);
}

function getSpecial(character) {
  const sheet = getSheet(character);
  return [
    ...normalizeEntries(sheet.spells),
    ...normalizeEntries(sheet.featuresTraits),
    ...normalizeEntries(sheet.features),
    ...normalizeEntries(sheet.traits),
    ...normalizeEntries(sheet.abilities),
  ];
}

function Icon({ name }) {
  const paths = {
    search: "M11 19a8 8 0 1 1 5.7-2.4L21 21",
    upload: "M12 3v12m0-12 4 4m-4-4-4 4M4 15v4h16v-4",
    plus: "M12 5v14M5 12h14",
    arrowLeft: "M19 12H5m6-6-6 6 6 6",
    edit: "m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM17 21v-8H7v8M7 3v5h8",
    download: "M12 3v12m0 0 4-4m-4 4-4-4M4 19h16",
    print: "M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
    trash: "M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3.4 3.4-5.5 7-5.5s6.2 2.1 7 5.5",
    group: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 20c.4-3.4 2.2-5.5 4.5-5.5s4.1 2.1 4.5 5.5m.5 0c.3-2.2 1.6-3.7 3.5-3.7s3.2 1.5 3.5 3.7",
    image: "M4 5h16v14H4zM8 13l2.5-2.5L14 14l1.5-1.5L20 17M8.5 8.5h.01",
    x: "M18 6 6 18M6 6l12 12",
  };
  return (
    <svg className="charactersIcon" aria-hidden="true" viewBox="0 0 24 24">
      <path d={paths[name] || paths.user} />
    </svg>
  );
}

function CharacterPortrait({ character, size = "md", onClick }) {
  const portrait = getPortrait(character);
  const name = getCharacterName(character);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [portrait]);

  const content = (
    <>
      <img src={portrait && !failed ? portrait : imagePlaceholder("characterAvatars")} alt={`Portret ${name}`} onError={() => setFailed(true)} />
      {onClick ? <span className="charactersPortraitChange"><Icon name="image" /> Zmien</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`charactersPortrait charactersPortrait--${size} charactersPortraitButton`} onClick={onClick} aria-label={`Zmien avatar postaci ${name}`}>
        {content}
      </button>
    );
  }

  return (
    <div className={`charactersPortrait charactersPortrait--${size}`}>
      {content}
    </div>
  );
}

function CharacterCard({ character, onOpen }) {
  const race = getRace(character);
  const profession = getProfession(character);
  const level = getLevel(character);
  const campaign = getCampaign(character);

  return (
    <button type="button" className="characterLibraryCard" onClick={() => onOpen(getCharacterId(character))}>
      <CharacterPortrait character={character} />
      <div className="characterLibraryCard__body">
        <strong>{getCharacterName(character)}</strong>
        <span className="charactersSystemBadge">{systemLabel(character.systemCode)}</span>
        <p>{[race, profession].filter(Boolean).join(" • ") || "Brak danych profesji"}</p>
        <p>{hasValue(level) ? `Poziom ${level}` : "Poziom nieustalony"}</p>
        <p>Kampania: {safeText(campaign, "Brak kampanii")}</p>
      </div>
    </button>
  );
}

function NewCharacterModal({ creating, campaignOptions, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    systemCode: "dnd5e",
    campaign: "",
    raceName: "",
    className: "",
    level: "",
    portraitUrl: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !creating) onClose?.();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [creating, onClose]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }


  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Nazwa postaci jest wymagana.";
    if (!form.systemCode) nextErrors.systemCode = "Wybierz system RPG.";
    if (hasValue(form.level)) {
      const level = Number(form.level);
      if (!Number.isInteger(level) || level < 0 || level > 20) {
        nextErrors.level = "Poziom musi byc liczba od 0 do 20.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    const level = hasValue(form.level) ? Number(form.level) : form.systemCode === "coc7e" ? 0 : 1;
    onCreate?.({
      name: form.name.trim(),
      systemCode: form.systemCode,
      raceName: form.raceName.trim(),
      className: form.className.trim(),
      level,
      portraitUrl: form.portraitUrl || null,
      campaignName: form.campaign || "",
    });
  }

  return (
    <div className="charactersModalOverlay" role="presentation" onMouseDown={() => !creating && onClose?.()}>
      <section className="charactersModal" role="dialog" aria-modal="true" aria-labelledby="newCharacterTitle" onMouseDown={(event) => event.stopPropagation()}>
        <header className="charactersModalHeader">
          <div>
            <h2 id="newCharacterTitle">Nowa postac</h2>
            <p>Utworz podstawowa karte postaci i uzupelnij szczegoly pozniej.</p>
          </div>
          <button type="button" className="charactersModalClose" aria-label="Zamknij modal" onClick={onClose} disabled={creating}>
            <Icon name="x" />
          </button>
        </header>

        <form className="charactersModalBody" onSubmit={submit}>
          <div className="charactersModalGrid">
            <label className="charactersField">
              <span>Nazwa postaci *</span>
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Np. Mira Valen" aria-invalid={Boolean(errors.name)} />
              {errors.name && <small className="charactersFieldError">{errors.name}</small>}
            </label>
            <label className="charactersField">
              <span>System RPG *</span>
              <select value={form.systemCode} onChange={(event) => updateField("systemCode", event.target.value)} aria-invalid={Boolean(errors.systemCode)}>
                <option value="dnd5e">D&D 5e</option>
                <option value="coc7e">COC 7e</option>
              </select>
              {errors.systemCode && <small className="charactersFieldError">{errors.systemCode}</small>}
            </label>
            <label className="charactersField">
              <span>Kampania</span>
              <select value={form.campaign} onChange={(event) => updateField("campaign", event.target.value)}>
                <option value="">Brak kampanii</option>
                {campaignOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="charactersField">
              <span>Rasa / pochodzenie</span>
              <input value={form.raceName} onChange={(event) => updateField("raceName", event.target.value)} placeholder={form.systemCode === "coc7e" ? "Human" : "Elf, krasnolud..."} />
            </label>
            <label className="charactersField">
              <span>Klasa / profesja</span>
              <input value={form.className} onChange={(event) => updateField("className", event.target.value)} placeholder={form.systemCode === "coc7e" ? "Detective, professor..." : "Wojownik, mag..."} />
            </label>
            <label className="charactersField">
              <span>Poziom</span>
              <input type="number" min="0" max="20" value={form.level} onChange={(event) => updateField("level", event.target.value)} placeholder={form.systemCode === "coc7e" ? "0" : "1"} aria-invalid={Boolean(errors.level)} />
              {errors.level && <small className="charactersFieldError">{errors.level}</small>}
            </label>
          </div>

          <div className="charactersPortraitDropzonePanel">
            <div className="charactersPortraitPreview charactersPortraitPreview--modal">
              <img src={form.portraitUrl || imagePlaceholder("characterAvatars")} alt="Podglad portretu postaci" />
            </div>
            <div className="charactersPortraitDropzoneCopy">
              <span className="charactersEyebrow">Portret postaci</span>
              <ImageLibraryPicker
                type="characterAvatars"
                label="Avatar postaci"
                value={form.portraitUrl}
                onChange={(src) => updateField("portraitUrl", src)}
                onRemove={() => updateField("portraitUrl", "")}
                previewAlt="Portret postaci"
                helpText="Wybierz gotowy avatar postaci z biblioteki."
                disabled={creating}
              />
              {errors.portraitUrl && <small className="charactersFieldError">{errors.portraitUrl}</small>}
            </div>
          </div>

          <footer className="charactersModalFooter">
            <button type="button" className="charactersGhostBtn" onClick={onClose} disabled={creating}>Anuluj</button>
            <button type="submit" className="charactersPrimaryBtn" disabled={creating}>{creating ? "Tworzenie..." : "Utworz postac"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function EditCharacterModal({ detail, saving, campaigns, onClose, onSave }) {
  const currentCampaign = getCampaign(detail);
  const currentPortrait = getPortrait(detail);
  const systemCode = detail?.systemCode || "";
  const campaignOptions = useMemo(() => {
    const base = Array.isArray(campaigns) ? campaigns : [];
    const matching = base.filter((campaign) => {
      const campaignSystem = String(campaign?.systemCode || "").toLowerCase();
      return !campaignSystem || !systemCode || campaignSystem === String(systemCode).toLowerCase();
    });
    if (currentCampaign && !matching.some((campaign) => (campaign.title || campaign.name) === currentCampaign)) {
      return [{ id: "current", title: currentCampaign, systemCode }, ...matching];
    }
    return matching;
  }, [campaigns, currentCampaign, systemCode]);

  const [form, setForm] = useState({
    name: getCharacterName(detail),
    raceName: getRace(detail),
    className: getProfession(detail),
    level: hasValue(getLevel(detail)) ? String(getLevel(detail)) : "",
    campaignName: currentCampaign,
    portraitUrl: currentPortrait,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      name: getCharacterName(detail),
      raceName: getRace(detail),
      className: getProfession(detail),
      level: hasValue(getLevel(detail)) ? String(getLevel(detail)) : "",
      campaignName: getCampaign(detail),
      portraitUrl: getPortrait(detail),
    });
    setErrors({});
  }, [detail]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !saving) onClose?.();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, saving]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Nazwa postaci jest wymagana.";
    if (hasValue(form.level)) {
      const level = Number(form.level);
      if (!Number.isInteger(level) || level < 0) nextErrors.level = "Poziom nie moze byc ujemny.";
    }
    if (form.campaignName && !campaignOptions.some((campaign) => (campaign.title || campaign.name) === form.campaignName)) {
      nextErrors.campaignName = "Wybierz poprawna kampanie albo Brak kampanii.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }


  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    const ok = await onSave?.({
      name: form.name.trim(),
      portraitUrl: form.portraitUrl || "",
      raceName: form.raceName.trim(),
      className: form.className.trim(),
      level: hasValue(form.level) ? Number(form.level) : null,
      campaignName: form.campaignName || "",
    });
    if (ok !== false) onClose?.();
  }

  const preview = {
    name: form.name.trim() || "Bez nazwy",
    portraitUrl: form.portraitUrl,
    raceName: form.raceName,
    className: form.className,
    level: form.level,
    campaignName: form.campaignName,
    systemCode,
  };

  return (
    <div className="charactersModalOverlay" role="presentation" onMouseDown={() => !saving && onClose?.()}>
      <section className="charactersModal characterEditModal" role="dialog" aria-modal="true" aria-labelledby="editCharacterTitle" onMouseDown={(event) => event.stopPropagation()}>
        <header className="charactersModalHeader">
          <div>
            <h2 id="editCharacterTitle">Edytuj postac</h2>
            <p>Zmien podstawowe informacje widoczne na karcie postaci.</p>
          </div>
          <button type="button" className="charactersModalClose" aria-label="Zamknij modal" onClick={onClose} disabled={saving}>
            <Icon name="x" />
          </button>
        </header>

        <form className="charactersModalBody characterEditModalBody" onSubmit={submit}>
          <div className="characterEditModalGrid">
            <aside className="characterEditPreviewPanel">
              <div className="characterEditPreviewCard">
                <CharacterPortrait character={preview} size="lg" />
                <strong>{preview.name}</strong>
                <span className="charactersSystemBadge">{systemLabel(systemCode)}</span>
                <p>{[preview.raceName, preview.className].filter(Boolean).join(" • ") || "Brak danych"}</p>
                <p>{hasValue(preview.level) ? `Poziom ${preview.level}` : "Poziom nieustalony"}</p>
                <p>Kampania: {safeText(preview.campaignName, "Brak kampanii")}</p>
              </div>
            </aside>

            <div className="characterEditFields">
              <label className="charactersField">
                <span>Nazwa postaci *</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  onBlur={() => {
                    if (!form.name.trim()) setErrors((current) => ({ ...current, name: "Nazwa postaci jest wymagana." }));
                  }}
                  placeholder="Np. Tharion Valtheros"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <small className="charactersFieldError">{errors.name}</small>}
              </label>
              <label className="charactersField">
                <span>Rasa / pochodzenie</span>
                <input value={form.raceName} onChange={(event) => updateField("raceName", event.target.value)} placeholder="Np. Czlowiek, Elf, Dragonborn" />
              </label>
              <label className="charactersField">
                <span>Klasa / profesja</span>
                <input value={form.className} onChange={(event) => updateField("className", event.target.value)} placeholder="Np. Barbarzynca, Detektyw, Mag" />
              </label>
              <label className="charactersField">
                <span>Poziom</span>
                <input
                  type="number"
                  min="0"
                  value={form.level}
                  onChange={(event) => updateField("level", event.target.value)}
                  onBlur={() => {
                    if (hasValue(form.level) && Number(form.level) < 0) setErrors((current) => ({ ...current, level: "Poziom nie moze byc ujemny." }));
                  }}
                  placeholder="1"
                  aria-invalid={Boolean(errors.level)}
                />
                {errors.level && <small className="charactersFieldError">{errors.level}</small>}
              </label>
              <label className="charactersField">
                <span>Kampania</span>
                <select value={form.campaignName} onChange={(event) => updateField("campaignName", event.target.value)} aria-invalid={Boolean(errors.campaignName)}>
                  <option value="">Brak kampanii</option>
                  {campaignOptions.map((campaign) => {
                    const label = campaign.title || campaign.name || "Kampania";
                    return <option key={campaign.id || label} value={label}>{label}</option>;
                  })}
                </select>
                {errors.campaignName && <small className="charactersFieldError">{errors.campaignName}</small>}
              </label>
            </div>
          </div>

          <footer className="charactersModalFooter characterEditModalFooter">
            <span>Zmiany beda widoczne na karcie postaci.</span>
            <div>
              <button type="button" className="charactersGhostBtn" onClick={onClose} disabled={saving}>Anuluj</button>
              <button type="submit" className="charactersPrimaryBtn" disabled={saving || !form.name.trim()}>
                <Icon name="save" /> {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

function CreatorPanel({
  selectedCreationSystem,
  setSelectedCreationSystem,
  creating,
  onCreate,
  onCreateCoc,
  onClose,
}) {
  return (
    <section className="charactersPanel charactersCreatePanel">
      <div className="charactersCreateHead">
        <div>
          <span className="charactersEyebrow">{selectedCreationSystem ? "Szybki kreator" : "Wybierz system"}</span>
          <h2>{selectedCreationSystem === "dnd5e" ? "Nowa postać D&D 5e" : selectedCreationSystem === "coc7e" ? "Nowy badacz COC 7e" : "Nowa postać"}</h2>
          <p>{selectedCreationSystem ? "Wypełnij podstawowe dane i utwórz startową kartę." : "Najpierw wybierz system gry. Potem pokażemy odpowiedni szybki kreator."}</p>
        </div>
        <button type="button" className="charactersGhostBtn" onClick={onClose}>Zamknij</button>
      </div>
      {!selectedCreationSystem && <CharacterSystemSelector onSelect={setSelectedCreationSystem} />}
      {selectedCreationSystem && (
        <>
          {creating && <div className="charactersState">Tworzenie postaci...</div>}
          <CharacterCreatorRouter
            systemCode={selectedCreationSystem}
            creating={creating}
            onCreateDnd={onCreate}
            onCreateCoc={onCreateCoc}
            onBack={() => setSelectedCreationSystem(null)}
          />
        </>
      )}
    </section>
  );
}

function CharacterLibraryView({
  items,
  campaignOptions = [],
  loading,
  onOpen,
  onCreate,
  onImport,
  creatorOpen,
  creatorProps,
}) {
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("all");
  const [campaign, setCampaign] = useState("all");
  const [sort, setSort] = useState("name-asc");

  const systemOptions = useMemo(() => [...new Set(items.map((item) => item.systemCode).filter(Boolean))], [items]);
  const campaignFilterOptions = useMemo(() => [...new Set(items.map(getCampaign).filter(Boolean))], [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => {
        const haystack = [
          getCharacterName(item),
          item.systemCode,
          getRace(item),
          getProfession(item),
          getCampaign(item),
        ].filter(Boolean).join(" ").toLowerCase();
        return !normalized || haystack.includes(normalized);
      })
      .filter((item) => system === "all" || item.systemCode === system)
      .filter((item) => campaign === "all" || getCampaign(item) === campaign)
      .sort((a, b) => {
        if (sort === "name-desc") return getCharacterName(b).localeCompare(getCharacterName(a), "pl");
        if (sort === "level-desc") return Number(getLevel(b) || 0) - Number(getLevel(a) || 0);
        if (sort === "system") return systemLabel(a.systemCode).localeCompare(systemLabel(b.systemCode), "pl");
        return getCharacterName(a).localeCompare(getCharacterName(b), "pl");
      });
  }, [campaign, items, query, sort, system]);

  return (
    <>
      <div className="charactersToolbar">
        <label className="charactersSearchControl">
          <Icon name="search" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj postaci..." />
        </label>
        <select value={system} onChange={(event) => setSystem(event.target.value)} aria-label="Filtr systemu">
          <option value="all">System: Wszystkie</option>
          {systemOptions.map((option) => <option key={option} value={option}>System: {systemLabel(option)}</option>)}
        </select>
        <select value={campaign} onChange={(event) => setCampaign(event.target.value)} aria-label="Filtr kampanii">
          <option value="all">Kampania: Wszystkie</option>
          {campaignFilterOptions.map((option) => <option key={option} value={option}>Kampania: {option}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sortowanie">
          <option value="name-asc">Sortowanie: Nazwa A-Z</option>
          <option value="name-desc">Sortowanie: Nazwa Z-A</option>
          <option value="level-desc">Sortowanie: Poziom</option>
          <option value="system">Sortowanie: System</option>
        </select>
        <button type="button" className="charactersGhostBtn charactersToolbarBtn" onClick={onImport}><Icon name="upload" /> Importuj JSON</button>
        <button type="button" className="charactersPrimaryBtn charactersToolbarBtn" onClick={onCreate}><Icon name="plus" /> + Nowa postać</button>
      </div>

      {creatorOpen && <NewCharacterModal {...creatorProps} campaignOptions={campaignOptions} />}

      <section className="charactersLibraryPanel">
        <div className="charactersLibraryIntro">
          <span className="charactersLibraryIntroIcon"><Icon name="group" /></span>
          <div>
            <h2>Wybierz postać, aby otworzyć kartę.</h2>
            <p>Kliknij dowolną postać, aby przejść do jej karty i zarządzać danymi.</p>
          </div>
        </div>
        {loading && <div className="charactersState">Ładowanie listy postaci...</div>}
        {!loading && items.length === 0 && <div className="charactersEmpty">Nie masz jeszcze postaci. Użyj przycisku + Nowa postać.</div>}
        {!loading && items.length > 0 && filtered.length === 0 && <div className="charactersEmpty">Brak postaci pasujących do filtrów.</div>}
        {!loading && items.length === 0 && (
          <div className="charactersEmpty charactersLibraryEmpty">
            <span><Icon name="user" /></span>
            <strong>Brak postaci</strong>
            <p>Utworz pierwsza postac albo zaimportuj ja z pliku JSON.</p>
            <div className="charactersActionsFooter">
              <button type="button" className="charactersPrimaryBtn" onClick={onCreate}><Icon name="plus" /> + Nowa postac</button>
              <button type="button" className="charactersGhostBtn" onClick={onImport}><Icon name="upload" /> Importuj JSON</button>
            </div>
          </div>
        )}
        {!loading && items.length > 0 && filtered.length === 0 && (
          <div className="charactersEmpty charactersLibraryEmpty">
            <span><Icon name="search" /></span>
            <strong>Brak postaci</strong>
            <p>Utworz pierwsza postac albo zaimportuj ja z pliku JSON.</p>
            <div className="charactersActionsFooter">
              <button type="button" className="charactersPrimaryBtn" onClick={onCreate}><Icon name="plus" /> + Nowa postac</button>
              <button type="button" className="charactersGhostBtn" onClick={onImport}><Icon name="upload" /> Importuj JSON</button>
            </div>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <>
            <div className="charactersLibraryGrid">
              {filtered.map((item) => (
                <CharacterCard key={item.id} character={item} onOpen={onOpen} />
              ))}
            </div>
            <div className="charactersPaginationNote">Wyświetlanie {filtered.length} z {items.length} postaci</div>
          </>
        )}
      </section>
    </>
  );
}

function CharacterHeader({ detail, readOnly, deleting, onBack, onEdit, onExport, onPrint, onDelete, onAvatarClick }) {
  const race = getRace(detail);
  const profession = getProfession(detail);
  const level = getLevel(detail);
  const campaign = getCampaign(detail);

  return (
    <>
      <button type="button" className="charactersBackBtn" onClick={onBack}><Icon name="arrowLeft" /> Wróć do listy postaci</button>
      <section className="characterSheetHero">
        <CharacterPortrait character={detail} size="lg" onClick={!readOnly ? onAvatarClick : undefined} />
        <div className="characterSheetHero__identity">
          <h2>{getCharacterName(detail)}</h2>
          <span className="charactersSystemBadge">{systemLabel(detail?.systemCode)}</span>
          <div className="characterSheetMeta">
            {race && <span><Icon name="user" /> {race}</span>}
            {profession && <span>{profession}</span>}
            {hasValue(level) && <span>Poziom {level}</span>}
            <span>Kampania: {safeText(campaign)}</span>
          </div>
        </div>
        <div className="characterSheetActions">
          {!readOnly && <button type="button" className="charactersGhostBtn" onClick={onEdit}><Icon name="edit" /> Edytuj</button>}
          {!readOnly && <button type="button" className="charactersGhostBtn" onClick={onExport}><Icon name="download" /> Eksportuj JSON</button>}
          <button type="button" className="charactersGhostBtn" onClick={onPrint}><Icon name="print" /> Drukuj</button>
          {!readOnly && <button type="button" className="charactersDangerBtn" disabled={deleting} onClick={onDelete}><Icon name="trash" /> Usuń</button>}
          {readOnly && <span className="charactersReadonlyBadge">Podgląd MG - tryb tylko do odczytu</span>}
        </div>
      </section>
    </>
  );
}

function CharacterAvatarPickerModal({ detail, saving, onClose, onSave }) {
  const [value, setValue] = useState(getPortrait(detail));

  useEffect(() => {
    setValue(getPortrait(detail));
  }, [detail]);

  return (
    <div className="charactersModalOverlay" role="presentation" onMouseDown={() => !saving && onClose?.()}>
      <section className="charactersModal characterAvatarPickerModal" role="dialog" aria-modal="true" aria-labelledby="characterAvatarPickerTitle" onMouseDown={(event) => event.stopPropagation()}>
        <header className="charactersModalHeader">
          <div>
            <h2 id="characterAvatarPickerTitle">Zmien avatar postaci</h2>
            <p>Wybierz portret z biblioteki avatarow postaci.</p>
          </div>
          <button type="button" className="charactersModalClose" aria-label="Zamknij modal" onClick={onClose} disabled={saving}>
            <Icon name="x" />
          </button>
        </header>
        <div className="charactersModalBody characterAvatarPickerBody">
          <ImageLibraryPicker
            type="characterAvatars"
            label="Avatar postaci"
            value={value}
            onChange={setValue}
            onRemove={() => setValue("")}
            previewAlt="Portret postaci"
            helpText="Wybrany avatar pojawi sie w naglowku i na listach postaci."
          />
        </div>
        <footer className="charactersModalFooter">
          <button type="button" className="charactersGhostBtn" onClick={onClose} disabled={saving}>Anuluj</button>
          <button type="button" className="charactersPrimaryBtn" onClick={() => onSave(value)} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz avatar"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function CharacterSheetTabs({ activeTab, onChange }) {
  return (
    <div className="characterSheetTabs" role="tablist" aria-label="Sekcje karty postaci">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          className={activeTab === tab.key ? "is-active" : ""}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function InfoRows({ rows }) {
  const visibleRows = rows.filter((row) => hasValue(row.value));
  if (visibleRows.length === 0) return <p className="charactersMuted">Brak danych.</p>;
  return (
    <dl className="characterInfoRows">
      {visibleRows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AttributeGrid({ items, empty = "Brak danych." }) {
  if (!items.length) return <p className="charactersMuted">{empty}</p>;
  return (
    <div className="characterAttributeGrid">
      {items.map((item) => (
        <article key={`${item.label}-${item.value}`} className="characterAttributeCard">
          <span>{titleCaseLabel(item.label)}</span>
          {hasValue(item.value) && <strong>{String(item.value)}</strong>}
        </article>
      ))}
    </div>
  );
}

function EditableAttributeGrid({ value, empty = "Brak atrybutow.", onChange, onSave }) {
  const attributes = linesToEntries(value);

  function updateEntry(index, field, nextValue) {
    const next = attributes.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: nextValue } : item
    ));
    onChange(entriesToLines(next));
  }

  function addAttribute() {
    onChange(entriesToLines([...attributes, { label: "Nowy atrybut", value: "" }]));
  }

  function removeAttribute(index) {
    onChange(entriesToLines(attributes.filter((_, itemIndex) => itemIndex !== index)));
    window.setTimeout(() => onSave?.(), 0);
  }

  return (
    <section className="characterSheetCard characterSheetCard--full characterSheetCard--editor">
      <div className="characterSheetCardHead">
        <div>
          <h3>Atrybuty</h3>
          <p>Zmieniaj nazwy i wartosci atrybutow bezposrednio na kafelkach.</p>
        </div>
        <button type="button" className="charactersGhostBtn" onClick={addAttribute}>Dodaj atrybut</button>
      </div>
      {attributes.length > 0 ? (
        <div className="characterAttributeGrid characterAttributeGrid--editable">
          {attributes.map((item, index) => (
            <article key={`${item.label}-${index}`} className="characterAttributeCard characterAttributeCard--editable">
              <input
                aria-label="Nazwa atrybutu"
                value={titleCaseLabel(item.label)}
                onChange={(event) => updateEntry(index, "label", event.target.value)}
                onBlur={onSave}
              />
              <input
                aria-label={`Wartosc atrybutu ${titleCaseLabel(item.label) || index + 1}`}
                value={String(item.value ?? "")}
                onChange={(event) => updateEntry(index, "value", event.target.value)}
                onBlur={onSave}
              />
              <button type="button" className="characterAttributeRemove" onClick={() => removeAttribute(index)} aria-label={`Usun atrybut ${titleCaseLabel(item.label) || index + 1}`}>
                <Icon name="x" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="charactersEmpty charactersAttributeEmpty">
          <p>{empty}</p>
          <button type="button" className="charactersPrimaryBtn" onClick={addAttribute}>Dodaj pierwszy atrybut</button>
        </div>
      )}
    </section>
  );
}

function ManualTextarea({ value, onChange, onBlur, placeholder, rows = 7, className = "" }) {
  return (
    <textarea
      className={`characterManualTextarea ${className}`.trim()}
      rows={rows}
      value={value || ""}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}

function EditableListPanel({ title, helper, value, empty, placeholder, onChange, onSave }) {
  const entries = linesToEntries(value);
  return (
    <section className="characterSheetCard characterSheetCard--full characterSheetCard--editor">
      <div className="characterSheetCardHead">
        <div>
          <h3>{title}</h3>
          {helper && <p>{helper}</p>}
        </div>
        <span>Zapis lokalny po kliknięciu poza polem</span>
      </div>
      <div className="characterManualGrid">
        <ManualTextarea value={value} onChange={onChange} onBlur={onSave} placeholder={placeholder} rows={12} />
        <div className="characterScrollableList">
          {entries.length > 0 ? (
            <div className="characterSimpleList characterSimpleList--columns">
              {entries.map((item, index) => (
                <article key={`${item.label}-${item.value}-${index}`}>
                  <strong>{item.label}</strong>
                  {hasValue(item.value) && <span>{String(item.value)}</span>}
                </article>
              ))}
            </div>
          ) : (
            <p className="charactersMuted">{empty}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function HistoryEditorPanel({ draft, onDraftChange, onDraftSave }) {
  return (
    <section className="characterSheetCard characterSheetCard--full characterSheetCard--editor">
      <div className="characterSheetCardHead">
        <div>
          <h3>Historia postaci</h3>
          <p>Opisz backstory, rodzinę, znajomych i ważne relacje tej postaci.</p>
        </div>
        <span>Zapis lokalny po opuszczeniu pola</span>
      </div>
      <div className="characterHistoryGrid">
        <ManualTextarea
          value={draft.backstoryText}
          onChange={(value) => onDraftChange("backstoryText", value)}
          onBlur={onDraftSave}
          placeholder="Backstory postaci, najważniejsze wydarzenia, motywacje..."
          rows={14}
        />
        <div className="characterHistorySide">
          <label>
            <span>Rodzina</span>
            <ManualTextarea
              value={draft.familyText}
              onChange={(value) => onDraftChange("familyText", value)}
              onBlur={onDraftSave}
              placeholder="Rodzina, mentorzy, bliscy..."
              rows={6}
            />
          </label>
          <label>
            <span>Znajomi i kontakty</span>
            <ManualTextarea
              value={draft.contactsText}
              onChange={(value) => onDraftChange("contactsText", value)}
              onBlur={onDraftSave}
              placeholder="Sojusznicy, rywale, kontakty w świecie..."
              rows={6}
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function CharacterTabContent({ detail, activeTab, draft, onDraftChange, onDraftSave }) {
  const attributes = getAttributes(detail);
  const description = getDescription(detail);

  if (activeTab === "attributes") {
    return (
      <EditableAttributeGrid
        value={draft.attributesText ?? entriesToLines(attributes)}
        empty="Brak atrybutow."
        onChange={(value) => onDraftChange("attributesText", value)}
        onSave={onDraftSave}
      />
    );
  }

  if (activeTab === "attributes") {
    return <section className="characterSheetCard characterSheetCard--full"><h3>Atrybuty</h3><AttributeGrid items={attributes} empty="Brak atrybutów." /></section>;
  }
  if (activeTab === "skills") {
    return (
      <EditableListPanel
        title="Umiejętności"
        helper="Dopisz własne umiejętności ręcznie, po jednej w linii. Format: Nazwa: wartość."
        value={draft.skillsText}
        empty="Brak umiejętności."
        placeholder={"Percepcja: 45\nSkradanie: 30\nPerswazja: +4"}
        onChange={(value) => onDraftChange("skillsText", value)}
        onSave={onDraftSave}
      />
    );
  }
  if (activeTab === "inventory") {
    return (
      <EditableListPanel
        title="Ekwipunek"
        helper="Wpisuj przedmioty ręcznie. Możesz dodać ilości, opis albo notatkę po dwukropku."
        value={draft.inventoryText}
        empty="Brak ekwipunku."
        placeholder={"Miecz długi: 1k8 obrażeń\nLina: 15 metrów\nMikstura leczenia: 2 szt."}
        onChange={(value) => onDraftChange("inventoryText", value)}
        onSave={onDraftSave}
      />
    );
  }
  if (activeTab === "special") {
    return (
      <EditableListPanel
        title="Zaklęcia / Zdolności"
        helper="Dodaj zaklęcia, cechy klasowe, talenty albo inne specjalne zdolności."
        value={draft.specialText}
        empty="Brak zaklęć lub zdolności."
        placeholder={"Second Wind: raz na krótki odpoczynek\nFire Bolt: cantrip\nDarkvision: 18 metrów"}
        onChange={(value) => onDraftChange("specialText", value)}
        onSave={onDraftSave}
      />
    );
  }
  if (activeTab === "notes") {
    return (
      <section className="characterSheetCard characterSheetCard--full characterSheetCard--editor">
        <div className="characterSheetCardHead">
          <div>
            <h3>Notatki sesyjne postaci</h3>
            <p>Tu trafiają notatki przypisane do postaci, a poniżej możesz dopisać własne obserwacje.</p>
          </div>
          <span>Zapis lokalny po kliknięciu poza polem</span>
        </div>
        <ManualTextarea
          value={draft.notesText}
          onChange={(value) => onDraftChange("notesText", value)}
          onBlur={onDraftSave}
          placeholder="Brak notatek. Dopisz notatki z sesji, tropy, zobowiązania albo ważne informacje..."
          rows={12}
        />
      </section>
    );
  }
  if (activeTab === "history") {
    return <HistoryEditorPanel draft={draft} onDraftChange={onDraftChange} onDraftSave={onDraftSave} />;
  }

  const previewAttributes = linesToEntries(draft.attributesText ?? entriesToLines(attributes));

  return (
    <div className="characterSheetOverview">
      <section className="characterSheetCard">
        <h3>Podstawowe informacje</h3>
        <InfoRows rows={[
          { label: "System", value: systemLabel(detail?.systemCode) },
          { label: "Rasa", value: getRace(detail) },
          { label: "Klasa / Profesja", value: getProfession(detail) },
          { label: "Poziom", value: getLevel(detail) },
          { label: "Kampania", value: getCampaign(detail) },
        ]} />
      </section>
      <section className="characterSheetCard characterSheetCard--description">
        <h3>Opis postaci</h3>
        <ManualTextarea
          value={draft.descriptionText ?? description}
          onChange={(value) => onDraftChange("descriptionText", value)}
          onBlur={onDraftSave}
          placeholder="Brak opisu postaci. Wpisz wygląd, zachowanie, motywacje albo krótki opis bohatera..."
          rows={9}
          className="characterDescriptionTextarea"
        />
      </section>
      <section className="characterSheetCard characterSheetCard--stats">
        <h3>Szybki Podgląd Statystyk</h3>
        <AttributeGrid items={attributes.slice(0, 6)} empty="Brak statystyk do podglądu." />
      </section>
    </div>
  );
}
function CharacterSheetView({
  detail,
  detailLoading,
  readOnly,
  saving,
  deleting,
  confirmDeleteOpen,
  editorOpen,
  setEditorOpen,
  setConfirmDeleteOpen,
  campaigns,
  onBack,
  onSave,
  onDelete,
  onExport,
  onPrint,
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const [localDraft, setLocalDraft] = useState({});
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  useEffect(() => {
    setActiveTab("basic");
    setEditorOpen(false);
    setConfirmDeleteOpen(false);
    setAvatarPickerOpen(false);
  }, [detail?.id, setConfirmDeleteOpen, setEditorOpen]);

  useEffect(() => {
    if (!detail?.id) {
      setLocalDraft({});
      return;
    }
    const saved = readCharacterDrafts()[String(detail.id)] || {};
    const backstory = getBackstoryDraft(detail);
    setLocalDraft({
      descriptionText: saved.descriptionText ?? getDescription(detail),
      skillsText: saved.skillsText ?? entriesToLines(getSkills(detail)),
      attributesText: saved.attributesText ?? entriesToLines(getAttributes(detail)),
      inventoryText: saved.inventoryText ?? entriesToLines(getInventory(detail)),
      specialText: saved.specialText ?? entriesToLines(getSpecial(detail)),
      backstoryText: saved.backstoryText ?? backstory.story,
      familyText: saved.familyText ?? backstory.family,
      contactsText: saved.contactsText ?? backstory.contacts,
    });
  }, [detail]);

  function updateLocalDraftField(key, value) {
    setLocalDraft((current) => ({ ...current, [key]: value }));
  }

  function saveLocalDraft() {
    if (!detail?.id) return;
    writeCharacterDraft(detail.id, localDraft);
  }

  async function saveBasicEdit(payload) {
    return onSave(payload);
  }

  async function saveAvatar(portraitUrl) {
    const ok = await onSave({ portraitUrl: portraitUrl || "" });
    if (ok) setAvatarPickerOpen(false);
  }

  if (detailLoading) return <div className="charactersState">Ładowanie karty...</div>;
  if (!detail) return <div className="charactersEmpty">Nie udało się znaleźć wybranej postaci.</div>;

  return (
    <div className="characterSheetView">
      <CharacterHeader
        detail={detail}
        readOnly={readOnly}
        deleting={deleting}
        onBack={onBack}
        onEdit={() => setEditorOpen(true)}
        onExport={onExport}
        onPrint={onPrint}
        onDelete={() => setConfirmDeleteOpen(true)}
        onAvatarClick={() => setAvatarPickerOpen(true)}
      />

      {saving && <div className="charactersState">Zapisywanie zmian...</div>}
      {avatarPickerOpen && !readOnly && (
        <CharacterAvatarPickerModal
          detail={detail}
          saving={saving}
          onClose={() => setAvatarPickerOpen(false)}
          onSave={saveAvatar}
        />
      )}
      {editorOpen && !readOnly && (
        <EditCharacterModal
          detail={detail}
          saving={saving}
          campaigns={campaigns}
          onClose={() => setEditorOpen(false)}
          onSave={saveBasicEdit}
        />
      )}
      {false && editorOpen && !readOnly && (
        <section className="charactersPanel characterEditPanel">
          <div className="charactersCreateHead">
            <div>
              <span className="charactersEyebrow">Edycja</span>
              <h2>Edytuj dane postaci</h2>
              <p>To istniejący formularz edycji, podpięty pod aktualną logikę zapisu.</p>
            </div>
            <button type="button" className="charactersGhostBtn" onClick={() => setEditorOpen(false)}>Zamknij edycję</button>
          </div>
          <CharacterSheetRouter detail={detail} onSave={onSave} saving={saving} readOnly={readOnly} />
        </section>
      )}

      <section className="characterSheetPanel">
        <CharacterSheetTabs activeTab={activeTab} onChange={setActiveTab} />
        <div className="characterSheetContent">
          <CharacterTabContent
            detail={detail}
            activeTab={activeTab}
            draft={localDraft}
            onDraftChange={updateLocalDraftField}
            onDraftSave={saveLocalDraft}
          />
        </div>
      </section>

      {!readOnly && confirmDeleteOpen && (
        <div className="charactersConfirmBox">
          <p>Czy na pewno chcesz usunąć postać: <strong>{getCharacterName(detail)}</strong>?</p>
          <div className="charactersActionsFooter">
            <button type="button" className="charactersGhostBtn" disabled={deleting} onClick={() => setConfirmDeleteOpen(false)}>Anuluj</button>
            <button type="button" className="charactersDangerBtn" disabled={deleting} onClick={onDelete}>{deleting ? "Usuwanie..." : "Potwierdź usunięcie"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CharactersPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { characterId: routeCharacterId } = useParams();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCreationSystem, setSelectedCreationSystem] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");
  const importInputRef = useRef(null);
  const readOnlyPreview = searchParams.get("mode") === "preview";
  const isDetailRoute = Boolean(routeCharacterId);
  const creationCampaignOptions = useMemo(() => {
    return [...new Set(campaigns.map(getCampaignOptionLabel).filter(Boolean))];
  }, [campaigns]);

  const showNotice = useCallback((type, text) => {
    setNotice({ type, text });
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCharacters(token);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err?.message || "Nie udało się pobrać postaci.";
      setError(message);
      showNotice("error", message);
    } finally {
      setLoading(false);
    }
  }, [token, showNotice]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    let alive = true;
    listCampaigns(token)
      .then((data) => {
        if (alive) setCampaigns(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setCampaigns([]);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    const routeId = Number(routeCharacterId);
    setSelectedId(routeId || null);
  }, [routeCharacterId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    getCharacter(token, selectedId)
      .then(setDetail)
      .catch((err) => {
        const message = err?.message || "Nie udało się pobrać karty.";
        setError(message);
        showNotice("error", message);
      })
      .finally(() => setDetailLoading(false));
  }, [token, selectedId, showNotice]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function onCreate(payload) {
    setCreating(true);
    setError("");
    try {
      const created = await quickCreateCharacter(token, payload);
      setCreatorOpen(false);
      setSelectedCreationSystem(null);
      await loadList();
      navigate(`/characters/${created.id}`);
      showNotice("success", "Postać utworzona.");
    } catch (err) {
      const message = err?.message || "Nie udało się utworzyć postaci.";
      setError(message);
      showNotice("error", message);
    } finally {
      setCreating(false);
    }
  }

  async function onCreateCoc(payload) {
    setCreating(true);
    setError("");
    try {
      const created = await quickCreateCocCharacter(token, payload);
      setCreatorOpen(false);
      setSelectedCreationSystem(null);
      await loadList();
      navigate(`/characters/${created.id}`);
      showNotice("success", "Badacz utworzony.");
    } catch (err) {
      const message = err?.message || "Nie udało się utworzyć badacza.";
      setError(message);
      showNotice("error", message);
    } finally {
      setCreating(false);
    }
  }

  async function onCreateBasic(payload) {
    setCreating(true);
    setError("");
    try {
      const identity = {
        name: payload.name,
        race: payload.raceName || "",
        class: payload.className || "",
        profession: payload.className || "",
        portraitUrl: payload.portraitUrl || "",
        campaignName: payload.campaignName || "",
      };
      const imported = await importCharacter(token, {
        character: {
          name: payload.name,
          systemCode: payload.systemCode,
          raceName: payload.raceName || "",
          className: payload.className || "",
          backgroundName: "",
          level: payload.level,
          portraitUrl: payload.portraitUrl || null,
          sheetJson: {
            identity,
            notes: {},
            backstory: {},
            attributes: {},
            skills: [],
            equipment: { items: [] },
          },
          metadata: {
            status: "ACTIVE",
            maxHp: payload.systemCode === "coc7e" ? 10 : 1,
            currentHp: payload.systemCode === "coc7e" ? 10 : 1,
          },
        },
      });
      setCreatorOpen(false);
      await loadList();
      const nextId = imported?.characterId || imported?.id;
      if (nextId) navigate(`/characters/${nextId}`);
      showNotice("success", "Postac utworzona.");
    } catch (err) {
      const message = err?.message || "Nie udalo sie utworzyc postaci.";
      setError(message);
      showNotice("error", message);
    } finally {
      setCreating(false);
    }
  }

  async function onSave(update) {
    if (!selectedId) return false;
    setSaving(true);
    setError("");
    try {
      const saved = await updateCharacterSheet(token, selectedId, update);
      setDetail(saved);
      await loadList();
      showNotice("success", "Zmiany zapisane.");
      return true;
    } catch (err) {
      const message = err?.message || "Nie udało się zapisać zmian.";
      setError(message);
      showNotice("error", message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedId) return;
    setDeleting(true);
    setError("");
    try {
      await deleteCharacter(token, selectedId);
      setDetail(null);
      setSelectedId(null);
      await loadList();
      navigate("/characters");
      setConfirmDeleteOpen(false);
      showNotice("success", "Postać usunięta.");
    } catch (err) {
      const message = err?.message || "Nie udało się usunąć postaci.";
      setError(message);
      showNotice("error", message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportJson() {
    if (!selectedId) return;
    try {
      const payload = await exportCharacter(token, selectedId);
      const baseName = String(getCharacterName(detail) || "character")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "character";
      const filename = `${baseName}-ttrpg-assistant.json`;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      showNotice("success", "Wyeksportowano postać do JSON.");
    } catch (err) {
      const message = err?.message || "Nie udało się wyeksportować postaci.";
      setError(message);
      showNotice("error", message);
    }
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handlePrint() {
    if (!selectedId) return;
    window.print();
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const raw = await file.text();
      const payload = JSON.parse(raw);
      const imported = await importCharacter(token, payload);
      await loadList();
      if (imported?.characterId) {
        navigate(`/characters/${imported.characterId}`);
      }
      showNotice("success", "Postać zaimportowana.");
    } catch (err) {
      const message = err?.message || "Nie udało się zaimportować postaci.";
      setError(message);
      showNotice("error", message);
    }
  }

  function openCreateFlow() {
    setError("");
    setSelectedCreationSystem(null);
    setCreatorOpen(true);
    if (isDetailRoute) navigate("/characters");
  }

  function closeCreateFlow() {
    setCreatorOpen(false);
    setSelectedCreationSystem(null);
  }

  function openCharacterSheet(characterId) {
    navigate(`/characters/${characterId}`);
  }

  function handleBackToList() {
    navigate("/characters");
  }

  return (
    <div className="page charactersPage">
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="charactersHiddenInput"
        onChange={handleImportFile}
      />

      {notice && <div className={`charactersNotice${notice.type === "error" ? " is-error" : ""}`}>{notice.text}</div>}
      {error && <div className="charactersError">{error}</div>}

      {!isDetailRoute && (
        <CharacterLibraryView
          items={items}
          campaignOptions={creationCampaignOptions}
          loading={loading}
          onOpen={openCharacterSheet}
          onCreate={openCreateFlow}
          onImport={handleImportClick}
          creatorOpen={creatorOpen}
          creatorProps={{
            selectedCreationSystem,
            setSelectedCreationSystem,
            creating,
            onCreate: onCreateBasic,
            onCreateCoc,
            onClose: closeCreateFlow,
          }}
        />
      )}

      {isDetailRoute && (
        <CharacterSheetView
          detail={detail}
          detailLoading={detailLoading}
          readOnly={readOnlyPreview}
          saving={saving}
          deleting={deleting}
          confirmDeleteOpen={confirmDeleteOpen}
          editorOpen={editorOpen}
          setEditorOpen={setEditorOpen}
          setConfirmDeleteOpen={setConfirmDeleteOpen}
          campaigns={campaigns}
          onBack={handleBackToList}
          onSave={onSave}
          onDelete={onDelete}
          onExport={handleExportJson}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
