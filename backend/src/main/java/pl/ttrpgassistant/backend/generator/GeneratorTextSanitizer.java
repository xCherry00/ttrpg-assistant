package pl.ttrpgassistant.backend.generator;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

final class GeneratorTextSanitizer {
    private static final Map<String, String> REPLACEMENTS = replacements();

    private GeneratorTextSanitizer() {
    }

    static String clean(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        if (!looksMojibake(text)) {
            return text;
        }
        String repaired = replaceKnownArtifacts(text);
        if (!repaired.equals(text)) {
            return repaired;
        }
        try {
            String decoded = new String(text.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
            return replaceKnownArtifacts(decoded);
        } catch (Exception ignored) {
            // Some double-encoded fragments are not representable in ISO-8859-1.
        }
        return repaired;
    }

    private static boolean looksMojibake(String text) {
        return text.contains("\u00c3")
                || text.contains("\u00c5")
                || text.contains("\u00c4")
                || text.contains("\u00c2")
                || text.contains("\u0080")
                || text.contains("\u0081")
                || text.contains("\u0082")
                || text.contains("\uFFFD")
                || text.contains("Ă")
                || text.contains("Ä")
                || text.contains("Ĺ")
                || text.contains("â");
    }

    private static String replaceKnownArtifacts(String text) {
        String repaired = text;
        for (Map.Entry<String, String> entry : REPLACEMENTS.entrySet()) {
            repaired = repaired.replace(entry.getKey(), entry.getValue());
        }
        repaired = repaired.replaceAll("Ä\\p{L}\\uFFFD", "Ł")
                .replaceAll("Ä\\p{L}\\?", "Ł")
                .replaceAll("Ä.{1,3}up", "Łup")
                .replaceAll("Ä.{1,3}owca", "Łowca")
                .replace("Ł?", "Ł");
        return repaired.replaceAll("\\uFFFD\\?{0,4}", "").replaceAll("\\s{2,}", " ").trim();
    }

    private static Map<String, String> replacements() {
        Map<String, String> map = new LinkedHashMap<>();

        map.put("Ä‚ËĂ˘â€šÂ¬Ă˘â‚¬ĹĄ", " - ");
        map.put("Ă˘â‚¬â€ť", " - ");
        map.put("â€˘", " - ");
        map.put("â€“", " - ");
        map.put("â€”", " - ");
        map.put("â€™", "'");
        map.put("â€œ", "\"");
        map.put("â€ť", "\"");
        map.put("Â ", " ");
        map.put("Â", "");

        map.put("Ă„Ä…Ă‚Â", "Ł");
        map.put("ÄąÂ", "Ł");
        map.put("Äš?", "Ł");
        map.put("Äš", "Ł");
        map.put("Ĺ", "Ł");
        map.put("Ă„Ä…ÄąË‡", "Ś");
        map.put("ÄąĹˇ", "Ś");
        map.put("Ĺš", "Ś");

        map.put("Ă„â€šÄąâ€š", "ó");
        map.put("Ä‚â€šÄąâ€š", "ó");
        map.put("Ä‚Ĺ‚", "ó");
        map.put("Ăł", "ó");

        map.put("Ă„Ä…Ă˘â‚¬Ĺˇ", "ł");
        map.put("Äąâ€š", "ł");
        map.put("Ĺ‚", "ł");

        map.put("Ä‚â€žĂ˘â‚¬Â¦", "ą");
        map.put("Ă„â€¦", "ą");
        map.put("Ä…", "ą");

        map.put("Ä‚â€žĂ˘â€žË", "ę");
        map.put("Ă„â„˘", "ę");
        map.put("Ä™", "ę");

        map.put("Ä‚â€žĂ˘â‚¬Ë‡", "ć");
        map.put("Ă„â€ˇ", "ć");
        map.put("Ä‡", "ć");

        map.put("Ă„Ä…Ă˘â‚¬Ĺľ", "ń");
        map.put("Äąâ€ž", "ń");
        map.put("Ĺ„", "ń");

        map.put("Ă„Ä…Ă˘â‚¬Ĺź", "ś");
        map.put("Äąâ€ş", "ś");
        map.put("Ĺ›", "ś");

        map.put("Ă„Ä…ÄąĹş", "ź");
        map.put("ÄąĹź", "ź");
        map.put("Ĺş", "ź");

        map.put("Ă„Ä…Ă„Ëť", "ż");
        map.put("ÄąÄ˝", "ż");
        map.put("ĹĽ", "ż");

        map.put("Ă„Ä…Ă„Â»", "Ż");
        map.put("Ĺ»", "Ż");

        return map;
    }

}
