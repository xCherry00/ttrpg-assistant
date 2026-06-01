import { useEffect, useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const AUTH_BENEFITS = [
  { icon: "campaigns", text: "Kampanie, postacie i notatki w jednym miejscu" },
  { icon: "tools", text: "Generatory, kości i inicjatywa pod ręką" },
  { icon: "players", text: "Panel dla graczy i Mistrzów Gry" },
];

export default function LoginPage() {
  const { loginWithToken, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      loginWithToken(res.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <AuthTopbar />

      <main className="authWrap">
        <section className="authPanel" aria-labelledby="loginTitle">
          <div className="authIntro">
            <span className="authMark" aria-hidden="true" />
            <h1 id="loginTitle" className="authTitle">Logowanie</h1>
            <p className="authSubtitle">
              Wróć do swoich kampanii, sesji i narzędzi RPG.
            </p>
            <AuthBenefitList />
          </div>

          <form onSubmit={onSubmit} className="authForm">
          <div className="authField">
            <label className="authLabel" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="authInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="twoj@email.pl"
              required
            />
          </div>

          <div className="authField">
            <label className="authLabel" htmlFor="password">Hasło</label>
            <input
              id="password"
              name="password"
              className="authInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Wpisz swoje hasło"
              required
            />
          </div>

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

function AuthTopbar() {
  return (
    <header className="authTopbar">
      <Link to="/" className="authBrand" aria-label="TTRPG Assistant">
        <span className="authLogo" aria-hidden="true" />
        <span><strong>TTRPG</strong> Assistant</span>
      </Link>
      <div className="authTopbar__actions">
        <Link to="/login" className="authTopbarLink">Zaloguj się</Link>
        <Link to="/register" className="authTopbarCta">Rozpocznij za darmo</Link>
      </div>
    </header>
  );
}

function AuthBenefitList() {
  return (
    <ul className="authBenefitList">
      {AUTH_BENEFITS.map((item) => (
        <li key={item.text}>
          <span className="authBenefitIcon" aria-hidden="true">
            <AuthBenefitIcon name={item.icon} />
          </span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function AuthBenefitIcon({ name }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const icons = {
    campaigns: (
      <>
        <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Z" />
        <path d="M9 8h6" />
        <path d="M9 12h5" />
      </>
    ),
    tools: (
      <>
        <path d="M5 19 19 5" />
        <path d="m14 5 5 5" />
        <path d="M4 8h4" />
        <path d="M16 20h4" />
        <path d="M8 4v4" />
        <path d="M20 16v4" />
      </>
    ),
    players: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5" />
        <path d="M16 11a2.5 2.5 0 1 0 0-5" />
        <path d="M17 14c2 .4 3.2 1.9 3.5 5" />
      </>
    ),
  };
  return <svg {...common}>{icons[name] || icons.campaigns}</svg>;
}
