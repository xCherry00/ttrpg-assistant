package pl.ttrpgassistant.backend.compendium;

import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.character.Dnd5eApiClient;
import pl.ttrpgassistant.backend.compendium.dto.DndConditionResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterDetailsResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterSummaryResponse;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DndInitiativeLookupService {

    private static final String SOURCE_NAME = "D&D 5e SRD API";
    private static final String SOURCE_URL = "https://www.dnd5eapi.co/";

    private final Dnd5eApiClient apiClient;

    public DndInitiativeLookupService(Dnd5eApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public List<DndMonsterSummaryResponse> searchMonsters(String query) {
        try {
            Map<String, Object> payload = apiClient.get("/monsters");
            List<Map<String, Object>> results = asMapList(payload.get("results"));
            String normalizedQuery = normalize(query);
            return results.stream()
                    .filter(item -> normalizedQuery.isBlank()
                            || String.valueOf(item.getOrDefault("name", "")).toLowerCase().contains(normalizedQuery)
                            || String.valueOf(item.getOrDefault("index", "")).toLowerCase().contains(normalizedQuery))
                    .limit(50)
                    .map(item -> new DndMonsterSummaryResponse(
                            String.valueOf(item.getOrDefault("index", "")),
                            String.valueOf(item.getOrDefault("name", "")),
                            String.valueOf(item.getOrDefault("url", ""))
                    ))
                    .toList();
        } catch (Exception ex) {
            return List.of();
        }
    }

    public DndMonsterDetailsResponse monsterDetails(String index) {
        try {
            Map<String, Object> payload = apiClient.get("/monsters/" + index);
            Integer dexterity = intValue(payload.get("dexterity"));
            return new DndMonsterDetailsResponse(
                    String.valueOf(payload.getOrDefault("index", index)),
                    String.valueOf(payload.getOrDefault("name", index)),
                    resolveArmorClass(payload.get("armor_class")),
                    intValue(payload.get("hit_points")),
                    stringValue(payload.get("hit_dice")),
                    dexterity,
                    dexterity == null ? 0 : (int) Math.floor((dexterity - 10) / 2.0),
                    stringValue(payload.get("size")),
                    stringValue(payload.get("type")),
                    doubleValue(payload.get("challenge_rating")),
                    SOURCE_NAME,
                    SOURCE_URL
            );
        } catch (Exception ex) {
            throw new ResourceNotFoundException("Monster not found");
        }
    }

    public List<DndConditionResponse> conditions() {
        try {
            Map<String, Object> payload = apiClient.get("/conditions");
            List<Map<String, Object>> results = asMapList(payload.get("results"));
            return results.stream()
                    .map(item -> new DndConditionResponse(
                            String.valueOf(item.getOrDefault("index", "")),
                            String.valueOf(item.getOrDefault("name", "")),
                            String.valueOf(item.getOrDefault("url", ""))
                    ))
                    .toList();
        } catch (Exception ex) {
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asMapList(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    out.add((Map<String, Object>) map);
                }
            }
            return out;
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Integer resolveArmorClass(Object armorClass) {
        if (armorClass instanceof Number number) {
            return number.intValue();
        }
        if (armorClass instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Number number) {
                return number.intValue();
            }
            if (first instanceof Map<?, ?> map) {
                Object value = ((Map<String, Object>) map).get("value");
                return intValue(value);
            }
        }
        return null;
    }

    private Integer intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return value == null ? null : Integer.parseInt(String.valueOf(value));
        } catch (Exception ex) {
            return null;
        }
    }

    private Double doubleValue(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return value == null ? null : Double.parseDouble(String.valueOf(value));
        } catch (Exception ex) {
            return null;
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}

