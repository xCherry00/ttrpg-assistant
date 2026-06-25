import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/home.css";

function BrandMark() {
  return (
    <span className="homeLogoMark" aria-hidden="true">
      <span />
    </span>
  );
}

export default function PublicTopbar({ className = "" }) {
  const { isLoggedIn } = useAuth();
  const primaryTarget = isLoggedIn ? "/dashboard" : "/register";
  const primaryLabel = isLoggedIn ? "Przejdź do aplikacji" : "Utwórz konto";

  return (
    <header className={`homeNavbar${className ? ` ${className}` : ""}`} aria-label="Główna nawigacja">
      <Link to="/" className="homeBrand" aria-label="TTRPG Assistant - strona główna">
        <BrandMark />
        <span>
          <strong>TTRPG</strong> Assistant
        </span>
      </Link>

      <nav className="homeNavbarActions" aria-label="Akcje konta">
        <Link to="/legal" className="homeTextLink">
          Licencje i źródła
        </Link>
        {!isLoggedIn && (
          <Link to="/login" className="homeTextLink">
            Zaloguj się
          </Link>
        )}
        <Link to={primaryTarget} className="homeButton homeButton--small">
          {primaryLabel}
        </Link>
      </nav>
    </header>
  );
}
