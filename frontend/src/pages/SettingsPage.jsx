import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  changePassword, deleteAccount, getMyProfile,
  updateChatNickColor, updateEmail,
} from "../api/settings";
import { logout as logoutApi } from "../api/auth";
import AccountTabNav from "../components/AccountTabNav";
import "../styles/settings.css";

const THEME_STORAGE_KEY = "ttrpg_theme";
const INITIATIVE_CACHE_KEY = "ttrpg_initiative_rows_v1";
const CHAT_NICK_PRESETS = ["#ffd166","#7bdff2","#cdb4ff","#ff8fab","#80ed99","#f4a261","#b8f2e6","#a0c4ff"];

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function IconEmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <polyline points="2,4 12,13 22,4"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 10 10c0 2.76-2.24 5-5 5h-1a2 2 0 0 0-2 2 2 2 0 0 1-2 2 10 10 0 0 1-10-10A10 10 0 0 1 12 2"/>
      <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
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
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "dark");

  useEffect(() => { applyTheme(theme); }, [theme]);

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
    loadProfile();
    return () => { cancelled = true; };
  }, [token]);

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError(""); setEmailSuccess("");
    if (!newEmail.trim()) { setEmailError("Podaj nowy email"); return; }
    if (!emailPassword) { setEmailError("Podaj obecne hasło"); return; }
    if (newEmail.trim().toLowerCase() === email.toLowerCase()) { setEmailError("Nowy email musi być inny niż obecny"); return; }
    try {
      const updated = await updateEmail(token, newEmail.trim(), emailPassword);
      setEmail(updated.email || ""); setNewEmail(updated.email || ""); setEmailPassword("");
      setEmailSuccess("Email został zaktualizowany.");
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
    } catch (err) {
      setEmailError(err.message || "Nie udało się zmienić emaila.");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError(""); setPasswordSuccess("");
    if (!currentPassword) { setPasswordError("Podaj obecne hasło"); return; }
    if (newPassword.length < 6) { setPasswordError("Nowe hasło musi mieć co najmniej 6 znaków"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Nowe hasła nie są takie same"); return; }
    try {
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordSuccess("Hasło zostało zmienione.");
    } catch (err) {
      setPasswordError(err.message || "Nie udało się zmienić hasła.");
    }
  }

  async function handleChatColorSave(color = chatNickColor) {
    setChatColorError(""); setChatColorSuccess("");
    try {
      const updated = await updateChatNickColor(token, color || "");
      setChatNickColor(updated.chatNickColor || "");
      setChatColorSuccess("Kolor nicku zapisany.");
      window.dispatchEvent(new CustomEvent("ttrpg-chat-color-updated", { detail: { chatNickColor: updated.chatNickColor || "" } }));
    } catch (err) {
      setChatColorError(err.message || "Nie udało się zapisać koloru.");
    }
  }

  function clearInitiativeCache() {
    sessionStorage.removeItem(INITIATIVE_CACHE_KEY);
    setMiscSuccess("Cache inicjatywy wyczyszczony.");
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    if (!deletePassword) { setDeleteError("Podaj hasło, aby usunąć konto"); return; }
    const confirmed = window.confirm("Czy na pewno chcesz usunąć konto? Tej operacji nie da się cofnąć.");
    if (!confirmed) return;
    try {
      await deleteAccount(token, deletePassword);
      logoutApi(); logout();
      navigate("/register", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Nie udało się usunąć konta.");
    }
  }

  return (
    <div className="page settingsPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Konto</h1>
          <p className="pageSubtitle">Zarządzaj profilem, znajomymi i ustawieniami.</p>
        </div>
      </div>
      <AccountTabNav />

      <div className="settingsLayout">
        {/* Row 1: Email + Password */}
        <div className="settingsRow">
          <form className="settingsCard panel-soft" onSubmit={handleChangeEmail}>
            <div className="settingsCardHead">
              <span className="settingsCardIcon"><IconEmail /></span>
              <h2 className="settingsCardTitle">Zmiana emaila</h2>
            </div>
            {loading && <div className="settingsInfo">Ładowanie…</div>}
            {emailError && <div className="settingsMsg settingsMsg--error">{emailError}</div>}
            {emailSuccess && <div className="settingsMsg settingsMsg--success">{emailSuccess}</div>}
            <label className="settingsLabel">Obecny email</label>
            <input className="settingsInput" value={email} readOnly disabled />
            <label className="settingsLabel">Nowy email</label>
            <input className="settingsInput" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" />
            <label className="settingsLabel">Obecne hasło</label>
            <input className="settingsInput" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} autoComplete="current-password" />
            <button className="settingsBtn" type="submit">Zmień email</button>
          </form>

          <form className="settingsCard panel-soft" onSubmit={handleChangePassword}>
            <div className="settingsCardHead">
              <span className="settingsCardIcon"><IconLock /></span>
              <h2 className="settingsCardTitle">Bezpieczeństwo</h2>
            </div>
            {passwordError && <div className="settingsMsg settingsMsg--error">{passwordError}</div>}
            {passwordSuccess && <div className="settingsMsg settingsMsg--success">{passwordSuccess}</div>}
            <label className="settingsLabel">Obecne hasło</label>
            <input className="settingsInput" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            <label className="settingsLabel">Nowe hasło</label>
            <input className="settingsInput" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            <label className="settingsLabel">Powtórz nowe hasło</label>
            <input className="settingsInput" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            <button className="settingsBtn" type="submit">Zmień hasło</button>
          </form>
        </div>

        {/* Wygląd + Dane lokalne */}
        <div className="settingsCard settingsCard--wide panel-soft">
          <div className="settingsCardHead">
            <span className="settingsCardIcon"><IconPalette /></span>
            <h2 className="settingsCardTitle">Wygląd i personalizacja</h2>
          </div>

          <div className="settingsTwoCol">
            <div>
              <p className="settingsHint">Motyw interfejsu</p>
              <div className="themeOptions">
                <button type="button" className={"themeBtn" + (theme === "dark" ? " is-active" : "")} onClick={() => setTheme("dark")}>Ciemny</button>
                <button type="button" className={"themeBtn" + (theme === "light" ? " is-active" : "")} onClick={() => setTheme("light")}>Jasny</button>
              </div>
            </div>

            <div>
              <p className="settingsHint">Kolor nicku na chacie sesji</p>
              {chatColorError && <div className="settingsMsg settingsMsg--error">{chatColorError}</div>}
              {chatColorSuccess && <div className="settingsMsg settingsMsg--success">{chatColorSuccess}</div>}
              <div className="chatColorPreviewRow">
                <span className="settingsLabel">Podgląd</span>
                <strong className="chatColorPreview" style={{ color: chatNickColor || "#dbe7fa" }}>
                  {email.split("@")[0] || "Twój nick"}
                </strong>
              </div>
              <div className="chatColorGrid">
                {CHAT_NICK_PRESETS.map((preset) => (
                  <button key={preset} type="button"
                    className={`chatColorSwatch${chatNickColor === preset ? " is-active" : ""}`}
                    style={{ "--swatch": preset }}
                    onClick={() => { setChatNickColor(preset); handleChatColorSave(preset); }}
                  />
                ))}
              </div>
              <div className="chatColorCustomRow">
                <input className="settingsInput" type="text" value={chatNickColor} onChange={(e) => setChatNickColor(e.target.value)} placeholder="#AABBCC" />
                <button type="button" className="settingsBtn settingsBtnGhost" onClick={() => handleChatColorSave()}>Zapisz</button>
              </div>
            </div>
          </div>

          <div className="settingsDivider" />
          <p className="settingsHint">Dane lokalne</p>
          {miscSuccess && <div className="settingsMsg settingsMsg--success">{miscSuccess}</div>}
          <button type="button" className="settingsBtn settingsBtnGhost settingsBtnInline" onClick={clearInitiativeCache}>
            <IconTrash /> Wyczyść cache inicjatywy
          </button>
        </div>

        {/* Danger */}
        <div className="settingsCard settingsCard--danger panel-soft">
          <div className="settingsCardHead">
            <h2 className="settingsCardTitle">Usuń konto</h2>
          </div>
          <p className="settingsHint">Po usunięciu konta wszystkie Twoje dane zostaną trwale usunięte. Tej operacji nie można cofnąć.</p>
          {deleteError && <div className="settingsMsg settingsMsg--error">{deleteError}</div>}
          <div className="settingsDangerRow">
            <input className="settingsInput" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Podaj hasło…" autoComplete="current-password" />
            <button type="button" className="settingsBtn settingsBtnDanger" onClick={handleDeleteAccount}>Usuń konto</button>
          </div>
        </div>
      </div>
    </div>
  );
}
