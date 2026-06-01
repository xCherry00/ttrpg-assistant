import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GeneratorsPage from "../../pages/GeneratorsPage";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../api/generators", () => ({
  getGeneratorDefinitions: vi.fn(),
  getGeneratorForm: vi.fn(),
  generateVariantContent: vi.fn(),
  generateContent: vi.fn(),
}));

import {
  generateVariantContent,
  getGeneratorDefinitions,
  getGeneratorForm,
} from "../../api/generators";

const definitions = [
  definition("encounter_quick", "Spotkanie", "scene", 144),
  definition("complication_quick", "Komplikacja sceny", "scene", 145),
  definition("document_quick", "Dokument / Znalezisko", "clue", 146),
];

function definition(code, name, typeCode, displayOrder) {
  return {
    code,
    name,
    description: `${name} opis`,
    category: "Narzedzia",
    categoryCode: "UTILITY",
    typeCode,
    genreTags: ["Fantasy"],
    systemTags: ["system_agnostic"],
    toneTags: ["opisowy"],
    displayOrder,
    variants: [{ variantCode: "general.quick", name, description: `${name} formularz`, systemCode: "system_agnostic" }],
  };
}

const forms = {
  encounter_quick: form("encounter_quick", [
    select("setting", "Setting", "Losowy", ["Losowy", "Fantasy"]),
    select("place", "Miejsce", "Losowe", ["Losowe", "Miasto"]),
    select("dangerLevel", "Poziom zagrozenia", "Srednie", ["Niskie", "Srednie"]),
    select("tone", "Ton", "Losowy", ["Losowy", "Walka"]),
  ]),
  complication_quick: form("complication_quick", [
    select("sceneType", "Typ sceny", "Losowy", ["Losowy", "Walka"]),
    select("severity", "Skala komplikacji", "Srednia", ["Mala", "Srednia"]),
    select("tone", "Ton", "Losowy", ["Losowy", "Mroczna"]),
  ]),
  document_quick: form("document_quick", [
    select("documentType", "Typ dokumentu", "Losowy", ["Losowy", "List"]),
    select("tone", "Ton", "Losowy", ["Losowy", "Tajemniczy"]),
    select("setting", "Setting", "Losowy", ["Losowy", "Fantasy"]),
  ]),
};

function form(generatorCode, fields) {
  return { generatorCode, variantCode: "general.quick", name: generatorCode, description: "Opis", fields };
}

function select(key, label, defaultValue, options) {
  return { key, label, type: "SELECT", defaultValue, options, required: false };
}

function renderPage(path = "/generators") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/generators" element={<GeneratorsPage />} />
        <Route path="/generators/:generatorCode" element={<GeneratorsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("GeneratorsPage practical generators", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getGeneratorDefinitions.mockResolvedValue(definitions);
    getGeneratorForm.mockImplementation((_, generatorCode) => Promise.resolve(forms[generatorCode]));
    generateVariantContent.mockResolvedValue({
      title: "Spotkanie: Miasto",
      subtitle: "Fantasy | Srednie",
      sections: [
        { type: "stats", title: "Podsumowanie", items: [{ label: "Setting", value: "Fantasy" }] },
        { type: "text", title: "Co sie dzieje?", content: "Scena testowa." },
      ],
    });
  });

  it("shows new generators from backend catalog data", async () => {
    renderPage();

    expect(await screen.findByText("Spotkanie")).toBeInTheDocument();
    expect(screen.getByText("Komplikacja sceny")).toBeInTheDocument();
    expect(screen.getByText("Dokument / Znalezisko")).toBeInTheDocument();
  });

  it("renders encounter form, generates sections and stores local history", async () => {
    renderPage("/generators/encounter_quick");

    expect(await screen.findByText("Setting")).toBeInTheDocument();
    expect(screen.getByText("Miejsce")).toBeInTheDocument();
    expect(screen.getByText("Poziom zagrozenia")).toBeInTheDocument();
    expect(screen.getByText("Ton")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Przelosuj/i }));

    expect(await screen.findByText("Problem")).toBeInTheDocument();
    expect(screen.getByText("Scena testowa.")).toBeInTheDocument();
    expect(screen.queryByText("Podsumowanie")).not.toBeInTheDocument();
    expect(generateVariantContent).toHaveBeenCalledWith("test-token", "encounter_quick", "general.quick", expect.objectContaining({
      setting: "Losowy",
      place: "Losowe",
      dangerLevel: "Srednie",
      tone: "Losowy",
    }));
    expect(JSON.parse(window.localStorage.getItem("ttrpg.generatorHistory"))).toHaveLength(1);
  });
});
