package pl.ttrpgassistant.backend.character;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Component
public class Dnd5eApiClient {
    private static final String HTTPS_BASE = "https://www.dnd5eapi.co/api/2014";
    private static final String HTTP_BASE = "http://www.dnd5eapi.co/api/2014";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public Dnd5eApiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
    }

    public Map<String, Object> get(String path) {
        try {
            return request(HTTPS_BASE, path);
        } catch (Exception httpsError) {
            try {
                return request(HTTP_BASE, path);
            } catch (Exception httpError) {
                throw new IllegalStateException("DND API unavailable");
            }
        }
    }

    private Map<String, Object> request(String base, String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(base + path))
                .timeout(Duration.ofSeconds(12))
                .header("Accept", "application/json")
                .header("User-Agent", "ttrpg-assistant/1.0")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("DND API returned HTTP " + response.statusCode());
        }
        return objectMapper.readValue(response.body(), new TypeReference<>() {});
    }
}
