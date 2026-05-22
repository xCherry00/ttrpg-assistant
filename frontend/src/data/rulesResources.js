export const RULES_STARTER_RESOURCES = {
  dnd: [
    {
      label: "D&D SRD 5.2.1",
      type: "online-rules",
      sourceName: "D&D Beyond / Wizards of the Coast",
      url: "https://www.dndbeyond.com/srd",
      description:
        "System Reference Document zawierajacy podstawowe zasady i tresci dostepne dla tworcow na licencji Creative Commons.",
      usageNote:
        "Bezpieczne zrodlo do linkowania i streszczania. Przy uzyciu tresci SRD wymagana jest odpowiednia atrybucja.",
      priority: 1,
    },
  ],
  cthulhu: [
    {
      label: "Call of Cthulhu 7th Edition Quick-Start Rules",
      type: "pdf",
      sourceName: "Chaosium",
      url: "https://www.chaosium.com/cthulhu-quickstart/",
      description:
        "Oficjalny darmowy quickstart zawierajacy podstawowe zasady, gotowe postacie i scenariusz The Haunting.",
      usageNote:
        "Linkowac do oficjalnej strony Chaosium. Nie kopiowac duzych fragmentow PDF do aplikacji.",
      priority: 1,
    },
  ],
  pf2e: [
    {
      label: "Pathfinder Getting Started",
      type: "online-guide",
      sourceName: "Paizo",
      url: "https://paizo.com/pathfinder/getstarted",
      description:
        "Oficjalna strona startowa Pathfinder 2e z odnosnikami do materialow dla nowych graczy, w tym Pathfinder Primer.",
      usageNote: "Bezpieczne do linkowania jako oficjalne zrodlo startowe.",
      priority: 1,
    },
    {
      label: "Archives of Nethys - Pathfinder 2e Rules",
      type: "online-srd",
      sourceName: "Archives of Nethys / Paizo",
      url: "https://2e.aonprd.com/",
      description: "Darmowe referencyjne zrodlo zasad Pathfinder 2e online.",
      usageNote:
        "Najlepiej linkowac i ewentualnie trzymac wlasne skroty. Pelny import danych wymaga osobnej weryfikacji licencji i atrybucji.",
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
        "Oficjalna strona z darmowymi zasobami do Warhammer Fantasy Roleplay, m.in. materialami pomocniczymi i dodatkami.",
      usageNote: "Link-only. Nie traktowac jako pelnego darmowego SRD zasad.",
      priority: 1,
    },
    {
      label: "WFRP Starter Set Character Pack",
      type: "pdf",
      sourceName: "Cubicle 7",
      url: "https://cubicle7games.com/media/pdf/WFRP-Starter-Set-Character-Pack-v1.2.pdf",
      description: "Oficjalny darmowy pakiet gotowych postaci ze Starter Setu.",
      usageNote: "Material pomocniczy, nie pelny quickstart zasad.",
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
        "Darmowa, uproszczona wizualnie wersja pelnej ksiazki MORK BORG, zawierajaca zasady oraz przygode Rotblack Sludge.",
      usageNote:
        "Bezpieczne do linkowania. W aplikacji nadal najlepiej trzymac wlasny skrot i link do zrodla.",
      priority: 1,
    },
  ],
};
