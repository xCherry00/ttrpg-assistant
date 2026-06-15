package pl.ttrpgassistant.backend.compendium;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CompendiumService {
    private static final String DND5E_API_BASE_HTTPS = "https://www.dnd5eapi.co/api/2014";
    private static final String DND5E_API_BASE_HTTP = "http://www.dnd5eapi.co/api/2014";
    private static final int LIST_LIMIT = 1000;
    private static final List<Category> DND5E_CATEGORIES = List.of(
            new Category("monsters", "Potwory", "CR, XP, statystyki i akcje potworów SRD.", List.of("name", "challenge_rating", "xp", "type", "size", "alignment")),
            new Category("spells", "Zaklęcia", "Poziom, szkoła, komponenty, klasy i opis zaklęć SRD.", List.of("name", "level", "school", "casting_time", "range", "duration")),
            new Category("magic-items", "Magiczne przedmioty", "Magiczne przedmioty dostępne w SRD.", List.of("name", "equipment_category", "rarity", "desc")),
            new Category("equipment", "Ekwipunek", "Bronie, pancerze, sprzęt i koszt.", List.of("name", "equipment_category", "cost", "weight")),
            new Category("conditions", "Stany", "Stany mechaniczne D&D 5E.", List.of("name", "desc")),
            new Category("skills", "Umiejętności", "Umiejętności i powiązane cechy.", List.of("name", "ability_score", "desc")),
            new Category("damage-types", "Typy obrażeń", "Typy obrażeń z opisami SRD.", List.of("name", "desc"))
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public CompendiumService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    public List<Map<String, Object>> systems() {
        return List.of(Map.of(
                "code", "dnd5e",
                "name", "D&D 5E",
                "status", "active",
                "source", "D&D 5e SRD API",
                "sourceUrl", "https://www.dnd5eapi.co/"
        ));
    }

    public List<Map<String, Object>> categories(String systemCode) {
        requireDnd5e(systemCode);
        return DND5E_CATEGORIES.stream()
                .map(category -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("code", category.code());
                    item.put("label", category.label());
                    item.put("description", category.description());
                    item.put("columns", category.columns());
                    return item;
                })
                .toList();
    }

    public Map<String, Object> list(String systemCode, String category) {
        requireDnd5e(systemCode);
        Category selected = category(category);
        Map<String, Object> payload = fetch("/" + selected.code() + "?limit=" + LIST_LIMIT);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("systemCode", "dnd5e");
        result.put("category", selected.code());
        result.put("label", selected.label());
        result.put("columns", selected.columns());
        result.put("source", source());
        result.put("count", payload.getOrDefault("count", 0));
        result.put("results", payload.getOrDefault("results", List.of()));
        return result;
    }

    public Map<String, Object> detail(String systemCode, String category, String index) {
        requireDnd5e(systemCode);
        Category selected = category(category);
        Map<String, Object> payload = fetch("/" + selected.code() + "/" + index);
        Map<String, Object> result = new LinkedHashMap<>(payload);
        result.put("systemCode", "dnd5e");
        result.put("category", selected.code());
        result.put("source", source());
        return result;
    }

    private Map<String, Object> source() {
        return Map.of(
                "name", "D&D 5e SRD API",
                "url", "https://www.dnd5eapi.co/",
                "docs", "https://5e-bits.github.io/docs/introduction",
                "licenseNote", "SRD/open-content data; avoid non-SRD official book content."
        );
    }

    private Map<String, Object> fetch(String path) {
        try {
            return fetchFromBase(DND5E_API_BASE_HTTPS, path);
        } catch (ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception httpsException) {
            try {
                return fetchFromBase(DND5E_API_BASE_HTTP, path);
            } catch (ResourceNotFoundException ex) {
                throw ex;
            } catch (Exception httpException) {
                throw new IllegalStateException("Could not fetch compendium source");
            }
        }
    }

    private Map<String, Object> fetchFromBase(String baseUrl, String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .timeout(Duration.ofSeconds(12))
                .header("Accept", "application/json")
                .header("User-Agent", "ttrpg-assistant/1.0")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 404) {
            throw new ResourceNotFoundException("Compendium entry not found");
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Compendium source returned HTTP " + response.statusCode());
        }
        return objectMapper.readValue(response.body(), new TypeReference<>() {});
    }

    private void requireDnd5e(String systemCode) {
        if (!"dnd5e".equalsIgnoreCase(systemCode)) {
            throw new ResourceNotFoundException("Compendium system not found");
        }
    }

    private Category category(String category) {
        return DND5E_CATEGORIES.stream()
                .filter(item -> item.code().equalsIgnoreCase(category))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Compendium category not found"));
    }

    private record Category(String code, String label, String description, List<String> columns) {}
}
