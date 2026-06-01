import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  changePassword,
  deleteAccount,
  getMyProfile,
  updateChatNickColor,
  updateEmail,
} from "../api/settings";
import { logout as logoutApi } from "../api/auth";
import "../styles/settings.css";

const THEME_STORAGE_KEY = "ttrpg_theme";
const INITIATIVE_CACHE_KEY = "ttrpg_initiative_rows_v2";
const INITIATIVE_SYSTEM_KEY = "ttrpg_initiative_system_v1";
const CHAT_NICK_PRESETS = ["#1f765f", "#536fae", "#c85c4a", "#20835f", "#b88734", "#64c3b3", "#718078", "#b42318"];

const NAV_SECTIONS = [
  { id: "account", label: "Konto", icon: "user" },
  { id: "security", label: "Bezpieczeństwo", icon: "lock" },
  { id: "appearance", label: "Wygląd", icon: "palette" },
  { id: "chat", label: "Chat sesji", icon: "message" },
  { id: "local", label: "Dane lokalne", icon: "database" },
  { id: "danger", label: "Strefa ryzyka", icon: "trash" },
];

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 7 9-7" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    palette: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 1 10 10c0 2.4-1.9 4.3-4.3 4.3H16a2 2 0 0 0-2 2A2.7 2.7 0 0 1 11.3 21 10 10 0 0 1 12 2Z" />
        <circle cx="8" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="7" r="1" fill="currentColor" />
        <circle cx="16" cy="10" r="1" fill="currentColor" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </>
    ),
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.9 4.9 1.4 1.4" />
        <path d="m17.7 17.7 1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m4.9 19.1 1.4-1.4" />
        <path d="m17.7 6.3 1.4-1.4" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7Z" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.user}</svg>;
}

function Field({ label, children }) {
  return (
    <label className="settingsField">
      <span>{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="settingsPasswordControl">
      <input
        className="settingsInput"
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}>
        <Icon name="eye" size={16} />
      </button>
    </div>
  );
}

function Message({ type, children }) {
  if (!children) return null;
  return <div className={`settingsMsg settingsMsg--${type}`}>{children}</div>;
}

export default function SettingsPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [miscSuccess, setMiscSuccess] = useState("");
  const [chatColorSuccess, setChatColorSuccess] = useState("");
  const [chatColorError, setChatColorError] = useState("");

  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [chatNickColor, setChatNickColor] = useState("");
  const [activeSection, setActiveSection] = useState("account");
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "dark");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const me = await getMyProfile(token);
        if (cancelled) return;
        setEmail(me.email || "");
        setNewEmail(me.email || "");
        setChatNickColor(me.chatNickColor || "");
      } catch {
        if (!cancelled) setEmailError("Nie udało się pobrać danych konta.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const profileName = email ? email.split("@")[0] : "test";
  const displayColor = chatNickColor || "#dbe7fa";

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!newEmail.trim()) {
      setEmailError("Podaj nowy email.");
      return;
    }
    if (!emailPassword) {
      setEmailError("Podaj obecne hasło.");
      return;
    }
    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setEmailError("Nowy email musi być inny niż obecny.");
      return;
    }
    try {
      const updated = await updateEmail(token, newEmail.trim(), emailPassword);
      setEmail(updated.email || "");
      setNewEmail(updated.email || "");
      setEmailPassword("");
      setEmailSuccess("Email został zaktualizowany.");
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
    } catch (err) {
      setEmailError(err.message || "Nie udało się zmienić emaila.");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword) {
      setPasswordError("Podaj obecne hasło.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Nowe hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Nowe hasła nie są takie same.");
      return;
    }
    try {
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Hasło zostało zmienione.");
    } catch (err) {
      setPasswordError(err.message || "Nie udało się zmienić hasła.");
    }
  }

  async function handleChatColorSave(color = chatNickColor) {
    setChatColorError("");
    setChatColorSuccess("");
    try {
      const updated = await updateChatNickColor(token, color || "");
      setChatNickColor(updated.chatNickColor || "");
      setChatColorSuccess("Kolor nicku zapisany.");
      window.dispatchEvent(
        new CustomEvent("ttrpg-chat-color-updated", {
          detail: { chatNickColor: updated.chatNickColor || "" },
        }),
      );
    } catch (err) {
      setChatColorError(err.message || "Nie udało się zapisać koloru.");
    }
  }

  function clearInitiativeCache() {
    const confirmed = window.confirm(
      "Czy na pewno chcesz wyczyścić dane lokalne? Ta akcja nie usuwa konta, kampanii ani postaci.",
    );
    if (!confirmed) return;
    sessionStorage.removeItem(INITIATIVE_CACHE_KEY);
    sessionStorage.removeItem(INITIATIVE_SYSTEM_KEY);
    setMiscSuccess("Cache aplikacji wyczyszczony.");
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("Podaj hasło, aby usunąć konto.");
      return;
    }
    const confirmed = window.confirm("Czy na pewno chcesz usunąć konto? Tej operacji nie da się cofnąć.");
    if (!confirmed) return;
    try {
      await deleteAccount(token, deletePassword);
      logoutApi();
      logout();
      navigate("/register", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Nie udało się usunąć konta.");
    }
  }

  function jumpToSection(id) {
    setActiveSection(id);
  }

  return (
    <div className="page settingsPage">
      <div className="settingsStudio">
        <aside className="settingsIndex settingsGlass">
          <h2>Kategorie</h2>
          <nav>
            {NAV_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? "is-active" : ""}
                onClick={() => jumpToSection(section.id)}
              >
                <span className="settingsIndexIcon">
                  <Icon name={section.icon} size={15} />
                </span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="settingsStack" aria-live="polite">
          <section id="settings-account" className={`settingsPanel settingsPanel--featured${activeSection === "account" ? " is-active" : ""}`}>
              <div className="settingsPanelHead">
                <span className="settingsPanelIcon">
                  <Icon name="user" />
                </span>
                <div>
                  <h2>Konto</h2>
                  <p>Zarządzaj swoimi danymi konta i adresem email.</p>
                </div>
              </div>
              {loading && <div className="settingsInfo">Ładowanie danych konta...</div>}
              <Message type="error">{emailError}</Message>
              <Message type="success">{emailSuccess}</Message>
              <form className="settingsFormGrid" onSubmit={handleChangeEmail}>
                <Field label="Obecny email">
                  <input className="settingsInput" value={email} readOnly disabled />
                </Field>
                <Field label="Nowy email">
                  <input
                    className="settingsInput"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
                <Field label="Obecne hasło">
                  <PasswordInput
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Wpisz obecne hasło"
                    autoComplete="current-password"
                  />
                </Field>
                <div className="settingsFormAction">
                  <button className="settingsBtn settingsBtnPrimary" type="submit">
                    <Icon name="check" />
                    Zmień email
                  </button>
                </div>
              </form>
          </section>

          <section id="settings-security" className={`settingsPanel${activeSection === "security" ? " is-active" : ""}`}>
              <div className="settingsPanelHead">
                <span className="settingsPanelIcon">
                  <Icon name="lock" />
                </span>
                <div>
                  <h2>Bezpieczeństwo</h2>
                  <p>Zmień hasło i pilnuj dostępu do swojej biblioteki kampanii.</p>
                </div>
              </div>
              <Message type="error">{passwordError}</Message>
              <Message type="success">{passwordSuccess}</Message>
              <form className="settingsFormGrid" onSubmit={handleChangePassword}>
                <Field label="Obecne hasło">
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Wpisz obecne hasło"
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="Nowe hasło">
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Wpisz nowe hasło"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Powtórz nowe hasło">
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Powtórz nowe hasło"
                    autoComplete="new-password"
                  />
                </Field>
                <div className="settingsFormAction">
                  <button className="settingsBtn settingsBtnPrimary" type="submit">
                    <Icon name="check" />
                    Zmień hasło
                  </button>
                </div>
              </form>
          </section>

          <section id="settings-appearance" className={`settingsPanel${activeSection === "appearance" ? " is-active" : ""}`}>
              <div className="settingsPanelHead">
                <span className="settingsPanelIcon">
                  <Icon name="palette" />
                </span>
                <div>
                  <h2>Wygląd</h2>
                  <p>Wybierz motyw aplikacji.</p>
                </div>
              </div>
              <div className="settingsChoiceGrid">
                <button
                  type="button"
                  className={`settingsThemeCard${theme === "dark" ? " is-active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <Icon name="moon" />
                  <strong>Ciemny</strong>
                  <span>Motyw ciemny</span>
                </button>
                <button
                  type="button"
                  className={`settingsThemeCard${theme === "light" ? " is-active" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  <Icon name="sun" />
                  <strong>Jasny</strong>
                  <span>Motyw jasny</span>
                </button>
              </div>
          </section>

          <section id="settings-chat" className={`settingsPanel${activeSection === "chat" ? " is-active" : ""}`}>
              <div className="settingsPanelHead">
                <span className="settingsPanelIcon">
                  <Icon name="sparkles" />
                </span>
                <div>
                  <h2>Chat sesji</h2>
                  <p>Ustaw kolor nicku dla wiadomości na czacie sesji.</p>
                </div>
              </div>
              <Message type="error">{chatColorError}</Message>
              <Message type="success">{chatColorSuccess}</Message>
              <div className="settingsChatPreview">
                <span>Podgląd</span>
                <p>
                  <strong style={{ color: displayColor }}>{profileName}</strong> Przykładowa wiadomość na czacie sesji.
                </p>
              </div>
              <div className="chatColorGrid">
                {CHAT_NICK_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`chatColorSwatch${chatNickColor === preset ? " is-active" : ""}`}
                    style={{ "--swatch": preset }}
                    onClick={() => setChatNickColor(preset)}
                    aria-label={`Ustaw kolor ${preset}`}
                    title={preset}
                  />
                ))}
              </div>
              <div className="chatColorCustomRow">
                <input
                  className="settingsInput"
                  type="text"
                  value={chatNickColor}
                  onChange={(e) => setChatNickColor(e.target.value)}
                  placeholder="#AABBCC"
                />
                <button type="button" className="settingsBtn settingsBtnGhost" onClick={() => handleChatColorSave()}>
                  Zapisz
                </button>
              </div>
          </section>

          <section id="settings-local" className={`settingsPanel${activeSection === "local" ? " is-active" : ""}`}>
              <div className="settingsPanelHead">
                <span className="settingsPanelIcon">
                  <Icon name="database" />
                </span>
                <div>
                  <h2>Dane lokalne</h2>
                  <p>Ta akcja usuwa dane zapisane lokalnie w przeglądarce, np. cache narzędzi. Nie usuwa konta, kampanii ani postaci.</p>
                </div>
              </div>
              <Message type="success">{miscSuccess}</Message>
              <div className="settingsWarningBox settingsWarningBox--soft">
                <Icon name="database" />
                <span>Usunięcie danych lokalnych nie usuwa konta, kampanii ani postaci.</span>
              </div>
              <button type="button" className="settingsBtn settingsBtnGhost settingsBtnInline" onClick={clearInitiativeCache}>
                <Icon name="trash" />
                Wyczyść cache aplikacji
              </button>
          </section>

          <section id="settings-danger" className={`settingsPanel settingsPanel--danger${activeSection === "danger" ? " is-active" : ""}`}>
              <div className="settingsPanelHead">
                <span className="settingsPanelIcon">
                  <Icon name="trash" />
                </span>
                <div>
                  <h2>Strefa ryzyka</h2>
                  <p>Usunięcie konta jest trwałe i nie da się go cofnąć.</p>
                </div>
              </div>
              <Message type="error">{deleteError}</Message>
              <div className="settingsDangerRow">
                <PasswordInput
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Podaj hasło, aby usunąć konto..."
                  autoComplete="current-password"
                />
                <button type="button" className="settingsBtn settingsBtnDanger" onClick={handleDeleteAccount}>
                  Usuń konto
                </button>
              </div>
              <div className="settingsWarningBox settingsWarningBox--danger">
                <Icon name="trash" />
                <span><strong>Uwaga!</strong> Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte. Nie usuwamy kont innych graczy. Usuwasz tylko swoje konto.</span>
              </div>
          </section>
        </main>
      </div>
    </div>
  );
}
