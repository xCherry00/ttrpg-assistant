import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import "../styles/glossary.css";

function categoryLabel(value) {
  return String(value || "podstawy").toUpperCase();
}

function splitSentences(value) {
  return String(value || "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function detailDefinition(term) {
  return term?.definition || "Brak definicji w bazie danych.";
}

function detailExample(term) {
  const explicitExample = term?.example || term?.usageExample || term?.exampleUsage;
  if (explicitExample) return explicitExample;

  const firstSentence = splitSentences(term?.definition)[0] || "wybrane pojecie jest uzywane podczas rozmowy przy stole";
  return `Przy stole: "${term?.termPl || "Haslo"}" - ${firstSentence}`;
}

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
        if (!cancelled) setError(e?.message || "Nie udalo sie pobrac slownika.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTerms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return terms
      .filter((term) => {
        const termPl = (term.termPl || "").toLowerCase();
        const termEn = (term.termEn || "").toLowerCase();
        const definition = (term.definition || "").toLowerCase();
        return !needle || termPl.includes(needle) || termEn.includes(needle) || definition.includes(needle);
      })
      .sort((a, b) => (a.termPl || "").localeCompare(b.termPl || "", "pl", { sensitivity: "base" }));
  }, [query, terms]);

  const selected = useMemo(
    () => filteredTerms.find((term) => term.id === selectedId) || filteredTerms[0] || null,
    [filteredTerms, selectedId],
  );

  useEffect(() => {
    if (!filteredTerms.length) return;
    const stillExists = filteredTerms.some((term) => term.id === selectedId);
    if (!stillExists) setSelectedId(filteredTerms[0].id);
  }, [filteredTerms, selectedId]);

  return (
    <div className="page glossaryPage">
      {loading && (
        <div className="glossaryState">
          <strong>Ladowanie...</strong>
          <span>Pobieram pojecia z bazy danych.</span>
        </div>
      )}

      {!loading && error && (
        <div className="glossaryState">
          <strong>Blad ladowania</strong>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="glossarySplit">
          <aside className="glossaryLeft" aria-label="Lista pojec">
            <div className="glossarySearch">
              <svg className="glossarySearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="glossarySearchInput"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Szukaj pojecia..."
                aria-label="Szukaj pojecia"
              />
              {query ? (
                <button
                  className="glossarySearchClear"
                  onClick={() => setQuery("")}
                  type="button"
                  aria-label="Wyczysc wyszukiwanie"
                >
                  x
                </button>
              ) : null}
            </div>

            <div className="glossaryList" role="listbox" aria-label="Lista pojec">
              {filteredTerms.length === 0 ? (
                <div className="glossaryEmpty">
                  <strong>Brak wynikow</strong>
                  <span>Zmien fraze wyszukiwania.</span>
                </div>
              ) : filteredTerms.map((term) => {
                const active = term.id === (selected?.id ?? null);
                return (
                  <button
                    key={term.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`glossaryItem${active ? " is-active" : ""}`}
                    onClick={() => setSelectedId(term.id)}
                  >
                    <span className="glossaryItemTitle">{term.termPl}</span>
                    {term.termEn ? <span className="glossaryItemEn">{term.termEn}</span> : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="glossaryRight" aria-label="Tresci hasla">
            {!selected ? (
              <div className="glossaryState">
                <strong>Wybierz pojecie</strong>
                <span>Kliknij haslo na liscie po lewej.</span>
              </div>
            ) : (
              <article className="glossaryDetail">
                <span className="glossaryDetailCategory">{categoryLabel(selected.category)}</span>
                <h2 className="glossaryDetailTitle">{selected.termPl}</h2>
                {selected.termEn ? <div className="glossaryDetailEn">{selected.termEn}</div> : null}

                <section className="glossaryDetailSection">
                  <h3>Definicja</h3>
                  <div className="glossaryDefinitionBox">{detailDefinition(selected)}</div>
                </section>

                <section className="glossaryDetailSection">
                  <h3>Przyklad uzycia</h3>
                  <blockquote>{detailExample(selected)}</blockquote>
                </section>
              </article>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
