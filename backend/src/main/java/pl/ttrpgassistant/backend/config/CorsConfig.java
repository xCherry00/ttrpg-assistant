package pl.ttrpgassistant.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS (Cross-Origin Resource Sharing) configuration.
 * Defines which origins are allowed to make requests to this API.
 */
@Configuration
@Slf4j
public class CorsConfig {

    @Value("${app.cors.allowedOrigins}")
    private String allowedOrigins;

    /**
     * Create CORS configuration source bean.
     * Parses comma-separated list of allowed origins from configuration.
     *
     * @return CorsConfigurationSource configured with allowed origins and methods
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        // Parse and validate allowed origins
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        if (origins.isEmpty()) {
            log.warn("No CORS origins configured. API will not be accessible from browsers.");
        }

        cfg.setAllowedOrigins(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cfg.setMaxAge(3600L); // Cache preflight requests for 1 hour

        // Set credentials to false (no cookies/credentials sent with CORS requests)
        cfg.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);

        return source;
    }
}
