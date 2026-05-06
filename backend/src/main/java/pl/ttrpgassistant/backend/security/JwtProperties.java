package pl.ttrpgassistant.backend.security;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * JWT configuration properties with validation.
 * Properties are loaded from 'app.security' prefix in configuration files.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.security")
@Validated
public class JwtProperties {

    @NotBlank(message = "JWT secret must not be blank. Set app.security.jwtSecret environment variable.")
    @Size(min = 32, message = "JWT secret must be at least 32 characters long for security")
    private String jwtSecret;

    @Min(value = 1, message = "JWT expiration must be at least 1 minute")
    private long jwtExpirationMinutes = 10080; // Default: 7 days
}
