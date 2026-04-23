import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getMyProfile, updateDisplayName } from "../api/settings";
import AccountTabNav from "../components/AccountTabNav";
import "../styles/profile.css";

function getAvatarStorageKey(email) {
  return `ttrpg_avatar_${email || "default"}`;
}

function getRoleLabel(profile) {
  const role = (profile?.role || "PLAYER").toUpperCase();
  const roleLabel = role === "PLAYER" ? "GRACZ" : role;
  return profile?.isMg ? `${roleLabel} + MG` : roleLabel;
}

export default function ProfilePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const [displayNameInput, setDisplayNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  const [avatarSrc, setAvatarSrc] = useState("");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await getMyProfile(token);
        if (!cancelled) {
          setProfile(me);
          setDisplayNameInput(me?.displayName || (me?.email ? me.email.split("@")[0] : ""));
          const savedAvatar = localStorage.getItem(getAvatarStorageKey(me?.email));
          setAvatarSrc(savedAvatar || "");
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Nie udało się pobrać profilu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const displayName = useMemo(() => {
    if (profile?.displayName?.trim()) return profile.displayName.trim();
    if (profile?.email) return profile.email.split("@")[0];
    return "Użytkownik";
  }, [profile]);

  const avatarLabel = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName]);

  async function handleSaveName(event) {
    event.preventDefault();
    setNameError("");
    setNameSuccess("");
    const trimmed = displayNameInput.trim();
    if (trimmed.length < 2) {
      setNameError("Nazwa użytkownika musi mieć co najmniej 2 znaki.");
      return;
    }
    setNameSaving(true);
    try {
      const updated = await updateDisplayName(token, trimmed);
      setProfile((prev) => ({ ...(prev || {}), ...updated, displayName: updated.displayName || trimmed }));
      setDisplayNameInput(updated.displayName || trimmed);
      setNameSuccess("Zapisano.");
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
    } catch (err) {
      setNameError(err?.message || "Nie udało się zapisać.");
    } finally {
      setNameSaving(false);
    }
  }

  function handleAvatarChange(event) {
    setAvatarError("");
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Wybierz plik graficzny (PNG/JPG/WebP)."); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Maksymalny rozmiar avatara to 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      localStorage.setItem(getAvatarStorageKey(profile?.email), dataUrl);
      setAvatarSrc(dataUrl);
      window.dispatchEvent(new Event("ttrpg-profile-updated"));
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    localStorage.removeItem(getAvatarStorageKey(profile?.email));
    setAvatarSrc("");
    window.dispatchEvent(new Event("ttrpg-profile-updated"));
  }

  return (
    <div className="page profilePage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Konto</h1>
          <p className="pageSubtitle">Zarządzaj profilem, znajomymi i ustawieniami.</p>
        </div>
      </div>
      <AccountTabNav />

      {loading && <div className="profileInfo">Ładowanie profilu…</div>}
      {error && <div className="profileError">{error}</div>}

      {!loading && !error && (
        <div className="profileLayout">
          {/* Hero — wyśrodkowany avatar + tożsamość */}
          <section className="profileHero panel">
            <div className="profileHeroAvatar" aria-hidden="true">
              {avatarSrc
                ? <img src={avatarSrc} alt="Avatar użytkownika" className="profileAvatarImg" />
                : avatarLabel}
            </div>

            <div className="profileHeroIdentity">
              <h2 className="profileHeroName">{displayName}</h2>
              <div className="profileHeroEmail">{profile?.email || "Brak emaila"}</div>
              <div className="profileHeroBadge">{getRoleLabel(profile)}</div>
            </div>

            <div className="profileHeroAvatarActions">
              <label className="profileAvatarBtn" htmlFor="avatar-upload">Zmień avatar</label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} />
              {avatarSrc && (
                <button type="button" className="profileAvatarBtn is-ghost" onClick={handleRemoveAvatar}>Usuń</button>
              )}
            </div>
            {avatarError && <div className="profileInlineError">{avatarError}</div>}
          </section>

          {/* Edit + info */}
          <section className="profileDetails panel-soft">
            <h3 className="profileSectionTitle">Nazwa wyświetlana</h3>
            <form className="profileEdit" onSubmit={handleSaveName}>
              <div className="profileEditRow">
                <input
                  id="profile-display-name"
                  className="profileInput"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  maxLength={120}
                  placeholder="Np. Mistrz Gry"
                />
                <button type="submit" className="profileSaveBtn" disabled={nameSaving}>
                  {nameSaving ? "Zapisuję…" : "Zapisz"}
                </button>
              </div>
              {nameError && <div className="profileInlineError">{nameError}</div>}
              {nameSuccess && <div className="profileInlineSuccess">{nameSuccess}</div>}
            </form>

            <div className="profileDivider" />

            <h3 className="profileSectionTitle">Informacje o koncie</h3>
            <div className="profileGrid">
              <div className="profileField">
                <div className="profileLabel">Email</div>
                <div className="profileValue">{profile?.email || "Brak"}</div>
              </div>
              <div className="profileField">
                <div className="profileLabel">Rola</div>
                <div className="profileValue">{getRoleLabel(profile)}</div>
              </div>
              <div className="profileField">
                <div className="profileLabel">ID konta</div>
                <div className="profileValue">#{profile?.id ?? "—"}</div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
