import { useEffect, useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

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
    <div className="authWrap">
      <div className="panel authPanel">
        <div className="authIntro">
          <span className="pageEyebrow">Powrót do sesji</span>
          <h1 className="authTitle">Logowanie</h1>
          <p className="authSubtitle">
            Wejdź do swojego panelu i wróć do kampanii, generatorów oraz szybkich narzędzi przy stole.
          </p>
          <div className="authHighlights">
            <div className="authHighlight">
              <strong>Dashboard sesji</strong>
              <span>Ostatnie wyniki i najważniejsze akcje pod ręką.</span>
            </div>
            <div className="authHighlight">
              <strong>Tryb MG i gracza</strong>
              <span>Jedna aplikacja, ale czytelnie podzielona na role.</span>
            </div>
          </div>
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

          <div className="authLinks">
            <Link to="/register" className="authLinkMuted">
              Nie mam konta
            </Link>
            <Link to="/" className="authLinkMuted">
              Wróć na stronę główną
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
