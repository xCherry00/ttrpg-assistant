import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  changePassword,
  deleteAccount,
  getMyProfile,
  updateEmail,
} from "../api/settings";
import { logout as logoutApi } from "../api/auth";
import "../styles/settings.css";

const INITIATIVE_CACHE_KEY = "ttrpg_initiative_rows_v2";
const INITIATIVE_SYSTEM_KEY = "ttrpg_initiative_system_v1";

const NAV_SECTIONS = [
  { id: "account", label: "Konto", icon: "user" },
  { id: "security", label: "Bezpieczeństwo", icon: "lock" },
  { id: "local", label: "Dane lokalne", icon: "database" },
  { id: "danger", label: "Strefa ryzyka", icon: "trash" },
];

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

function Field({ label, error, errorId, children }) {
  return (
    <label className={`settingsField${error ? " is-invalid" : ""}`}>
      <span>{label}</span>
      {children}
      {error ? <small id={errorId} className="settingsFieldError" role="alert">{error}</small> : null}
    </label>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete, invalid, describedBy }) {
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
        aria-invalid={invalid ? "true" : "false"}
        aria-describedby={describedBy}
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
  const [emailFieldErrors, setEmailFieldErrors] = useState({});
  const [emailSuccess, setEmailSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteFieldErrors, setDeleteFieldErrors] = useState({});
  const [miscSuccess, setMiscSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [activeSection, setActiveSection] = useState("account");

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const me = await getMyProfile(token);
        if (cancelled) return;
        setEmail(me.email || "");
        setNewEmail(me.email || "");
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


  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError("");
    setEmailFieldErrors({});
    setEmailSuccess("");
    const nextErrors = {};
    if (!newEmail.trim()) {
      nextErrors.newEmail = "Podaj nowy email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      nextErrors.newEmail = "Podaj poprawny adres email.";
    }
    if (!emailPassword) {
      nextErrors.emailPassword = "Podaj obecne hasło.";
    }
    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      nextErrors.newEmail = "Nowy email musi być inny niż obecny.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setEmailFieldErrors(nextErrors);
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
    setPasswordFieldErrors({});
    setPasswordSuccess("");
    const nextErrors = {};
    if (!currentPassword) {
      nextErrors.currentPassword = "Podaj obecne hasło.";
    }
    if (!newPassword) {
      nextErrors.newPassword = "Podaj nowe hasło.";
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = "Nowe hasło musi mieć co najmniej 6 znaków.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Powtórz nowe hasło.";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Nowe hasła nie są takie same.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setPasswordFieldErrors(nextErrors);
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
    setDeleteFieldErrors({});
    if (!deletePassword) {
      setDeleteFieldErrors({ deletePassword: "Podaj hasło, aby usunąć konto." });
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
                <Field label="Nowy email" error={emailFieldErrors.newEmail} errorId="settings-new-email-error">
                  <input
                    className="settingsInput"
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailFieldErrors((current) => ({ ...current, newEmail: "" }));
                    }}
                    autoComplete="email"
                    aria-invalid={emailFieldErrors.newEmail ? "true" : "false"}
                    aria-describedby={emailFieldErrors.newEmail ? "settings-new-email-error" : undefined}
                  />
                </Field>
                <Field label="Obecne hasło" error={emailFieldErrors.emailPassword} errorId="settings-email-password-error">
                  <PasswordInput
                    value={emailPassword}
                    onChange={(e) => {
                      setEmailPassword(e.target.value);
                      setEmailFieldErrors((current) => ({ ...current, emailPassword: "" }));
                    }}
                    placeholder="Wpisz obecne hasło"
                    autoComplete="current-password"
                    invalid={Boolean(emailFieldErrors.emailPassword)}
                    describedBy={emailFieldErrors.emailPassword ? "settings-email-password-error" : undefined}
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
                <Field label="Obecne hasło" error={passwordFieldErrors.currentPassword} errorId="settings-current-password-error">
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordFieldErrors((current) => ({ ...current, currentPassword: "" }));
                    }}
                    placeholder="Wpisz obecne hasło"
                    autoComplete="current-password"
                    invalid={Boolean(passwordFieldErrors.currentPassword)}
                    describedBy={passwordFieldErrors.currentPassword ? "settings-current-password-error" : undefined}
                  />
                </Field>
                <Field label="Nowe hasło" error={passwordFieldErrors.newPassword} errorId="settings-new-password-error">
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordFieldErrors((current) => ({ ...current, newPassword: "" }));
                    }}
                    placeholder="Wpisz nowe hasło"
                    autoComplete="new-password"
                    invalid={Boolean(passwordFieldErrors.newPassword)}
                    describedBy={passwordFieldErrors.newPassword ? "settings-new-password-error" : undefined}
                  />
                </Field>
                <Field label="Powtórz nowe hasło" error={passwordFieldErrors.confirmPassword} errorId="settings-confirm-password-error">
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordFieldErrors((current) => ({ ...current, confirmPassword: "" }));
                    }}
                    placeholder="Powtórz nowe hasło"
                    autoComplete="new-password"
                    invalid={Boolean(passwordFieldErrors.confirmPassword)}
                    describedBy={passwordFieldErrors.confirmPassword ? "settings-confirm-password-error" : undefined}
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
                <div className={`settingsDangerPassword${deleteFieldErrors.deletePassword ? " is-invalid" : ""}`}>
                  <PasswordInput
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteFieldErrors((current) => ({ ...current, deletePassword: "" }));
                    }}
                    placeholder="Podaj hasło, aby usunąć konto..."
                    autoComplete="current-password"
                    invalid={Boolean(deleteFieldErrors.deletePassword)}
                    describedBy={deleteFieldErrors.deletePassword ? "settings-delete-password-error" : undefined}
                  />
                  {deleteFieldErrors.deletePassword ? (
                    <small id="settings-delete-password-error" className="settingsFieldError" role="alert">
                      {deleteFieldErrors.deletePassword}
                    </small>
                  ) : null}
                </div>
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
