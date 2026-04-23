import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import "../styles/glossary.css";

export default function GlossaryPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/glossary");
        const arr = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setTerms(arr);
          setSelectedId(arr[0]?.id ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Nie udało się pobrać słowniczka.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filteredTerms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return terms
      .filter((t) => {
        const termPl = (t.termPl || "").toLowerCase();
        const termEn = (t.termEn || "").toLowerCase();
        const def = (t.definition || "").toLowerCase();
        return !needle || termPl.includes(needle) || termEn.includes(needle) || def.includes(needle);
      })
      .sort((a, b) =>
        (a.termPl || "").localeCompare(b.termPl || "", "pl", { sensitivity: "base" })
      );
  }, [query, terms]);

  const groupedTerms = useMemo(() => {
    const groups = {};
    filteredTerms.forEach((t) => {
      const letter = (t.termPl || "?")[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, "pl"));
  }, [filteredTerms]);

  const selected = useMemo(
    () => filteredTerms.find((t) => t.id === selectedId) || filteredTerms[0] || null,
    [filteredTerms, selectedId]
  );

  useEffect(() => {
    if (!filteredTerms.length) return;
    const stillExists = filteredTerms.some((t) => t.id === selectedId);
    if (!stillExists) setSelectedId(filteredTerms[0].id);
  }, [filteredTerms, selectedId]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Słowniczek</h1>
          <p className="pageSubtitle">
            Pojęcia i terminy ze świata TTRPG. Wybierz hasło z listy po lewej.
          </p>
        </div>
        {!loading && !error && (
          <div className="glossaryCount">
            <span className="glossaryCountNum">{filteredTerms.length}</span>
            <span className="glossaryCountLabel">haseł</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="empty">
          <div className="emptyTitle">Ładowanie…</div>
          <div className="emptyText">Pobieram pojęcia z bazy danych.</div>
        </div>
      )}

      {!loading && error && (
        <div className="empty">
          <div className="emptyTitle">Błąd ładowania</div>
          <div className="emptyText">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="glossarySplit">
          {/* LEFT */}
          <aside className="glossaryLeft">
            <div className="glossarySearch">
              <svg className="glossarySearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="glossarySearchInput"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj pojęcia…"
                aria-label="Szukaj"
              />
              {query && (
                <button
                  className="glossarySearchClear"
                  onClick={() => setQuery("")}
                  type="button"
                  aria-label="Wyczyść"
                >×</button>
              )}
            </div>

            <div className="glossaryList" role="listbox" aria-label="Lista pojęć">
              {groupedTerms.length === 0 && (
                <div className="glossaryEmpty">
                  <div className="emptyTitle">Brak wyników</div>
                  <div className="emptyText">Zmień frazę wyszukiwania.</div>
                </div>
              )}

              {groupedTerms.map(([letter, letterTerms]) => (
                <div key={letter} className="glossaryGroup">
                  <div className="glossaryGroupLetter">{letter}</div>
                  {letterTerms.map((t) => {
                    const active = t.id === (selected?.id ?? null);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`glossaryItem ${active ? "is-active" : ""}`}
                        onClick={() => setSelectedId(t.id)}
                      >
                        <span className="glossaryItemTitle">{t.termPl}</span>
                        {t.termEn && <span className="glossaryItemEn">{t.termEn}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          {/* RIGHT */}
          <section className="glossaryRight">
            {!selected ? (
              <div className="empty">
                <div className="emptyTitle">Wybierz pojęcie</div>
                <div className="emptyText">Kliknij hasło na liście po lewej.</div>
              </div>
            ) : (
              <div className="glossaryDetail">
                {selected.category && (
                  <span className="glossaryDetailCategory">{selected.category}</span>
                )}
                <h2 className="glossaryDetailTitle">{selected.termPl}</h2>
                {selected.termEn && (
                  <div className="glossaryDetailEn">{selected.termEn}</div>
                )}
                <div className="glossaryDetailDivider" />
                <p className="glossaryDetailBody">{selected.definition}</p>
                {selected.tags && (
                  <div className="glossaryDetailTags">
                    {String(selected.tags).split(",").filter(Boolean).map((tag) => (
                      <span key={tag} className="glossaryTag">{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
