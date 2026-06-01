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
import CharacterCreatorRouter from "../components/characters/CharacterCreatorRouter";
import CharacterSheetRouter from "../components/characters/CharacterSheetRouter";
import CharacterSystemSelector from "../components/characters/CharacterSystemSelector";
import "../styles/characters.css";

const TABS = [
  { key: "basic", label: "Podstawowe" },
  { key: "attributes", label: "Atrybuty" },
  { key: "skills", label: "Umiejętności" },
  { key: "inventory", label: "Ekwipunek" },
  { key: "special", label: "Zaklęcia / Zdolności" },
  { key: "notes", label: "Notatki" },
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
  return character?.campaignName || character?.campaignTitle || character?.campaign || "";
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
    download: "M12 3v12m0 0 4-4m-4 4-4-4M4 19h16",
    print: "M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
    trash: "M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3.4 3.4-5.5 7-5.5s6.2 2.1 7 5.5",
    group: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 20c.4-3.4 2.2-5.5 4.5-5.5s4.1 2.1 4.5 5.5m.5 0c.3-2.2 1.6-3.7 3.5-3.7s3.2 1.5 3.5 3.7",
  };
  return (
    <svg className="charactersIcon" aria-hidden="true" viewBox="0 0 24 24">
      <path d={paths[name] || paths.user} />
    </svg>
  );
}

function CharacterPortrait({ character, size = "md" }) {
  const portrait = getPortrait(character);
  const name = getCharacterName(character);
  return (
    <div className={`charactersPortrait charactersPortrait--${size}`}>
      {portrait ? (
        <img src={portrait} alt={`Portret ${name}`} />
      ) : (
        <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function CharacterCard({ character, onOpen }) {
  const race = getRace(character);
  const profession = getProfession(character);
  const level = getLevel(character);
  const campaign = getCampaign(character);

  return (
    <button type="button" className="characterLibraryCard" onClick={() => onOpen(character.id)}>
      <CharacterPortrait character={character} />
      <div className="characterLibraryCard__body">
        <strong>{getCharacterName(character)}</strong>
        <span className="charactersSystemBadge">{systemLabel(character.systemCode)}</span>
        <p>{[race, profession].filter(Boolean).join(" • ") || "Brak danych profesji"}</p>
        {hasValue(level) && <p>Poziom {level}</p>}
        <p>Kampania: {safeText(campaign)}</p>
      </div>
    </button>
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
  const campaignOptions = useMemo(() => [...new Set(items.map(getCampaign).filter(Boolean))], [items]);

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
          {campaignOptions.map((option) => <option key={option} value={option}>Kampania: {option}</option>)}
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

      {creatorOpen && <CreatorPanel {...creatorProps} />}

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

function CharacterHeader({ detail, readOnly, deleting, onBack, onEdit, onExport, onPrint, onDelete }) {
  const race = getRace(detail);
  const profession = getProfession(detail);
  const level = getLevel(detail);
  const campaign = getCampaign(detail);

  return (
    <>
      <button type="button" className="charactersBackBtn" onClick={onBack}><Icon name="arrowLeft" /> Wróć do listy postaci</button>
      <section className="characterSheetHero">
        <CharacterPortrait character={detail} size="lg" />
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
          <span>{item.label}</span>
          {hasValue(item.value) && <strong>{String(item.value)}</strong>}
        </article>
      ))}
    </div>
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
  onBack,
  onSave,
  onDelete,
  onExport,
  onPrint,
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const [localDraft, setLocalDraft] = useState({});

  useEffect(() => {
    setActiveTab("basic");
    setEditorOpen(false);
    setConfirmDeleteOpen(false);
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
      inventoryText: saved.inventoryText ?? entriesToLines(getInventory(detail)),
      specialText: saved.specialText ?? entriesToLines(getSpecial(detail)),
      notesText: saved.notesText ?? getSessionNotes(detail) ?? getShortNotes(detail),
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

  if (detailLoading) return <div className="charactersState">Ładowanie karty...</div>;
  if (!detail) return <div className="charactersEmpty">Nie udało się znaleźć wybranej postaci.</div>;

  return (
    <div className="characterSheetView">
      <CharacterHeader
        detail={detail}
        readOnly={readOnly}
        deleting={deleting}
        onBack={onBack}
        onEdit={() => setEditorOpen((prev) => !prev)}
        onExport={onExport}
        onPrint={onPrint}
        onDelete={() => setConfirmDeleteOpen(true)}
      />

      {saving && <div className="charactersState">Zapisywanie zmian...</div>}
      {editorOpen && !readOnly && (
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

  async function onSave(update) {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const saved = await updateCharacterSheet(token, selectedId, update);
      setDetail(saved);
      await loadList();
      showNotice("success", "Zmiany zapisane.");
    } catch (err) {
      const message = err?.message || "Nie udało się zapisać zmian.";
      setError(message);
      showNotice("error", message);
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
          loading={loading}
          onOpen={openCharacterSheet}
          onCreate={openCreateFlow}
          onImport={handleImportClick}
          creatorOpen={creatorOpen}
          creatorProps={{
            selectedCreationSystem,
            setSelectedCreationSystem,
            creating,
            onCreate,
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
