import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { createCharacter, deleteCharacter, getCharacter, listCharacters, updateCharacter } from "../api/characters";
import QuickCharacterCreator from "../components/QuickCharacterCreator";
import "../styles/characters.css";

const STEPS = ["Podstawy", "Tożsamość", "Statystyki", "Walka", "Notatki"];
const ABILITIES = [
  ["strength", "STR"],
  ["dexterity", "DEX"],
  ["constitution", "CON"],
  ["intelligence", "INT"],
  ["wisdom", "WIS"],
  ["charisma", "CHA"],
];

const ABILITY_DETAILS = {
  strength: {
    label: "Siła",
    summary: "Ataki w zwarciu, dźwiganie i brutalna siła.",
  },
  dexterity: {
    label: "Zręczność",
    summary: "Refleks, skradanie, inicjatywa i bronie precyzyjne.",
  },
  constitution: {
    label: "Kondycja",
    summary: "Przetrwanie, odporność i dodatkowe punkty życia.",
  },
  intelligence: {
    label: "Inteligencja",
    summary: "Wiedza, analiza i magia oparta na nauce.",
  },
  wisdom: {
    label: "Mądrość",
    summary: "Percepcja, intuicja, leczenie i kontakt z naturą.",
  },
  charisma: {
    label: "Charyzma",
    summary: "Perswazja, prezencja i moc osobowości.",
  },
};

const STEP_DETAILS = [
  {
    kicker: "Start",
    title: "Nadaj postaci twarz i kierunek",
    description: "To jest szybki punkt wejscia dla nowych graczy. Wystarczy nazwa, status i portret, zeby zaczac budowac bohatera.",
    helpTitle: "Co uzupelniasz teraz?",
    helpBody: "Imie pomaga od razu osadzic postac przy stole. Status mowi, czy karta jest gotowa do gry, czy dopiero skladana. Portret nie jest wymagany, ale bardzo pomaga nowym graczom wejsc w role.",
    checklist: ["Nadaj imie, ktore latwo wymawiac przy stole.", "Zostaw status roboczy, jesli karta nie jest skonczona.", "Portret moze byc linkiem albo plikiem wrzuconym z dysku."],
  },
  {
    kicker: "Historia",
    title: "Okresl skad ta postac sie wziela",
    description: "Tutaj wybierasz archetyp: rase, klase, tlo i poziom. To najwazniejsza warstwa, ktora mowi kim postac jest w swiecie.",
    helpTitle: "Jak to czytac jako nowy gracz?",
    helpBody: "Rasa opisuje pochodzenie, klasa styl gry i glowne umiejetnosci, a tlo mowi, co postac robila zanim trafila do przygody. Poziom i XP zostawiasz na prostych wartosciach startowych, jesli nie masz jeszcze pewnosci.",
    checklist: ["Klasa to to, co robisz najlepiej w druzynie.", "Tlo podpowiada, jak odgrywac postac poza walka.", "Poziom 1 to bezpieczny start dla nowych graczy."],
  },
  {
    kicker: "Mechanika",
    title: "Zbuduj rdzen liczb, ktore napedzaja karte",
    description: "Statystyki decyduja o tym, w czym postac jest dobra. Wizard daje Ci trzy drogi: standard array, losowanie lub reczne wpisanie wartosci.",
    helpTitle: "Co znacza te atrybuty?",
    helpBody: "Sila odpowiada za moc fizyczna, Zrecznosc za refleks i skradanie, Kondycja za przetrwanie, Inteligencja za wiedze, Madrosc za spostrzegawczosc i Charyzma za wplyw na ludzi.",
    checklist: ["Standard array jest najprostsze i najbezpieczniejsze.", "Rzuty 4k6 sa bardziej losowe i klimatyczne.", "Modyfikator po prawej to realny bonus do rzutow."],
  },
  {
    kicker: "Przy stole",
    title: "Przygotuj postac do realnej gry",
    description: "Ten krok zbiera to, co najczesciej sprawdza sie w trakcie sesji i walki: zycie, pancerz, inicjatywe i tempo poruszania.",
    helpTitle: "Dlaczego to jest wazne?",
    helpBody: "HP mowi, ile obrazen zniesiesz. AC okresla, jak trudno Cie trafic. Inicjatywa ustawia kolejnosc ruchu, a szybkosc pomaga ocenic mobilnosc postaci na mapie.",
    checklist: ["Aktualne HP zwykle na starcie rowna sie HP maksymalnemu.", "Tymczasowe HP zostaw na 0, jesli nic ich jeszcze nie daje.", "Inicjatywa to zwykle modyfikator zrecznosci plus premie."],
  },
  {
    kicker: "Gotowe do sesji",
    title: "Zapisz wszystko, co pomaga odgrywac bohatera",
    description: "Na koncu zbierasz notatki, rzeczy do zapamietania i drobne szczegoly, zeby karta byla czytelna rowniez po kilku sesjach.",
    helpTitle: "Co warto wpisac?",
    helpBody: "Dla nowych graczy notatki sa bezcenne: lista ulubionych akcji, 2-3 cechy charakteru, najwazniejszy ekwipunek i rzeczy, o ktorych warto pamietac w walce.",
    checklist: ["Pisz krotko, konkretnie i pod sesje.", "Dodaj rzeczy, ktore chcesz szybko znalezc bez szukania.", "Prywatne notatki zostaw na sekrety i pomysly dla siebie."],
  },
];

const RACE_OPTIONS = {
  Czlowiek: ["Brak podrasy"],
  Elf: ["Wysoki elf", "Lesny elf", "Mroczny elf"],
  Krasnolud: ["Gorski krasnolud", "Wzgorzowy krasnolud"],
  Niziolek: ["Lekkostopy", "Rosly"],
  Gnom: ["Lesny gnom", "Skalny gnom"],
  Polelf: ["Brak podrasy"],
  Polork: ["Brak podrasy"],
  Diabel: ["Brak podrasy"],
  Dragonborn: ["Chromatyczny", "Metaliczny", "Klejnotowy"],
};

const CLASS_OPTIONS = {
  Barbarzynca: ["Berzerker", "Totemiczny wojownik", "Dziki magiczny"],
  Bard: ["Kolegium wiedzy", "Kolegium męstwa", "Kolegium uroku"],
  Kleryk: ["Domena zycia", "Domena wojny", "Domena swiatla"],
  Druid: ["Krąg ziemi", "Krąg ksiezyca", "Krąg gwiazd"],
  Wojownik: ["Mistrz walki", "Champion", "Rycerz mistyczny"],
  Mnich: ["Droga otwartej dloni", "Droga cienia", "Droga czterech zywiolow"],
  Paladyn: ["Przysiega oddania", "Przysiega zemsty", "Przysiega starozytnych"],
  Lowca: ["Mistrz bestii", "Lowca", "Mroczny wladca"],
  Lotrzyk: ["Zlodziej", "Skrytobojca", "Arcymagiczny oszust"],
  Czarownik: ["Dzika magia", "Smocza krew", "Burzowa dusza"],
  Czarnoksieznik: ["Patron czarta", "Wielki pradawny", "Arcypotega"],
  Czarodziej: ["Szkola wywolywania", "Szkola iluzji", "Szkola nekromancji"],
};

const BACKGROUND_OPTIONS = [
  "Akolita",
  "Archeolog",
  "Banita",
  "Czarodziej-uczony",
  "Hulaka",
  "Ludowy bohater",
  "Marynarz",
  "Przestepca",
  "Rzemieslnik gildyjny",
  "Szarlatan",
  "Szlachcic",
  "Wedrowiec",
  "Zolnierz",
];

const ALIGNMENT_OPTIONS = [
  "Praworzadny dobry",
  "Neutralny dobry",
  "Chaotyczny dobry",
  "Praworzadny neutralny",
  "Prawdziwie neutralny",
  "Chaotyczny neutralny",
  "Praworzadny zly",
  "Neutralny zly",
  "Chaotyczny zly",
];

const RACE_DESCRIPTIONS = {
  Czlowiek: "Uniwersalny wybor dla nowych graczy. Czlowiek jest wszechstronny i dobrze pasuje praktycznie do kazdej klasy.",
  Elf: "Elf stawia na zrecznosc, wyczucie magii i lekki, szybki styl gry. Dobrze czuje sie jako zwiadowca, lowca albo czarujacy.",
  Krasnolud: "Krasnolud jest odporny, twardy i stabilny. To swietny wybor, jesli chcesz wytrzymalego bohatera do pierwszej kampanii.",
  Niziolek: "Niziolek jest maly, zwinny i bardzo trudny do przyparcia do muru. Dobrze sprawdza sie w skradaniu i sprytnych planach.",
  Gnom: "Gnom laczy ciekawosc, bystrosc i lekka dziwacznosc. Pasuje do postaci technicznych, magicznych i kreatywnych.",
  Polelf: "Polelf jest charyzmatyczny i elastyczny. To dobry wybor do postaci spolecznych, liderow i bohaterow laczacych kilka stylow gry.",
  Polork: "Polork jest silny, agresywny i odporny. Dobrze pasuje do gracza, ktory chce prostej, bezposredniej postaci frontowej.",
  Diabel: "Diabel daje mocny klimat, wrodzona magie i wyrazisty charakter. To wybor dla kogos, kto chce postaci z mroczniejszym rysem.",
  Dragonborn: "Dragonborn jest dumny, heroiczny i bardzo widowiskowy. Daje smoczy oddech i mocna fantastyczna tozsamosc.",
};

const CLASS_DESCRIPTIONS = {
  Barbarzynca: "Barbarzynca walczy sila, gniewem i wytrzymaloscia. To prosty i satysfakcjonujacy wybor dla kogos, kto chce wejsc od razu do walki.",
  Bard: "Bard wspiera druzyne slowem, magia i talentem. Swietny dla gracza, ktory lubi rozmowy, kreatywnosc i elastycznosc.",
  Kleryk: "Kleryk laczy magie, wsparcie i wiare. Potrafi leczyc, wzmacniac sojusznikow i nadal byc grozny w walce.",
  Druid: "Druid czerpie moc z natury i przemian. To klasa dla gracza, ktory lubi klimat dzikosci, kontroli pola i zaklec.",
  Wojownik: "Wojownik jest prosty do zrozumienia i bardzo skuteczny. Daje mocny start nowym graczom, bo dobrze dziala niemal w kazdej sytuacji.",
  Mnich: "Mnich walczy szybkoscia, dyscyplina i technika. To bardziej mobilny styl gry dla kogos, kto lubi precyzje i ruch.",
  Paladyn: "Paladyn to rycerz z przysiega, ktory laczy obrone, walke i boska moc. Bardzo wdzieczny wybor dla bohatera-lidera.",
  Lowca: "Lowca dobrze radzi sobie na dystans, w tropieniu i w naturze. To wygodna klasa dla kogos, kto chce byc samowystarczalny.",
  Lotrzyk: "Lotrzyk wygrywa sprytem, pozycja i precyzja. Dobrze pasuje do gracza, ktory lubi skradanie, podstep i szybkie akcje.",
  Czarownik: "Czarownik ma wrodzona magie i prostszy zestaw zaklec niz czarodziej. Dobry start, jesli chcesz czarowac bez przytloczenia.",
  Czarnoksieznik: "Czarnoksieznik czerpie moc od patrona i ma bardzo wyrazisty klimat. Oferuje mocne sztuczki i nietypowy styl gry.",
  Czarodziej: "Czarodziej to mistrz szerokiej magii i opcji taktycznych. Idealny dla gracza, ktory chce eksplorowac pelne mozliwosci zaklec.",
};

const BACKGROUND_DESCRIPTIONS = {
  Akolita: "Akolita zna rytualy, religie i zycie swiatynne. Dobrze pasuje do postaci duchownych, uczonych i bohaterow z silna wiara.",
  Archeolog: "Archeolog lubi ruiny, odkrycia i dawne sekrety. To dobre tlo dla odkrywcow i bohaterow ciekawych swiata.",
  Banita: "Banita zna dzicz, przetrwanie i zycie poza cywilizacja. Pomaga zagrac postac bardziej surowa i niezalezna.",
  "Czarodziej-uczony": "To tlo podkresla edukacje, badania i wiedze ksiazkowa. Swietnie wspiera postaci magiczne i analityczne.",
  Hulaka: "Hulaka zyje szybko, towarzysko i ryzykownie. Daje prosty punkt zaczepienia do grania lekkomyslnym, charyzmatycznym bohaterem.",
  "Ludowy bohater": "Ludowy bohater jest blisko zwyklych ludzi i dobrze wypada jako obronca slabszych. To bardzo przystepne tlo dla nowych graczy.",
  Marynarz: "Marynarz zna podroze, porty i zycie w drodze. Dobrze laczy sie z przygodowym, swobodnym stylem gry.",
  Przestepca: "Przestepca daje kontakty z polswiatkiem, skradanie i uliczny spryt. Pasuje do lotrzykow i bohaterow z ciemniejsza przeszloscia.",
  "Rzemieslnik gildyjny": "Rzemieslnik gildyjny ma fach, kontakty i konkretny zawod. To dobre tlo dla postaci praktycznych i osadzonych w swiecie.",
  Szarlatan: "Szarlatan bazuje na blefie, przebierankach i gadce. To wybor dla gracza, ktory lubi klamstwo, tricki i improwizacje.",
  Szlachcic: "Szlachcic wchodzi do gry z pozycja, etykieta i znajomoscia elit. Dobrze sprawdza sie w intrygach i scenach spolecznych.",
  Wedrowiec: "Wedrowiec zna drogi, tropy i zycie z dala od miast. To wygodne tlo dla zwiadowcow i samotnikow.",
  Zolnierz: "Zolnierz rozumie dyscypline, walke i dzialanie w zespole. To mocny, prosty fundament dla bohatera frontowego.",
};

const ALIGNMENT_DESCRIPTIONS = {
  "Praworzadny dobry": "Chce pomagac innym i wierzy w zasady, honor albo porzadek.",
  "Neutralny dobry": "Pomaga ludziom przede wszystkim dlatego, ze to sluszne, bez przywiazania do rygorystycznych zasad.",
  "Chaotyczny dobry": "Ma dobre serce, ale nie lubi ograniczen i czesto stawia wolnosc ponad reguly.",
  "Praworzadny neutralny": "Najwazniejsze sa dla niego zasady, przysiega albo porzadek, bardziej niz osobiste emocje.",
  "Prawdziwie neutralny": "Stara sie zachowac rownowage albo po prostu dziala pragmatycznie, zalezenie od sytuacji.",
  "Chaotyczny neutralny": "Idzie w strone niezaleznosci i wolnosci, nawet jesli decyzje sa nieprzewidywalne.",
  "Praworzadny zly": "Działa egoistycznie, ale wciaz ceni strukture, kontrole i porzadek.",
  "Neutralny zly": "Kieruje sie glownie wlasna korzyscia i nie przywiazuje duzej wagi do zasad ani buntu.",
  "Chaotyczny zly": "Jest destrukcyjny, samolubny i lekcewazy wszelkie reguly, jesli stoja mu na drodze.",
};

function createEmptyForm() {
  return {
    name: "",
    status: "DRAFT",
    portraitUrl: "",
    raceName: "",
    subraceName: "",
    className: "",
    subclassName: "",
    backgroundName: "",
    alignment: "",
    level: 1,
    experiencePoints: 0,
    abilityMode: "MANUAL",
    abilityPool: [],
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    armorClass: 10,
    initiativeBonus: 0,
    speed: 30,
    proficiencyBonus: 2,
    hitDice: "1k8",
    skillNotes: "",
    savingThrowNotes: "",
    equipmentNotes: "",
    featureNotes: "",
    personalityNotes: "",
    privateNotes: "",
  };
}

function sanitizeCharacterPayload(character) {
  const { abilityPool, ...payload } = character;
  return payload;
}

function formatDate(value) {
  if (!value) return "Brak";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status) {
  if (status === "ACTIVE") return "Aktywna";
  if (status === "ARCHIVED") return "Zarchiwizowana";
  return "Robocza";
}

function modifier(score) {
  return Math.floor((Number(score || 10) - 10) / 2);
}

function rollAbility() {
  const rolls = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

function progressPercent(currentStep) {
  return Math.round(((currentStep + 1) / STEPS.length) * 100);
}

export default function CharactersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [draft, setDraft] = useState(createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [builderMode, setBuilderMode] = useState("quick");
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [notice, setNotice] = useState("");
  const [draggedAbility, setDraggedAbility] = useState("");
  const [draggedPoolIndex, setDraggedPoolIndex] = useState(null);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(null);
  const activeStep = STEP_DETAILS[step];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await listCharacters(token);
        if (cancelled) return;
        const next = Array.isArray(data) ? data : [];
        setItems(next);
        setSelectedId(next[0]?.id || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Nie udało się pobrać postaci.");
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
    let cancelled = false;
    if (!selectedId) {
      setDetail(null);
      setForm(createEmptyForm());
      return undefined;
    }
    async function loadDetail() {
      setDetailLoading(true);
      setDetailError("");
      try {
        const data = await getCharacter(token, selectedId);
        if (cancelled) return;
        setDetail(data);
        setForm({ ...createEmptyForm(), ...data });
      } catch (err) {
        if (!cancelled) setDetailError(err?.message || "Nie udało się pobrać karty postaci.");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  useEffect(() => {
    if (!modalOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timeout);
  }, [notice]);

  function updateForm(setter, key, value) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  function updateRace(setter, raceName) {
    setter((prev) => {
      const subraces = RACE_OPTIONS[raceName] || [];
      const nextSubrace = subraces.includes(prev.subraceName) ? prev.subraceName : subraces[0] || "";
      return { ...prev, raceName, subraceName: nextSubrace };
    });
  }

  function updateClass(setter, className) {
    setter((prev) => {
      const subclasses = CLASS_OPTIONS[className] || [];
      const nextSubclass = subclasses.includes(prev.subclassName) ? prev.subclassName : subclasses[0] || "";
      return { ...prev, className, subclassName: nextSubclass };
    });
  }

  function clearAssignedAbilities(setter, mode, pool) {
    setter((prev) => ({
      ...prev,
      abilityMode: mode,
      abilityPool: pool,
      strength: "",
      dexterity: "",
      constitution: "",
      intelligence: "",
      wisdom: "",
      charisma: "",
    }));
    setSelectedPoolIndex(null);
    setDraggedPoolIndex(null);
    setDraggedAbility("");
  }

  function applyStats(setter, mode, values) {
    setter((prev) => ({ ...prev, abilityMode: mode, ...values }));
  }

  function applyStandardArray(setter) {
    clearAssignedAbilities(setter, "STANDARD_ARRAY", [15, 14, 13, 12, 10, 8]);
  }

  function applyRolledStats(setter) {
    clearAssignedAbilities(setter, "ROLLED", Array.from({ length: 6 }, () => null));
  }

  function swapAbilityScores(setter, sourceKey, targetKey) {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    setter((prev) => ({
      ...prev,
      [sourceKey]: prev[targetKey],
      [targetKey]: prev[sourceKey],
    }));
  }

  function assignPoolValue(setter, abilityKey, poolIndex) {
    if (poolIndex == null || poolIndex < 0) return;
    setter((prev) => {
      const pool = Array.isArray(prev.abilityPool) ? [...prev.abilityPool] : [];
      if (poolIndex >= pool.length) return prev;
      const [nextValue] = pool.splice(poolIndex, 1);
      if (nextValue == null) return prev;
      const currentValue = prev[abilityKey];
      if (currentValue !== "" && currentValue != null) {
        pool.push(currentValue);
      }
      return { ...prev, [abilityKey]: nextValue, abilityPool: pool };
    });
    setSelectedPoolIndex(null);
    setDraggedPoolIndex(null);
  }

  function rollPoolSlot(setter, poolIndex) {
    if (poolIndex == null || poolIndex < 0) return;
    setter((prev) => {
      const pool = Array.isArray(prev.abilityPool) ? [...prev.abilityPool] : [];
      if (poolIndex >= pool.length) return prev;
      pool[poolIndex] = rollAbility();
      return { ...prev, abilityPool: pool };
    });
    setSelectedPoolIndex(poolIndex);
  }

  function returnAbilityToPool(setter, abilityKey) {
    setter((prev) => {
      const currentValue = prev[abilityKey];
      if (currentValue === "" || currentValue == null) return prev;
      return {
        ...prev,
        [abilityKey]: "",
        abilityPool: [...(prev.abilityPool || []), currentValue],
      };
    });
  }

  function onPortraitUpload(event, setter) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setter((prev) => ({ ...prev, portraitUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  async function createNewCharacter(payload) {
    setCreating(true);
    setError("");
    try {
      const created = await createCharacter(token, sanitizeCharacterPayload(payload));
      setItems((prev) => [{
        id: created.id,
        systemCode: created.systemCode,
        name: created.name,
        status: created.status,
        level: created.level,
        raceName: created.raceName,
        className: created.className,
        portraitUrl: created.portraitUrl,
        updatedAt: created.updatedAt,
      }, ...prev]);
      setSelectedId(created.id);
      setModalOpen(false);
      setStep(0);
      setBuilderMode("quick");
      setDraft(createEmptyForm());
      setNotice("Postać została utworzona.");
    } catch (err) {
      setError(err?.message || "Nie udaĹ‚o siÄ™ utworzyÄ‡ postaci.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreate() {
    if (!draft.name.trim()) {
      setError("Podaj imię postaci.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const created = await createCharacter(token, sanitizeCharacterPayload(draft));
      setItems((prev) => [{
        id: created.id,
        systemCode: created.systemCode,
        name: created.name,
        status: created.status,
        level: created.level,
        raceName: created.raceName,
        className: created.className,
        portraitUrl: created.portraitUrl,
        updatedAt: created.updatedAt,
      }, ...prev]);
      setSelectedId(created.id);
      setModalOpen(false);
      setStep(0);
      setDraft(createEmptyForm());
      setNotice("Postać została utworzona.");
    } catch (err) {
      setError(err?.message || "Nie udało się utworzyć postaci.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setDetailError("");
    try {
      const updated = await updateCharacter(token, selectedId, sanitizeCharacterPayload(form));
      setDetail(updated);
      setForm({ ...createEmptyForm(), ...updated });
      setItems((prev) => prev.map((item) => item.id === updated.id ? {
        ...item,
        name: updated.name,
        status: updated.status,
        level: updated.level,
        raceName: updated.raceName,
        className: updated.className,
        portraitUrl: updated.portraitUrl,
        updatedAt: updated.updatedAt,
      } : item));
      setNotice("Karta postaci została zapisana.");
    } catch (err) {
      setDetailError(err?.message || "Nie udało się zapisać postaci.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm("Usunąć tę postać?")) return;
    setDeleting(true);
    try {
      await deleteCharacter(token, selectedId);
      const remaining = items.filter((item) => item.id !== selectedId);
      setItems(remaining);
      setSelectedId(remaining[0]?.id || null);
      setNotice("Postać została usunięta.");
    } catch (err) {
      setDetailError(err?.message || "Nie udało się usunąć postaci.");
    } finally {
      setDeleting(false);
    }
  }

  function renderAbilityAllocator(state, setter) {
    const isManual = state.abilityMode === "MANUAL";
    const pool = Array.isArray(state.abilityPool) ? state.abilityPool : [];
    const selectedPoolValue = selectedPoolIndex != null ? pool[selectedPoolIndex] : null;

    return (
      <div className="charactersAbilities">
        <div className="charactersAbilityModes">
          <button type="button" className={`charactersGhostBtn charactersModeBtn${state.abilityMode === "STANDARD_ARRAY" ? " is-active" : ""}`} onClick={() => applyStandardArray(setter)}>
            <span>Standard array</span>
            <small>15, 14, 13, 12, 10, 8</small>
          </button>
          <button type="button" className={`charactersGhostBtn charactersModeBtn${state.abilityMode === "ROLLED" ? " is-active" : ""}`} onClick={() => applyRolledStats(setter)}>
            <span>Rzuc 4k6</span>
            <small>Kliknij, aby wygenerowac nowa pule</small>
          </button>
          <button
            type="button"
            className={`charactersGhostBtn charactersModeBtn${isManual ? " is-active" : ""}`}
            onClick={() => {
              setSelectedPoolIndex(null);
              setDraggedPoolIndex(null);
              setDraggedAbility("");
              setter((prev) => ({ ...prev, abilityMode: "MANUAL", abilityPool: [] }));
            }}
          >
            <span>Tryb reczny</span>
            <small>Wpisz wartosci samodzielnie</small>
          </button>
        </div>
        {!isManual && (
          <div className="charactersAbilityTray">
            <div className="charactersAbilityTrayIntro">
              <span className="charactersSectionKicker">Aktywny zestaw</span>
              <h4>{state.abilityMode === "ROLLED" ? "Kliknij w kazdy znak zapytania, aby wylosowac wynik, a potem przypisz go do cechy" : "Wartosci na dole sa puste. Przypisz wyniki z puli do odpowiednich cech"}</h4>
            </div>
            <div className="charactersAbilityChips" aria-label="Pula wynikow">
              {pool.map((value, index) => (
                <button
                  key={`${state.abilityMode}-${index}-${value ?? "empty"}`}
                  type="button"
                  className={`charactersAbilityChip${selectedPoolIndex === index ? " is-selected" : ""}`}
                  draggable={value != null}
                  onClick={() => {
                    if (value == null) {
                      rollPoolSlot(setter, index);
                      return;
                    }
                    setSelectedPoolIndex((prev) => (prev === index ? null : index));
                  }}
                  onDragStart={() => {
                    if (value != null) setDraggedPoolIndex(index);
                  }}
                  onDragEnd={() => setDraggedPoolIndex(null)}
                >
                  {value == null ? "?" : value}
                </button>
              ))}
            </div>
            <p>{selectedPoolValue != null ? `Wybrano ${selectedPoolValue}. Kliknij w slot cechy albo przeciagnij tam kafelek.` : state.abilityMode === "ROLLED" ? "Najpierw odslon wszystkie 6 wynikow. Potem kliknij liczbe i przypisz ja do odpowiedniej cechy." : "Kliknij w wybrany wynik albo przeciagnij go na odpowiednia ceche ponizej."}</p>
          </div>
        )}
        <div className="charactersAbilitiesGrid">
          {ABILITIES.map(([key, label]) => {
            const filled = state[key] !== "" && state[key] != null;
            return (
              <div
                key={key}
                className={`charactersAbilityCard${(draggedPoolIndex != null || selectedPoolIndex != null) ? " is-drop-target" : ""}${draggedAbility === key ? " is-dragging" : ""}`}
                draggable={!isManual && filled}
                onDragStart={() => setDraggedAbility(key)}
                onDragEnd={() => setDraggedAbility("")}
                onDragOver={(event) => {
                  if (!isManual) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!isManual && draggedPoolIndex != null) assignPoolValue(setter, key, draggedPoolIndex);
                  if (!isManual && draggedAbility) swapAbilityScores(setter, draggedAbility, key);
                  setDraggedPoolIndex(null);
                  setDraggedAbility("");
                }}
                onClick={() => {
                  if (!isManual && selectedPoolIndex != null) assignPoolValue(setter, key, selectedPoolIndex);
                }}
              >
                <div className="charactersAbilityHead">
                  <span>{label}</span>
                  <strong>{ABILITY_DETAILS[key].label}</strong>
                </div>
                {isManual ? (
                  <input type="number" min="1" max="30" value={state[key]} onChange={(event) => updateForm(setter, key, Number(event.target.value || 0))} />
                ) : (
                  <div className={`charactersAbilityToken${filled ? "" : " is-empty"}`}>
                    <em>{filled ? state[key] : "?"}</em>
                    <small>
                      {filled
                        ? selectedPoolValue != null
                          ? `Kliknij, aby podmienic na ${selectedPoolValue}`
                          : "Przeciagnij te wartosc na inna ceche albo zwroc ja do puli."
                        : "Pusty slot. Upusc tu kafelek albo kliknij po wybraniu liczby z puli."}
                    </small>
                  </div>
                )}
                <p>{ABILITY_DETAILS[key].summary}</p>
                <div className="charactersAbilityMeta">
                  <span>Modyfikator</span>
                  <strong>{filled ? (modifier(state[key]) >= 0 ? `+${modifier(state[key])}` : modifier(state[key])) : "--"}</strong>
                </div>
                {!isManual && filled && (
                  <button
                    type="button"
                    className="charactersAbilityReturn"
                    onClick={(event) => {
                      event.stopPropagation();
                      returnAbilityToPool(setter, key);
                    }}
                  >
                    Zwroc do puli
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderDraftStep() {
    if (step === 0) {
      return (
        <div className="charactersGrid">
          <label className="charactersField"><span>Imię postaci</span><input value={draft.name} onChange={(event) => updateForm(setDraft, "name", event.target.value)} placeholder="np. Elara" /></label>
          <label className="charactersField"><span>Status</span><select value={draft.status} onChange={(event) => updateForm(setDraft, "status", event.target.value)}><option value="DRAFT">Robocza</option><option value="ACTIVE">Aktywna</option><option value="ARCHIVED">Zarchiwizowana</option></select></label>
          <label className="charactersField charactersField--full"><span>Portret</span><input value={draft.portraitUrl} onChange={(event) => updateForm(setDraft, "portraitUrl", event.target.value)} placeholder="URL albo data URL" /></label>
          <label className="charactersField charactersField--full"><span>Wgraj portret</span><input type="file" accept="image/*" onChange={(event) => onPortraitUpload(event, setDraft)} /></label>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="charactersGrid">
          <label className="charactersField"><span>Rasa</span><select value={draft.raceName} onChange={(event) => updateRace(setDraft, event.target.value)}><option value="">Wybierz rasę</option>{Object.keys(RACE_OPTIONS).map((race) => <option key={race} value={race}>{race}</option>)}</select></label>
          <label className="charactersField"><span>Podrasa</span><select value={draft.subraceName} onChange={(event) => updateForm(setDraft, "subraceName", event.target.value)} disabled={!draft.raceName}><option value="">{draft.raceName ? "Wybierz podrasę" : "Najpierw wybierz rasę"}</option>{(RACE_OPTIONS[draft.raceName] || []).map((subrace) => <option key={subrace} value={subrace}>{subrace}</option>)}</select></label>
          <label className="charactersField"><span>Klasa</span><select value={draft.className} onChange={(event) => updateClass(setDraft, event.target.value)}><option value="">Wybierz klasę</option>{Object.keys(CLASS_OPTIONS).map((className) => <option key={className} value={className}>{className}</option>)}</select></label>
          <label className="charactersField"><span>Podklasa</span><select value={draft.subclassName} onChange={(event) => updateForm(setDraft, "subclassName", event.target.value)} disabled={!draft.className}><option value="">{draft.className ? "Wybierz podklasę" : "Najpierw wybierz klasę"}</option>{(CLASS_OPTIONS[draft.className] || []).map((subclass) => <option key={subclass} value={subclass}>{subclass}</option>)}</select></label>
          <label className="charactersField"><span>Poziom</span><input type="number" min="1" max="20" value={draft.level} onChange={(event) => updateForm(setDraft, "level", Number(event.target.value || 1))} /></label>
          <label className="charactersField"><span>XP</span><input type="number" min="0" value={draft.experiencePoints} onChange={(event) => updateForm(setDraft, "experiencePoints", Number(event.target.value || 0))} /></label>
          <div className="charactersField charactersField--full">
            <span>Gotowe tła</span>
            <div className="charactersQuickChoices">
              {BACKGROUND_OPTIONS.map((background) => (
                <button key={background} type="button" className={`charactersQuickChoice${draft.backgroundName === background ? " is-active" : ""}`} onClick={() => updateForm(setDraft, "backgroundName", background)}>
                  {background}
                </button>
              ))}
            </div>
          </div>
          <div className="charactersField charactersField--full">
            <span>Gotowe charaktery</span>
            <div className="charactersQuickChoices">
              {ALIGNMENT_OPTIONS.map((alignment) => (
                <button key={alignment} type="button" className={`charactersQuickChoice${draft.alignment === alignment ? " is-active" : ""}`} onClick={() => updateForm(setDraft, "alignment", alignment)}>
                  {alignment}
                </button>
              ))}
            </div>
          </div>
          {(draft.raceName || draft.className || draft.backgroundName || draft.alignment) && (
            <div className="charactersField charactersField--full">
              <span>Wyjasnienie wyborow</span>
              <div className="charactersChoiceHelp">
                {draft.raceName && (
                  <div className="charactersChoiceHelpCard">
                    <strong>Rasa: {draft.raceName}</strong>
                    <p>{RACE_DESCRIPTIONS[draft.raceName] || "Ta rasa nadaje postaci wyrazisty klimat i mechaniczny kierunek."}</p>
                  </div>
                )}
                {draft.className && (
                  <div className="charactersChoiceHelpCard">
                    <strong>Klasa: {draft.className}</strong>
                    <p>{CLASS_DESCRIPTIONS[draft.className] || "Ta klasa definiuje, jak postac dziala podczas walki i poza nia."}</p>
                  </div>
                )}
                {draft.backgroundName && (
                  <div className="charactersChoiceHelpCard charactersChoiceHelpCard--secondary">
                    <strong>Tlo: {draft.backgroundName}</strong>
                    <p>{BACKGROUND_DESCRIPTIONS[draft.backgroundName] || "To tlo pomaga osadzic postac w swiecie i podpowiada, jak odgrywac ja poza walka."}</p>
                  </div>
                )}
                {draft.alignment && (
                  <div className="charactersChoiceHelpCard charactersChoiceHelpCard--secondary">
                    <strong>Charakter: {draft.alignment}</strong>
                    <p>{ALIGNMENT_DESCRIPTIONS[draft.alignment] || "Charakter podpowiada, jak postac zwykle podejmuje decyzje i reaguje na konflikty."}</p>
                  </div>
                )}
            </div>
          </div>
      )}
        </div>
      );
    }
    if (step === 2) return renderAbilityAllocator(draft, setDraft);
    if (step === 3) {
      return (
        <div className="charactersGrid">
          <label className="charactersField"><span>HP maks.</span><input type="number" min="1" value={draft.maxHp} onChange={(event) => updateForm(setDraft, "maxHp", Number(event.target.value || 1))} /></label>
          <label className="charactersField"><span>HP aktualne</span><input type="number" min="0" value={draft.currentHp} onChange={(event) => updateForm(setDraft, "currentHp", Number(event.target.value || 0))} /></label>
          <label className="charactersField"><span>HP tymczasowe</span><input type="number" min="0" value={draft.tempHp} onChange={(event) => updateForm(setDraft, "tempHp", Number(event.target.value || 0))} /></label>
          <label className="charactersField"><span>AC</span><input type="number" min="1" value={draft.armorClass} onChange={(event) => updateForm(setDraft, "armorClass", Number(event.target.value || 1))} /></label>
          <label className="charactersField"><span>Inicjatywa</span><input type="number" value={draft.initiativeBonus} onChange={(event) => updateForm(setDraft, "initiativeBonus", Number(event.target.value || 0))} /></label>
          <label className="charactersField"><span>Szybkość</span><input type="number" min="0" value={draft.speed} onChange={(event) => updateForm(setDraft, "speed", Number(event.target.value || 0))} /></label>
          <label className="charactersField"><span>Bonus biegłości</span><input type="number" min="2" max="9" value={draft.proficiencyBonus} onChange={(event) => updateForm(setDraft, "proficiencyBonus", Number(event.target.value || 2))} /></label>
          <label className="charactersField"><span>Kości wytrzymałości</span><input value={draft.hitDice} onChange={(event) => updateForm(setDraft, "hitDice", event.target.value)} /></label>
        </div>
      );
    }
    return (
      <div className="charactersGrid">
        <label className="charactersField charactersField--full"><span>Umiejętności</span><textarea rows="4" value={draft.skillNotes} onChange={(event) => updateForm(setDraft, "skillNotes", event.target.value)} /></label>
        <label className="charactersField charactersField--full"><span>Rzuty obronne</span><textarea rows="4" value={draft.savingThrowNotes} onChange={(event) => updateForm(setDraft, "savingThrowNotes", event.target.value)} /></label>
        <label className="charactersField charactersField--full"><span>Ekwipunek</span><textarea rows="4" value={draft.equipmentNotes} onChange={(event) => updateForm(setDraft, "equipmentNotes", event.target.value)} /></label>
        <label className="charactersField charactersField--full"><span>Cechy i zdolności</span><textarea rows="4" value={draft.featureNotes} onChange={(event) => updateForm(setDraft, "featureNotes", event.target.value)} /></label>
        <label className="charactersField charactersField--full"><span>Osobowość</span><textarea rows="4" value={draft.personalityNotes} onChange={(event) => updateForm(setDraft, "personalityNotes", event.target.value)} /></label>
        <label className="charactersField charactersField--full"><span>Prywatne notatki</span><textarea rows="5" value={draft.privateNotes} onChange={(event) => updateForm(setDraft, "privateNotes", event.target.value)} /></label>
      </div>
    );
  }

  return (
    <div className="page charactersPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Postacie</h1>
          <p className="pageSubtitle">Bezpieczny rdzeń kart DnD 5e: własne pola mechaniczne i własne notatki.</p>
        </div>
        <button type="button" className="charactersPrimaryBtn" onClick={() => { setModalOpen(true); setStep(0); setBuilderMode("quick"); setDraft(createEmptyForm()); }}>
          + Nowa postać
        </button>
      </div>

      {notice && <div className="charactersNotice">{notice}</div>}
      {loading && <div className="charactersState">Ładowanie postaci...</div>}
      {!loading && error && <div className="charactersError">{error}</div>}

      {!loading && !error && (
        <div className="charactersLayout">
          <section className="charactersSidebar">
            <div className="charactersSidebarTop">
              <h2>Moje postacie</h2>
              <span>{items.length}</span>
            </div>
            {items.length === 0 ? (
              <div className="charactersEmpty">Nie masz jeszcze żadnej postaci.</div>
            ) : (
              items.map((item) => (
                <button key={item.id} type="button" className={`charactersCard${String(item.id) === String(selectedId) ? " is-active" : ""}`} onClick={() => setSelectedId(item.id)}>
                  <div className="charactersCardTop">
                    {item.portraitUrl ? <img src={item.portraitUrl} alt={item.name} className="charactersAvatarImg" /> : <div className="charactersAvatar">{item.name.slice(0, 1).toUpperCase()}</div>}
                    <div>
                      <strong>{item.name}</strong>
                      <div>{item.raceName || "Bez rasy"} • {item.className || "Bez klasy"}</div>
                    </div>
                  </div>
                  <div className="charactersCardMeta">
                    <span>{statusLabel(item.status)}</span>
                    <span>Poziom {item.level}</span>
                  </div>
                </button>
              ))
            )}
          </section>

          <section className="charactersDetail">
            {!selectedId && <div className="charactersEmpty">Wybierz postać z listy albo utwórz nową.</div>}
            {selectedId && detailLoading && <div className="charactersState">Ładowanie karty postaci...</div>}
            {selectedId && !detailLoading && detailError && <div className="charactersError">{detailError}</div>}

            {selectedId && !detailLoading && !detailError && detail && (
              <>
                <div className="charactersHero">
                  <div className="charactersHeroIdentity">
                    {form.portraitUrl ? <img src={form.portraitUrl} alt={form.name} className="charactersHeroAvatarImg" /> : <div className="charactersHeroAvatar">{form.name?.slice(0, 1)?.toUpperCase() || "?"}</div>}
                    <div>
                      <div className="charactersEyebrow">DnD 5e</div>
                      <h2>{form.name || "Bez nazwy"}</h2>
                      <p>{form.raceName || "Rasa?"} • {form.className || "Klasa?"} • poziom {form.level}</p>
                    </div>
                  </div>
                  <div className="charactersHeroMeta">
                    <span>{statusLabel(form.status)}</span>
                    <span>Aktualizacja: {formatDate(detail.updatedAt)}</span>
                  </div>
                </div>

                <div className="charactersPanels">
                  <div className="charactersPanel">
                    <h3>Podstawy</h3>
                    <div className="charactersGrid">
                      <label className="charactersField"><span>Imię</span><input value={form.name} onChange={(event) => updateForm(setForm, "name", event.target.value)} /></label>
                      <label className="charactersField"><span>Status</span><select value={form.status} onChange={(event) => updateForm(setForm, "status", event.target.value)}><option value="DRAFT">Robocza</option><option value="ACTIVE">Aktywna</option><option value="ARCHIVED">Zarchiwizowana</option></select></label>
                      <label className="charactersField"><span>Rasa</span><input value={form.raceName} onChange={(event) => updateForm(setForm, "raceName", event.target.value)} /></label>
                      <label className="charactersField"><span>Klasa</span><input value={form.className} onChange={(event) => updateForm(setForm, "className", event.target.value)} /></label>
                      <label className="charactersField"><span>Podrasa</span><input value={form.subraceName} onChange={(event) => updateForm(setForm, "subraceName", event.target.value)} /></label>
                      <label className="charactersField"><span>Podklasa</span><input value={form.subclassName} onChange={(event) => updateForm(setForm, "subclassName", event.target.value)} /></label>
                      <label className="charactersField"><span>Tło</span><input value={form.backgroundName} onChange={(event) => updateForm(setForm, "backgroundName", event.target.value)} /></label>
                      <label className="charactersField"><span>Charakter</span><input value={form.alignment} onChange={(event) => updateForm(setForm, "alignment", event.target.value)} /></label>
                      <label className="charactersField"><span>Poziom</span><input type="number" min="1" max="20" value={form.level} onChange={(event) => updateForm(setForm, "level", Number(event.target.value || 1))} /></label>
                      <label className="charactersField"><span>XP</span><input type="number" min="0" value={form.experiencePoints} onChange={(event) => updateForm(setForm, "experiencePoints", Number(event.target.value || 0))} /></label>
                      <label className="charactersField charactersField--full"><span>Portret</span><input value={form.portraitUrl || ""} onChange={(event) => updateForm(setForm, "portraitUrl", event.target.value)} placeholder="URL albo data URL" /></label>
                      <label className="charactersField charactersField--full"><span>Wgraj portret</span><input type="file" accept="image/*" onChange={(event) => onPortraitUpload(event, setForm)} /></label>
                    </div>
                  </div>

                  <div className="charactersPanel">
                    <h3>Statystyki</h3>
                    {renderAbilityAllocator(form, setForm)}
                  </div>

                  <div className="charactersPanel">
                    <h3>Walka</h3>
                    <div className="charactersGrid">
                      <label className="charactersField"><span>HP maks.</span><input type="number" min="1" value={form.maxHp} onChange={(event) => updateForm(setForm, "maxHp", Number(event.target.value || 1))} /></label>
                      <label className="charactersField"><span>HP aktualne</span><input type="number" min="0" value={form.currentHp} onChange={(event) => updateForm(setForm, "currentHp", Number(event.target.value || 0))} /></label>
                      <label className="charactersField"><span>HP tymczasowe</span><input type="number" min="0" value={form.tempHp} onChange={(event) => updateForm(setForm, "tempHp", Number(event.target.value || 0))} /></label>
                      <label className="charactersField"><span>AC</span><input type="number" min="1" value={form.armorClass} onChange={(event) => updateForm(setForm, "armorClass", Number(event.target.value || 1))} /></label>
                      <label className="charactersField"><span>Inicjatywa</span><input type="number" value={form.initiativeBonus} onChange={(event) => updateForm(setForm, "initiativeBonus", Number(event.target.value || 0))} /></label>
                      <label className="charactersField"><span>Szybkość</span><input type="number" min="0" value={form.speed} onChange={(event) => updateForm(setForm, "speed", Number(event.target.value || 0))} /></label>
                      <label className="charactersField"><span>Bonus biegłości</span><input type="number" min="2" max="9" value={form.proficiencyBonus} onChange={(event) => updateForm(setForm, "proficiencyBonus", Number(event.target.value || 2))} /></label>
                      <label className="charactersField"><span>Kości wytrzymałości</span><input value={form.hitDice} onChange={(event) => updateForm(setForm, "hitDice", event.target.value)} /></label>
                    </div>
                  </div>

                  <div className="charactersPanel">
                    <h3>Notatki</h3>
                    <div className="charactersGrid">
                      <label className="charactersField charactersField--full"><span>Umiejętności</span><textarea rows="4" value={form.skillNotes} onChange={(event) => updateForm(setForm, "skillNotes", event.target.value)} /></label>
                      <label className="charactersField charactersField--full"><span>Rzuty obronne</span><textarea rows="4" value={form.savingThrowNotes} onChange={(event) => updateForm(setForm, "savingThrowNotes", event.target.value)} /></label>
                      <label className="charactersField charactersField--full"><span>Ekwipunek</span><textarea rows="4" value={form.equipmentNotes} onChange={(event) => updateForm(setForm, "equipmentNotes", event.target.value)} /></label>
                      <label className="charactersField charactersField--full"><span>Cechy i zdolności</span><textarea rows="4" value={form.featureNotes} onChange={(event) => updateForm(setForm, "featureNotes", event.target.value)} /></label>
                      <label className="charactersField charactersField--full"><span>Osobowość</span><textarea rows="4" value={form.personalityNotes} onChange={(event) => updateForm(setForm, "personalityNotes", event.target.value)} /></label>
                      <label className="charactersField charactersField--full"><span>Prywatne notatki</span><textarea rows="5" value={form.privateNotes} onChange={(event) => updateForm(setForm, "privateNotes", event.target.value)} /></label>
                    </div>
                  </div>
                </div>

                <div className="charactersActionsFooter">
                  <button type="button" className="charactersDangerBtn" onClick={handleDelete} disabled={deleting}>{deleting ? "Usuwanie..." : "Usuń postać"}</button>
                  <button type="button" className="charactersPrimaryBtn" onClick={handleSave} disabled={saving}>{saving ? "Zapisywanie..." : "Zapisz kartę"}</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {modalOpen && (
        <div className="charactersModalOverlay" onMouseDown={() => setModalOpen(false)}>
          <div className="charactersModalCard" onMouseDown={(event) => event.stopPropagation()}>
            <div className="charactersModalTop">
              <div className="charactersModalModeTabs">
                <button type="button" className={`charactersModalModeTab${builderMode === "quick" ? " is-active" : ""}`} onClick={() => setBuilderMode("quick")}>Szybki kreator</button>
                <button type="button" className={`charactersModalModeTab${builderMode === "classic" ? " is-active" : ""}`} onClick={() => setBuilderMode("classic")}>Klasyczny wizard</button>
              </div>
              <div className="charactersModalTopCopy">
                <p className="charactersWizardBadge">{builderMode === "quick" ? "Flow inspirowany D&D Beyond" : "Klasyczny kreator krok po kroku"}</p>
                <div className="charactersEyebrow">Kreator DnD 5e</div>
                <h2>Nowa postac</h2>
                <p>{builderMode === "quick" ? "Szybki start z klasa, rasa, tlem, imieniem i portretem oraz gotowym presetem statystyk." : "Pelny wariant krok po kroku dla osob, ktore chca ustawic wszystko recznie."}</p>
              </div>
              <button type="button" className="charactersGhostBtn" onClick={() => setModalOpen(false)}>Zamknij</button>
            </div>

            {builderMode === "quick" ? (
              <div className="quickBuilderBody">
                <QuickCharacterCreator onCreate={createNewCharacter} creating={creating} />
              </div>
            ) : (
              <>
                <div className="charactersWizardProgressMeta quickBuilderClassicMeta">
                  <span>Krok {step + 1} z {STEPS.length}</span>
                  <strong>{progressPercent(step)}%</strong>
                </div>
                <div className="charactersWizardProgress">
                  <div className="charactersWizardProgressBar" style={{ width: `${progressPercent(step)}%` }} />
                </div>
                <div className="charactersStepBar">
                  {STEPS.map((label, index) => (
                    <button key={label} type="button" className={`charactersStep${index === step ? " is-active" : ""}`} onClick={() => setStep(index)}>
                      {index + 1}. {label}
                    </button>
                  ))}
                </div>
                <div className="charactersWizardIntro">
                  <div className="charactersWizardIntroMain">
                    <div className="charactersWizardSectionKicker">{activeStep.kicker}</div>
                    <h3>{activeStep.title}</h3>
                    <p>{activeStep.description}</p>
                  </div>
                  <div className="charactersWizardAsideCard">
                    <div className="charactersWizardAsideLabel">{activeStep.helpTitle}</div>
                    <p>{activeStep.helpBody}</p>
                  </div>
                </div>
                <div className="charactersWizardChecklist">
                  {activeStep.checklist.map((item) => (
                    <div key={item} className="charactersWizardChecklistItem">{item}</div>
                  ))}
                </div>
                <div className="charactersWizardBody">{renderDraftStep()}</div>
                <div className="charactersActionsFooter charactersActionsFooter--wizard">
                  <button type="button" className="charactersGhostBtn" onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0}>Wstecz</button>
                  {step < STEPS.length - 1 ? (
                    <button type="button" className="charactersPrimaryBtn" onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}>Dalej</button>
                  ) : (
                    <button type="button" className="charactersPrimaryBtn" onClick={handleCreate} disabled={creating}>{creating ? "Tworzenie..." : "Utworz postac"}</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

