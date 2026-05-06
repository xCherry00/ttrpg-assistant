package pl.ttrpgassistant.backend.system;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class SystemCodeRegistry {
    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("dnd5e", "dnd"),
            Map.entry("dnd", "dnd"),
            Map.entry("d&d 5e", "dnd"),
            Map.entry("callofcthulhu7e", "cthulhu"),
            Map.entry("coc7e", "cthulhu"),
            Map.entry("cthulhu", "cthulhu"),
            Map.entry("wfrp4e", "wh4e"),
            Map.entry("warhammer4e", "wh4e"),
            Map.entry("wh4e", "wh4e"),
            Map.entry("pf2e", "pf2e"),
            Map.entry("pathfinder2e", "pf2e"),
            Map.entry("morkborg", "morkborg"),
            Map.entry("mork_borg", "morkborg"),
            Map.entry("any", "any"),
            Map.entry("swade", "swade"),
            Map.entry("alien", "alien")
    );

    private static final Set<String> SUPPORTED = Set.of(
            "any", "dnd", "cthulhu", "wh4e", "pf2e", "morkborg", "swade", "alien"
    );

    private SystemCodeRegistry() {
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "any";
        }
        String normalized = value.trim()
                .toLowerCase(Locale.ROOT)
                .replace(" ", "")
                .replace("-", "")
                .replace("_", "");
        return ALIASES.getOrDefault(normalized, normalized);
    }

    public static boolean isSupported(String value) {
        return SUPPORTED.contains(normalize(value));
    }
}
