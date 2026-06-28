import { useEffect, useState } from "react";
import { register } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PublicTopbar from "../components/PublicTopbar";
import AppIcon from "../components/common/AppIcon";

const AUTH_BENEFITS = [
  { icon: "campaign", text: "Kampanie, postacie i notatki w jednym miejscu" },
  { icon: "generators", text: "Generatory, kości i inicjatywa pod ręką" },
  { icon: "friends", text: "Panel dla graczy i Mistrzów Gry" },
];

function getRegisterErrorMessage(err) {
  if (err?.status === 409) {
    return "Konto z tym adresem email już istnieje.";
  }
  if (err?.status === 400 || err?.status === 422) {
    return "Sprawdź dane w formularzu i spróbuj ponownie.";
  }
  if (err?.message?.includes("Brak po")) {
    return err.message;
  }
  return "Nie udało się utworzyć konta. Spróbuj ponownie za chwilę.";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    else if (password.length < 6) nextErrors.password = "Hasło musi mieć co najmniej 6 znaków.";
    if (!password2) nextErrors.password2 = "Powtórz hasło.";
    else if (password !== password2) nextErrors.password2 = "Hasła nie są identyczne.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setLoading(true);

    try {
      await register(email, password);
      navigate("/login", { replace: true });
    } catch (err) {
      const message = getRegisterErrorMessage(err);
      if (err?.status === 409) {
        setFieldErrors((current) => ({ ...current, email: message }));
        setError("");
      } else {
        setError(message);
      }
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authPublicNav">
        <PublicTopbar />
      </div>

      <main className="authWrap">
        <section className="authPanel" aria-labelledby="registerTitle">
          <div className="authIntro">
            <h1 id="registerTitle" className="authTitle">Utwórz konto</h1>
            <p className="authSubtitle">
              Zacznij organizować kampanie, postacie i materiały w jednym miejscu.
            </p>
            <AuthBenefitList />
          </div>

          <form onSubmit={onSubmit} className="authForm">
          <div className={`authField${fieldErrors.email ? " is-invalid" : ""}`}>
            <label className="authLabel" htmlFor="register-email">Email</label>
            <input
              id="register-email"
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
              aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
            />
            {fieldErrors.email ? <small id="register-email-error" className="authFieldError" role="alert">{fieldErrors.email}</small> : null}
          </div>

          <div className={`authField${fieldErrors.password ? " is-invalid" : ""}`}>
            <label className="authLabel" htmlFor="register-password">Hasło</label>
            <input
              id="register-password"
              className="authInput"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((current) => ({ ...current, password: "" }));
              }}
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 6 znaków"
              aria-invalid={fieldErrors.password ? "true" : "false"}
              aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
            />
            {fieldErrors.password ? <small id="register-password-error" className="authFieldError" role="alert">{fieldErrors.password}</small> : null}
          </div>

          <div className={`authField${fieldErrors.password2 ? " is-invalid" : ""}`}>
            <label className="authLabel" htmlFor="register-password-repeat">Powtórz hasło</label>
            <input
              id="register-password-repeat"
              className="authInput"
              value={password2}
              onChange={(e) => {
                setPassword2(e.target.value);
                setFieldErrors((current) => ({ ...current, password2: "" }));
              }}
              type="password"
              autoComplete="new-password"
              placeholder="Powtórz hasło"
              aria-invalid={fieldErrors.password2 ? "true" : "false"}
              aria-describedby={fieldErrors.password2 ? "register-password-repeat-error" : undefined}
            />
            {fieldErrors.password2 ? <small id="register-password-repeat-error" className="authFieldError" role="alert">{fieldErrors.password2}</small> : null}
          </div>

          {error && <div className="authError">{error}</div>}

          <button className="authBtn" disabled={loading} type="submit">
            {loading ? "Tworzenie konta..." : "Zarejestruj"}
          </button>

          <div className="authDivider"><span>Masz już konto?</span></div>

          <div className="authLinks">
            <Link to="/login" className="authLinkMuted">
              Mam już konto
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
