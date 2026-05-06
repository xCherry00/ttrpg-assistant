import { useEffect, useState } from "react";
import { register } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Rejestracja nie powiodła się");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="panel authPanel">
        <div className="authIntro">
          <span className="pageEyebrow">Nowe konto</span>
          <h1 className="authTitle">Rejestracja</h1>
          <p className="authSubtitle">
            Załóż konto i zbuduj własne centrum sesji z generatorami, kampaniami i szybkimi narzędziami.
          </p>
          <div className="authHighlights">
            <div className="authHighlight">
              <strong>Własne dane</strong>
              <span>Ostatnie wygenerowane treści zostają przypisane do Twojego konta.</span>
            </div>
            <div className="authHighlight">
              <strong>Gotowe do rozbudowy</strong>
              <span>Układ aplikacji jest przygotowany na dalsze moduły i workflow sesyjny.</span>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="authForm">
          <div className="authField">
            <label className="authLabel">Email</label>
            <input
              className="authInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="twoj@email.pl"
              required
            />
          </div>

          <div className="authField">
            <label className="authLabel">Hasło</label>
            <input
              className="authInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 6 znaków"
              required
            />
          </div>

          <div className="authField">
            <label className="authLabel">Powtórz hasło</label>
            <input
              className="authInput"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Powtórz hasło"
              required
            />
          </div>

          {error && <div className="authError">{error}</div>}

          <button className="authBtn" disabled={loading} type="submit">
            {loading ? "Tworzenie konta..." : "Zarejestruj"}
          </button>

          <div className="authLinks">
            <Link to="/login" className="authLinkMuted">
              Mam już konto
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
