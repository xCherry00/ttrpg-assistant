# Listingi kodu do pracy inżynierskiej

## Listing 4.1. Przykładowa konfiguracja połączenia aplikacji z bazą danych

**Plik źródłowy:** `backend/src/main/resources/application.yml`

```yaml
server:
  port: ${SERVER_PORT:8080}

spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASS}

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    locations: classpath:db/migration
    validate_on_migrate: true

app:
  security:
    jwtSecret: ${JWT_SECRET}
    jwtExpirationMinutes: ${JWT_EXP_MIN:10080}
```

## Listing 4.2. Przykład kontrolera REST obsługującego utworzenie kampanii

**Plik źródłowy:** `backend/src/main/java/pl/ttrpgassistant/backend/campaign/CampaignController.java`

```java
@PostMapping
public CampaignSummaryResponse create(
        Authentication auth,
        @Valid @RequestBody CreateCampaignRequest request
) {
    Long userId = (Long) auth.getPrincipal();
    return campaignService.create(userId, request);
}
```

## Listing 4.3. Przykład konfiguracji dostępu do endpointów w Spring Security

**Plik źródłowy:** `backend/src/main/java/pl/ttrpgassistant/backend/security/SecurityConfig.java`

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/api/health").permitAll()
            .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/generators/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/compendium/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/glossary/**").permitAll()
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(eh -> eh
            .authenticationEntryPoint((req, res, ex) -> res.sendError(401))
            .accessDeniedHandler((req, res, ex) -> res.sendError(403))
        )
        .formLogin(form -> form.disable())
        .httpBasic(basic -> basic.disable());

    return http.build();
}
```

```javascript

```

## Listing 4.4. Przykład walidacji danych wejściowych dla tworzenia kampanii

**Plik źródłowy:** `backend/src/main/java/pl/ttrpgassistant/backend/campaign/dto/CreateCampaignRequest.java`

```java
package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import pl.ttrpgassistant.backend.common.validation.SafeImageOrHttpUrl;

public record CreateCampaignRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 32) String systemCode,
        @Size(max = 2000) String description,
        @Size(max = 2_000_000) @SafeImageOrHttpUrl String coverImageUrl,
        @Size(max = 20) String visibility,
        @Min(1) @Max(20) Integer playerLimit
) {}
```
