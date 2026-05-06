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
            return stripPolish(repaired);
        } catch (Exception ignored) {
            return stripPolish(text);
        }
    }

    private static boolean looksMojibake(String text) {
        return text.contains("\u00c3") || text.contains("\u00c5") || text.contains("\u00c4") || text.contains("\u00c2") || text.contains("\u0080") || text.contains("\u0081") || text.contains("\u0082");
    }

    private static String stripPolish(String text) {
        return text
                .replace("\u0105", "a")
                .replace("\u0107", "c")
                .replace("\u0119", "e")
                .replace("\u0142", "l")
                .replace("\u0144", "n")
                .replace("\u00f3", "o")
                .replace("\u015b", "s")
                .replace("\u017a", "z")
                .replace("\u017c", "z")
                .replace("\u0104", "A")
                .replace("\u0106", "C")
                .replace("\u0118", "E")
                .replace("\u0141", "L")
                .replace("\u0143", "N")
                .replace("\u00d3", "O")
                .replace("\u015a", "S")
                .replace("\u0179", "Z")
                .replace("\u017b", "Z");
    }
}
