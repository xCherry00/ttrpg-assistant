import { useEffect, useState } from "react";
import { forgotPassword, login, resetPassword } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import PublicTopbar from "../components/PublicTopbar";
import AppIcon from "../components/common/AppIcon";

const AUTH_BENEFITS = [
  { icon: "campaign", text: "Kampanie, postacie i notatki w jednym miejscu" },
  { icon: "generators", text: "Generatory, kości i inicjatywa pod ręką" },
  { icon: "friends", text: "Panel dla graczy i Mistrzów Gry" },
];

function getLoginErrorMessage(err) {
  if (err?.status === 401) {
    return "Nieprawidłowy email lub hasło.";
  }
  if (err?.message?.includes("Brak po")) {
    return err.message;
  }
  return "Nie udało się zalogować. Spróbuj ponownie za chwilę.";
}

export default function LoginPage() {
  const { loginWithToken, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordRepeat, setResetPasswordRepeat] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFieldErrors, setResetFieldErrors] = useState({});

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Podaj adres email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Podaj poprawny adres email.";
    if (!password) nextErrors.password = "Podaj hasło.";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await login(email, password);
      loginWithToken(res.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  function openResetPanel() {
    setResetOpen(true);
    setResetEmail((current) => current || email.trim());
    setResetStatus("");
    setResetError("");
    setResetFieldErrors({});
  }

  async function onForgotPassword(e) {
    e.preventDefault();
    setResetStatus("");
    setResetError("");

    const nextErrors = {};
    const normalizedEmail = resetEmail.trim();
    if (!normalizedEmail) nextErrors.resetEmail = "Podaj adres email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) nextErrors.resetEmail = "Podaj poprawny adres email.";
    if (Object.keys(nextErrors).length > 0) {
      setResetFieldErrors(nextErrors);
      return;
    }

    setResetFieldErrors({});
    setResetLoading(true);
    try {
      const response = await forgotPassword(normalizedEmail);
      if (response.resetToken) {
        setResetToken(response.resetToken);
        setResetStatus("Wygenerowano token resetu. Ustaw nowe haslo ponizej.");
      } else {
        const localMailInfo = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? " W lokalnym Dockerze wiadomość odbierzesz w Mailpit: http://localhost:8025."
          : "";
        setResetStatus(`Jeżeli konto istnieje, instrukcja resetowania hasła została przygotowana.${localMailInfo}`);
      }
    } catch (err) {
      setResetError(err.message || "Nie udalo sie rozpoczac resetowania hasla.");
    } finally {
      setResetLoading(false);
    }
  }

  async function onResetPassword(e) {
    e.preventDefault();
    setResetStatus("");
    setResetError("");

    const nextErrors = {};
    if (!resetToken.trim()) nextErrors.resetToken = "Wklej token resetu.";
    if (!resetPasswordValue) nextErrors.resetPasswordValue = "Podaj nowe haslo.";
    else if (resetPasswordValue.length < 8) nextErrors.resetPasswordValue = "Nowe haslo musi miec co najmniej 8 znakow.";
    if (!resetPasswordRepeat) nextErrors.resetPasswordRepeat = "Powtorz nowe haslo.";
    else if (resetPasswordValue !== resetPasswordRepeat) nextErrors.resetPasswordRepeat = "Hasla nie sa identyczne.";
    if (Object.keys(nextErrors).length > 0) {
      setResetFieldErrors(nextErrors);
      return;
    }

    setResetFieldErrors({});
    setResetLoading(true);
    try {
      await resetPassword(resetToken.trim(), resetPasswordValue);
      setResetStatus("Haslo zostalo zmienione. Mozesz sie zalogowac.");
      setPassword("");
      setResetToken("");
      setResetPasswordValue("");
      setResetPasswordRepeat("");
    } catch (err) {
      setResetError(err.message || "Nie udalo sie zmienic hasla.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authPublicNav">
        <PublicTopbar />
      </div>

      <main className="authWrap">
        <section className="authPanel" aria-labelledby="loginTitle">
          <div className="authIntro">
            <h1 id="loginTitle" className="authTitle">Logowanie</h1>
            <p className="authSubtitle">
              Wróć do swoich kampanii, sesji i narzędzi RPG.
            </p>
            <AuthBenefitList />
          </div>

          <form onSubmit={onSubmit} className="authForm">
          <div className={`authField${fieldErrors.email ? " is-invalid" : ""}`}>
            <label className="authLabel" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="authInput"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((current) => ({ ...current, email: "" }));
              }}
              autoComplete="email"
              placeholder="twoj@email.pl"
              aria-invalid={fieldErrors.email ? "true" : "false"}
              aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            />
            {fieldErrors.email ? <small id="login-email-error" className="authFieldError" role="alert">{fieldErrors.email}</small> : null}
          </div>

          <div className={`authField${fieldErrors.password ? " is-invalid" : ""}`}>
            <label className="authLabel" htmlFor="password">Hasło</label>
            <input
              id="password"
              name="password"
              className="authInput"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((current) => ({ ...current, password: "" }));
              }}
              type="password"
              autoComplete="current-password"
              placeholder="Wpisz swoje hasło"
              aria-invalid={fieldErrors.password ? "true" : "false"}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
            />
            {fieldErrors.password ? <small id="login-password-error" className="authFieldError" role="alert">{fieldErrors.password}</small> : null}
          </div>

          <button type="button" className="authForgotButton" onClick={openResetPanel}>
            Nie pamiętam hasła
          </button>

          {resetOpen ? (
            <section className="authResetPanel" aria-label="Resetowanie hasła">
              <div className="authResetHeader">
                <div>
                  <h2>Reset hasła</h2>
                  <p>Podaj email konta, a następnie ustaw nowe hasło.</p>
                </div>
                <button type="button" className="authResetClose" onClick={() => setResetOpen(false)} aria-label="Zamknij reset hasła">
                  ×
                </button>
              </div>
              <div className="authResetForm">
                <div className={`authField${resetFieldErrors.resetEmail ? " is-invalid" : ""}`}>
                  <label className="authLabel" htmlFor="reset-email">Email do resetu</label>
                  <input
                    id="reset-email"
                    className="authInput"
                    type="email"
                    value={resetEmail}
                    onChange={(event) => {
                      setResetEmail(event.target.value);
                      setResetFieldErrors((current) => ({ ...current, resetEmail: "" }));
                    }}
                    autoComplete="email"
                    placeholder="twoj@email.pl"
                    aria-invalid={resetFieldErrors.resetEmail ? "true" : "false"}
                    aria-describedby={resetFieldErrors.resetEmail ? "reset-email-error" : undefined}
                  />
                  {resetFieldErrors.resetEmail ? <small id="reset-email-error" className="authFieldError" role="alert">{resetFieldErrors.resetEmail}</small> : null}
                </div>
                <button className="authSecondaryBtn" disabled={resetLoading} type="button" onClick={onForgotPassword}>
                  {resetLoading ? "Wysyłanie..." : "Wyślij instrukcję"}
                </button>
              </div>

              <div className="authResetForm">
                <div className={`authField${resetFieldErrors.resetToken ? " is-invalid" : ""}`}>
                  <label className="authLabel" htmlFor="reset-token">Token resetu</label>
                  <input
                    id="reset-token"
                    className="authInput"
                    value={resetToken}
                    onChange={(event) => {
                      setResetToken(event.target.value);
                      setResetFieldErrors((current) => ({ ...current, resetToken: "" }));
                    }}
                    autoComplete="one-time-code"
                    placeholder="Wklej token z wiadomosci"
                    aria-invalid={resetFieldErrors.resetToken ? "true" : "false"}
                    aria-describedby={resetFieldErrors.resetToken ? "reset-token-error" : undefined}
                  />
                  {resetFieldErrors.resetToken ? <small id="reset-token-error" className="authFieldError" role="alert">{resetFieldErrors.resetToken}</small> : null}
                </div>
                <div className={`authField${resetFieldErrors.resetPasswordValue ? " is-invalid" : ""}`}>
                  <label className="authLabel" htmlFor="reset-password">Nowe hasło</label>
                  <input
                    id="reset-password"
                    className="authInput"
                    type="password"
                    value={resetPasswordValue}
                    onChange={(event) => {
                      setResetPasswordValue(event.target.value);
                      setResetFieldErrors((current) => ({ ...current, resetPasswordValue: "" }));
                    }}
                    autoComplete="new-password"
                    placeholder="Minimum 8 znakow"
                    aria-invalid={resetFieldErrors.resetPasswordValue ? "true" : "false"}
                    aria-describedby={resetFieldErrors.resetPasswordValue ? "reset-password-error" : undefined}
                  />
                  {resetFieldErrors.resetPasswordValue ? <small id="reset-password-error" className="authFieldError" role="alert">{resetFieldErrors.resetPasswordValue}</small> : null}
                </div>
                <div className={`authField${resetFieldErrors.resetPasswordRepeat ? " is-invalid" : ""}`}>
                  <label className="authLabel" htmlFor="reset-password-repeat">Powtórz nowe hasło</label>
                  <input
                    id="reset-password-repeat"
                    className="authInput"
                    type="password"
                    value={resetPasswordRepeat}
                    onChange={(event) => {
                      setResetPasswordRepeat(event.target.value);
                      setResetFieldErrors((current) => ({ ...current, resetPasswordRepeat: "" }));
                    }}
                    autoComplete="new-password"
                    placeholder="Powtorz haslo"
                    aria-invalid={resetFieldErrors.resetPasswordRepeat ? "true" : "false"}
                    aria-describedby={resetFieldErrors.resetPasswordRepeat ? "reset-password-repeat-error" : undefined}
                  />
                  {resetFieldErrors.resetPasswordRepeat ? <small id="reset-password-repeat-error" className="authFieldError" role="alert">{resetFieldErrors.resetPasswordRepeat}</small> : null}
                </div>
                <button className="authSecondaryBtn authSecondaryBtn--solid" disabled={resetLoading} type="button" onClick={onResetPassword}>
                  Ustaw nowe hasło
                </button>
              </div>
              {resetStatus ? <div className="authSuccess">{resetStatus}</div> : null}
              {resetError ? <div className="authError">{resetError}</div> : null}
            </section>
          ) : null}

          {error && <div className="authError">{error}</div>}

          <button className="authBtn" disabled={loading} type="submit">
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>

          <div className="authDivider"><span>Nie masz konta?</span></div>

          <div className="authLinks">
            <Link to="/register" className="authLinkMuted">
              Nie mam konta
            </Link>
            <Link to="/" className="authLinkMuted">
              Wróć na stronę główną
            </Link>
          </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function AuthBenefitList() {
  return (
    <ul className="authBenefitList">
      {AUTH_BENEFITS.map((item) => (
        <li key={item.text}>
          <span className={`authBenefitIcon authBenefitIcon--${item.icon}`} aria-hidden="true">
            <AppIcon name={item.icon} />
          </span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
