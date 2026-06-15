export const RULES_STARTER_RESOURCES = {
  dnd: [
    {
      label: "D&D SRD 5.2.1",
      type: "online-rules",
      sourceName: "D&D Beyond / Wizards of the Coast",
      url: "https://www.dndbeyond.com/srd",
      description:
        "System Reference Document zawierający podstawowe zasady i treści dostępne dla twórców na licencji Creative Commons.",
      usageNote:
        "Bezpieczne źródło do linkowania i streszczania. Przy użyciu treści SRD wymagana jest odpowiednia atrybucja.",
      priority: 1,
    },
  ],
  cthulhu: [
    {
      label: "Zew Cthulhu Starter (PL)",
      type: "pdf",
      sourceName: "Black Monk",
      url: "https://blackmonk.pl/zew-cthulhu-pdf/68-pdf-zew-cthulhu-starter.html",
      description:
        "Polski starter Zewu Cthulhu jako materiał startowy dla nowych graczy.",
      usageNote:
        "Zewnętrzne źródło oficjalnego materiału startowego. Nie kopiować treści do aplikacji.",
      priority: 1,
    },
    {
      label: "Call of Cthulhu 7th Edition Quick-Start Rules",
      type: "pdf",
      sourceName: "Chaosium",
      url: "https://www.chaosium.com/cthulhu-quickstart/",
      description:
        "Oficjalny darmowy quickstart zawierający podstawowe zasady, gotowe postacie i scenariusz The Haunting.",
      usageNote:
        "Linkować do oficjalnej strony Chaosium. Nie kopiować dużych fragmentów PDF do aplikacji.",
      priority: 2,
    },
  ],
  pf2e: [
    {
      label: "Pathfinder Getting Started",
      type: "online-guide",
      sourceName: "Paizo",
      url: "https://paizo.com/pathfinder/getstarted",
      description:
        "Oficjalna strona startowa Pathfinder 2e z odnośnikami do materiałów dla nowych graczy, w tym Pathfinder Primer.",
      usageNote: "Bezpieczne do linkowania jako oficjalne źródło startowe.",
      priority: 1,
    },
    {
      label: "Archives of Nethys - Pathfinder 2e Rules",
      type: "online-srd",
      sourceName: "Archives of Nethys / Paizo",
      url: "https://2e.aonprd.com/",
      description: "Darmowe referencyjne źródło zasad Pathfinder 2e online.",
      usageNote:
        "Najlepiej linkować i ewentualnie trzymać własne skróty. Pełny import danych wymaga osobnej weryfikacji licencji i atrybucji.",
      priority: 2,
    },
  ],
  wh4e: [
    {
      label: "WFRP Free Resources",
      type: "official-resources",
      sourceName: "Cubicle 7",
      url: "https://cubicle7games.com/en_EU/blog/wfrp-free-resources",
      description:
        "Oficjalna strona z darmowymi zasobami do Warhammer Fantasy Roleplay, m.in. materiałami pomocniczymi i dodatkami.",
      usageNote: "Link-only. Nie traktować jako pełnego darmowego SRD zasad.",
      priority: 1,
    },
    {
      label: "WFRP Starter Set Character Pack",
      type: "pdf",
      sourceName: "Cubicle 7",
      url: "https://cubicle7games.com/media/pdf/WFRP-Starter-Set-Character-Pack-v1.2.pdf",
      description: "Oficjalny darmowy pakiet gotowych postaci ze Starter Setu.",
      usageNote: "Materiał pomocniczy, nie pełny quickstart zasad.",
      priority: 2,
    },
  ],
  morkborg: [
    {
      label: "MORK BORG Bare Bones Edition",
      type: "pdf / itch.io download",
      sourceName: "Johan Nohr / MORK BORG",
      url: "https://jnohr.itch.io/mrk-borg-free",
      description:
        "Darmowa, uproszczona wizualnie wersja pełnej książki MORK BORG, zawierająca zasady oraz przygodę Rotblack Sludge.",
      usageNote:
        "Bezpieczne do linkowania. W aplikacji nadal najlepiej trzymać własny skrót i link do źródła.",
      priority: 1,
    },
  ],
};
