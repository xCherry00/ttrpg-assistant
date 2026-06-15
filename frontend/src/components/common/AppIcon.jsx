const ICON_BASE = "/assets/icons/";

const ICON_FILE_BY_NAME = {
  activeCampaigns: "A_Kampanie.png",
  dashboard: "Dashboard.png",
  addFriend: "Dodaj znajomego.png",
  generators: "Generatory.png",
  time: "Godzina.png",
  initiative: "Inicjatywa.png",
  campaign: "Kampania.png",
  compendium: "Kompendium.png",
  notes: "Kompendium.png",
  dice: "Kości.png",
  logo: "Logo.png",
  file: "Plik.png",
  characters: "Postacie.png",
  profile: "Profil.png",
  public: "Public.png",
  search: "Search.png",
  sessions: "Sesje.png",
  glossary: "Słownik.png",
  date: "Termin.png",
  favorite: "Ulubione.png",
  settings: "Ustawienia.png",
  messages: "Wiadomości.png",
  sendMessage: "Wyślij wiadomość.png",
  send: "Wyślij.png",
  blocked: "Zablokowani.png",
  rules: "Zasady.png",
  friends: "Znajomi.png",
};

export function appIconSrc(name) {
  const fileName = ICON_FILE_BY_NAME[name];
  return fileName ? encodeURI(`${ICON_BASE}${fileName}`) : "";
}

export default function AppIcon({ name, className = "", alt = "", decorative = true }) {
  const src = appIconSrc(name);

  if (!src) {
    return null;
  }

  return (
    <img
      className={`appIconAsset${className ? ` ${className}` : ""}`}
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      loading="lazy"
      decoding="async"
    />
  );
}
