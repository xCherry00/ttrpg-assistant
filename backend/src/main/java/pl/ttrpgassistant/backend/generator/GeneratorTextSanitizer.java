package pl.ttrpgassistant.backend.generator;

import java.nio.charset.StandardCharsets;

final class GeneratorTextSanitizer {
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
        try {
            String repaired = new String(text.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
            return repaired;
        } catch (Exception ignored) {
            return text;
        }
    }

    private static boolean looksMojibake(String text) {
        return text.contains("\u00c3") || text.contains("\u00c5") || text.contains("\u00c4") || text.contains("\u00c2") || text.contains("\u0080") || text.contains("\u0081") || text.contains("\u0082");
    }

}
