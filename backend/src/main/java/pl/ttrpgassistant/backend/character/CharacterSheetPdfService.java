package pl.ttrpgassistant.backend.character;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CharacterSheetPdfService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'");
    private static final String DND_TEMPLATE_PATH = "pdf-templates/dnd5e-sheet-template.pdf";
    private static final String COC_TEMPLATE_PATH = "pdf-templates/coc7e-sheet-template.pdf";
    private final ObjectMapper objectMapper;

    public byte[] generate(PlayerCharacterEntity character, String ownerLabel) {
        Map<String, Object> sheet = readSheet(character.getSheetJson());
        try {
            byte[] templated = fillTemplatePdf(character, ownerLabel, sheet);
            if (templated != null && templated.length > 0) {
                return templated;
            }
        } catch (Exception ignored) {
        }
        return buildFallbackPdf(character, ownerLabel, sheet);
    }

    private byte[] fillTemplatePdf(PlayerCharacterEntity character, String ownerLabel, Map<String, Object> sheet) throws IOException {
        String templatePath = templateForSystem(character.getSystemCode());
        if (templatePath == null) return null;

        ClassPathResource resource = new ClassPathResource(templatePath);
        if (!resource.exists()) return null;

        try (InputStream in = resource.getInputStream();
             PDDocument document = Loader.loadPDF(in.readAllBytes())) {
            PDAcroForm form = document.getDocumentCatalog().getAcroForm();
            if (form == null || form.getFields().isEmpty()) {
                return null;
            }

            Map<String, String> values = buildValueMap(character, ownerLabel, sheet);
            int filled = 0;
            for (PDField field : form.getFieldTree()) {
                String fullName = field.getFullyQualifiedName();
                if (fullName == null || fullName.isBlank()) continue;

                String value = resolveValueForField(fullName, values);
                if (value == null) continue;

                try {
                    field.setValue(value);
                    filled++;
                } catch (Exception ignored) {
                }
            }

            if (filled == 0) {
                return null;
            }

            form.flatten();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    private String templateForSystem(String systemCode) {
        if ("dnd5e".equalsIgnoreCase(systemCode)) return DND_TEMPLATE_PATH;
        if ("coc7e".equalsIgnoreCase(systemCode)) return COC_TEMPLATE_PATH;
        return null;
    }

    private Map<String, String> buildValueMap(PlayerCharacterEntity character, String ownerLabel, Map<String, Object> sheet) {
        Map<String, Object> identity = map(sheet, "identity");
        Map<String, Object> combat = map(sheet, "combat");
        Map<String, Object> derived = map(sheet, "derived");
        Map<String, Object> notes = map(sheet, "notes");

        Map<String, String> out = new LinkedHashMap<>();
        out.put("name", firstNonBlank(str(identity.get("name")), character.getName()));
        out.put("character", firstNonBlank(str(identity.get("name")), character.getName()));
        out.put("owner", ownerLabel);
        out.put("player", ownerLabel);
        out.put("system", normalizeSystem(character.getSystemCode()));
        out.put("status", fallback(character.getStatus()));
        out.put("date", DATE_FORMAT.format(ZonedDateTime.now(ZoneOffset.UTC)));

        out.put("race", firstNonBlank(str(identity.get("race")), character.getRaceName()));
        out.put("class", firstNonBlank(str(identity.get("className")), character.getClassName()));
        out.put("occupation", firstNonBlank(str(identity.get("occupation")), character.getClassName()));
        out.put("background", firstNonBlank(str(identity.get("background")), character.getBackgroundName()));
        out.put("level", String.valueOf(character.getLevel()));
        out.put("age", strOrNumber(identity.get("age"), ""));

        out.put("hp", strOrNumber(combat.get("currentHp"), strOrNumber(derived.get("hp"), character.getCurrentHp())));
        out.put("currenthp", strOrNumber(combat.get("currentHp"), character.getCurrentHp()));
        out.put("maxhp", strOrNumber(combat.get("maxHp"), character.getMaxHp()));
        out.put("temphp", strOrNumber(combat.get("tempHp"), character.getTempHp()));
        out.put("ac", strOrNumber(combat.get("armorClass"), ""));
        out.put("san", strOrNumber(derived.get("san"), ""));
        out.put("mp", strOrNumber(derived.get("mp"), ""));

        Map<String, Object> abilityScores = map(sheet, "abilityScores");
        putStat(out, "str", abilityScores.get("str"));
        putStat(out, "dex", abilityScores.get("dex"));
        putStat(out, "con", abilityScores.get("con"));
        putStat(out, "int", abilityScores.get("int"));
        putStat(out, "wis", abilityScores.get("wis"));
        putStat(out, "cha", abilityScores.get("cha"));

        Map<String, Object> characteristics = map(sheet, "characteristics");
        putStat(out, "pow", characteristics.get("pow"));
        putStat(out, "siz", characteristics.get("siz"));
        putStat(out, "edu", characteristics.get("edu"));
        putStat(out, "app", characteristics.get("app"));
        putStat(out, "luck", derived.get("luck"));

        out.put("inventory", listAsText(list(sheet.get("inventory"))));
        out.put("skills", listAsText(list(sheet.get("skills"))));
        out.put("notes", firstNonBlank(str(notes.get("privateNotes")), character.getPrivateNotes()));

        return out;
    }

    private void putStat(Map<String, String> out, String key, Object value) {
        out.put(key, strOrNumber(value, ""));
    }

    private String resolveValueForField(String fieldName, Map<String, String> values) {
        String normalized = normalizeFieldName(fieldName);
        if (normalized.isBlank()) return null;

        for (Map.Entry<String, String> entry : values.entrySet()) {
            String key = entry.getKey();
            String candidate = entry.getValue();
            if (candidate == null || candidate.isBlank()) continue;

            String nKey = normalizeFieldName(key);
            if (normalized.equals(nKey)
                    || normalized.startsWith(nKey)
                    || normalized.endsWith(nKey)
                    || normalized.contains(nKey)) {
                return candidate;
            }
        }
        return null;
    }

    private String normalizeFieldName(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private byte[] buildFallbackPdf(PlayerCharacterEntity character, String ownerLabel, Map<String, Object> sheet) {
        List<String> lines = new ArrayList<>();

        lines.add("Character Sheet PDF");
        lines.add("");
        lines.add("Nazwa postaci: " + fallback(character.getName()));
        lines.add("System: " + fallback(normalizeSystem(character.getSystemCode())));
        lines.add("Wlasciciel: " + fallback(ownerLabel));
        lines.add("Status: " + fallback(character.getStatus()));
        lines.add("Data wygenerowania: " + DATE_FORMAT.format(ZonedDateTime.now(ZoneOffset.UTC)));
        lines.add("");
        lines.add("[Podstawowe informacje]");
        addIdentity(lines, character, sheet);

        if ("dnd5e".equalsIgnoreCase(character.getSystemCode())) {
            lines.add("");
            lines.add("[D&D 5e]");
            addDnd(lines, character, sheet);
        } else if ("coc7e".equalsIgnoreCase(character.getSystemCode())) {
            lines.add("");
            lines.add("[Call of Cthulhu 7e]");
            addCoc(lines, character, sheet);
        }

        lines.add("");
        lines.add("[Atrybuty i statystyki]");
        lines.add("Atrybuty: " + mapAsText(map(sheet, "abilityScores")));
        lines.add("Cechy: " + mapAsText(map(sheet, "characteristics")));
        lines.add("Combat: " + mapAsText(map(sheet, "combat")));
        lines.add("Derived: " + mapAsText(map(sheet, "derived")));

        lines.add("");
        lines.add("[Umiejetnosci]");
        lines.add("Skills: " + listAsText(list(sheet.get("skills"))));

        lines.add("");
        lines.add("[Ekwipunek]");
        lines.add("Inventory: " + listAsText(list(sheet.get("inventory"))));

        lines.add("");
        lines.add("[Notatki i opis]");
        lines.add("Notes: " + mapAsText(map(sheet, "notes")));
        lines.add("Notatki prywatne: " + fallback(character.getPrivateNotes()));

        return buildSimplePdf(lines);
    }

    private void addIdentity(List<String> lines, PlayerCharacterEntity character, Map<String, Object> sheet) {
        Map<String, Object> identity = map(sheet, "identity");
        lines.add("Imie: " + firstNonBlank(str(identity.get("name")), character.getName()));
        lines.add("Rasa: " + firstNonBlank(str(identity.get("race")), character.getRaceName()));
        lines.add("Klasa/Profesja: " + firstNonBlank(str(identity.get("className")), character.getClassName()));
        lines.add("Poziom: " + String.valueOf(character.getLevel()));
        lines.add("Opis: " + fallback(str(identity.get("description"))));
    }

    private void addDnd(List<String> lines, PlayerCharacterEntity character, Map<String, Object> sheet) {
        Map<String, Object> identity = map(sheet, "identity");
        Map<String, Object> combat = map(sheet, "combat");
        lines.add("Imie postaci: " + firstNonBlank(str(identity.get("name")), character.getName()));
        lines.add("Rasa: " + firstNonBlank(str(identity.get("race")), character.getRaceName()));
        lines.add("Klasa: " + firstNonBlank(str(identity.get("className")), character.getClassName()));
        lines.add("Poziom: " + String.valueOf(character.getLevel()));
        lines.add("Tlo: " + firstNonBlank(str(identity.get("background")), character.getBackgroundName()));
        lines.add("Atrybuty: " + mapAsText(map(sheet, "abilityScores")));
        lines.add("Modyfikatory: " + mapAsText(map(sheet, "abilityModifiers")));
        lines.add("HP: " + strOrNumber(combat.get("currentHp"), character.getCurrentHp()));
        lines.add("AC: " + strOrNumber(combat.get("armorClass"), "Brak danych"));
        lines.add("Proficiencies: " + listAsText(list(sheet.get("proficiencies"))));
        lines.add("Skills: " + listAsText(list(sheet.get("skills"))));
        lines.add("Ekwipunek: " + listAsText(list(sheet.get("inventory"))));
    }

    private void addCoc(List<String> lines, PlayerCharacterEntity character, Map<String, Object> sheet) {
        Map<String, Object> identity = map(sheet, "identity");
        Map<String, Object> derived = map(sheet, "derived");
        lines.add("Imie postaci: " + firstNonBlank(str(identity.get("name")), character.getName()));
        lines.add("Profesja: " + firstNonBlank(str(identity.get("occupation")), character.getClassName()));
        lines.add("Wiek: " + strOrNumber(identity.get("age"), "Brak danych"));
        lines.add("Cechy: " + mapAsText(map(sheet, "characteristics")));
        lines.add("Umiejetnosci: " + listAsText(list(sheet.get("skills"))));
        lines.add("Sanity: " + strOrNumber(derived.get("san"), "Brak danych"));
        lines.add("HP: " + strOrNumber(derived.get("hp"), character.getCurrentHp()));
        lines.add("MP: " + strOrNumber(derived.get("mp"), "Brak danych"));
        lines.add("Ekwipunek: " + listAsText(list(sheet.get("inventory"))));
        lines.add("Notatki: " + fallback(str(map(sheet, "notes").get("privateNotes"))));
    }

    private byte[] buildSimplePdf(List<String> rawLines) {
        List<String> wrapped = wrapLines(rawLines, 95);
        StringBuilder content = new StringBuilder();
        content.append("BT\n");
        content.append("/F1 11 Tf\n");
        content.append("50 800 Td\n");
        for (int i = 0; i < wrapped.size(); i++) {
            if (i > 0) {
                content.append("0 -14 Td\n");
            }
            content.append("(").append(escapePdfText(wrapped.get(i))).append(") Tj\n");
        }
        content.append("ET\n");

        byte[] contentBytes = content.toString().getBytes(StandardCharsets.UTF_8);

        String obj1 = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n";
        String obj2 = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n";
        String obj3 = "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n";
        String obj4 = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n";
        String obj5Start = "5 0 obj << /Length " + contentBytes.length + " >> stream\n";
        String obj5End = "endstream\nendobj\n";

        byte[] part1 = "%PDF-1.4\n".getBytes(StandardCharsets.UTF_8);
        byte[] partObj1 = obj1.getBytes(StandardCharsets.UTF_8);
        byte[] partObj2 = obj2.getBytes(StandardCharsets.UTF_8);
        byte[] partObj3 = obj3.getBytes(StandardCharsets.UTF_8);
        byte[] partObj4 = obj4.getBytes(StandardCharsets.UTF_8);
        byte[] partObj5Start = obj5Start.getBytes(StandardCharsets.UTF_8);
        byte[] partObj5End = obj5End.getBytes(StandardCharsets.UTF_8);

        int offset1 = part1.length;
        int offset2 = offset1 + partObj1.length;
        int offset3 = offset2 + partObj2.length;
        int offset4 = offset3 + partObj3.length;
        int offset5 = offset4 + partObj4.length;
        int xrefStart = offset5 + partObj5Start.length + contentBytes.length + partObj5End.length;

        String xref =
                "xref\n" +
                "0 6\n" +
                "0000000000 65535 f \n" +
                String.format("%010d 00000 n \n", offset1) +
                String.format("%010d 00000 n \n", offset2) +
                String.format("%010d 00000 n \n", offset3) +
                String.format("%010d 00000 n \n", offset4) +
                String.format("%010d 00000 n \n", offset5);
        String trailer =
                "trailer << /Size 6 /Root 1 0 R >>\n" +
                "startxref\n" +
                xrefStart + "\n" +
                "%%EOF";

        byte[] xrefBytes = xref.getBytes(StandardCharsets.UTF_8);
        byte[] trailerBytes = trailer.getBytes(StandardCharsets.UTF_8);

        byte[] pdf = new byte[
                part1.length + partObj1.length + partObj2.length + partObj3.length + partObj4.length +
                        partObj5Start.length + contentBytes.length + partObj5End.length +
                        xrefBytes.length + trailerBytes.length
                ];
        int p = 0;
        p = copy(part1, pdf, p);
        p = copy(partObj1, pdf, p);
        p = copy(partObj2, pdf, p);
        p = copy(partObj3, pdf, p);
        p = copy(partObj4, pdf, p);
        p = copy(partObj5Start, pdf, p);
        p = copy(contentBytes, pdf, p);
        p = copy(partObj5End, pdf, p);
        p = copy(xrefBytes, pdf, p);
        copy(trailerBytes, pdf, p);
        return pdf;
    }

    private int copy(byte[] source, byte[] target, int offset) {
        System.arraycopy(source, 0, target, offset, source.length);
        return offset + source.length;
    }

    private List<String> wrapLines(List<String> source, int maxLength) {
        List<String> result = new ArrayList<>();
        for (String line : source) {
            String normalized = fallback(line).replace("\r", " ").replace("\n", " ").trim();
            if (normalized.length() <= maxLength) {
                result.add(normalized);
                continue;
            }
            String remaining = normalized;
            while (remaining.length() > maxLength) {
                int splitAt = remaining.lastIndexOf(' ', maxLength);
                if (splitAt <= 0) splitAt = maxLength;
                result.add(remaining.substring(0, splitAt).trim());
                remaining = remaining.substring(splitAt).trim();
            }
            if (!remaining.isBlank()) result.add(remaining);
        }
        return result;
    }

    private String escapePdfText(String text) {
        return text
                .replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");
    }

    private String normalizeSystem(String code) {
        if (code == null || code.isBlank()) return "Brak danych";
        if ("dnd5e".equalsIgnoreCase(code)) return "D&D 5e";
        if ("coc7e".equalsIgnoreCase(code)) return "Call of Cthulhu 7e";
        return code;
    }

    private String str(Object value) {
        if (value == null) return "";
        return String.valueOf(value);
    }

    private String strOrNumber(Object value, Object fallback) {
        if (value == null) return String.valueOf(fallback);
        return String.valueOf(value);
    }

    private String fallback(String value) {
        if (value == null || value.isBlank()) return "Brak danych";
        return value;
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) return first;
        return second == null ? "" : second;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Map<String, Object> root, String key) {
        Object value = root.get(key);
        if (value instanceof Map<?, ?> m) return (Map<String, Object>) m;
        return Map.of();
    }

    private String mapAsText(Map<String, Object> map) {
        if (map.isEmpty()) return "Brak danych";
        return map.entrySet().stream()
                .map(e -> e.getKey() + ": " + strOrNumber(e.getValue(), "Brak danych"))
                .reduce((a, b) -> a + ", " + b)
                .orElse("Brak danych");
    }

    private List<String> list(Object value) {
        if (!(value instanceof List<?> raw)) return List.of();
        return raw.stream().map(String::valueOf).toList();
    }

    private String listAsText(List<String> values) {
        if (values.isEmpty()) return "Brak danych";
        return String.join(", ", values);
    }

    private Map<String, Object> readSheet(String raw) {
        if (raw == null || raw.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(raw, new TypeReference<>() {});
        } catch (Exception ex) {
            return new LinkedHashMap<>();
        }
    }
}
