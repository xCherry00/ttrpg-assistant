package pl.ttrpgassistant.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Password encoding configuration.
 * Provides BCryptPasswordEncoder bean for secure password hashing.
 */
@Configuration
public class PasswordConfig {

    /**
     * Create a password encoder bean.
     * Uses BCrypt algorithm with strength 12 (default) for secure password hashing.
     *
     * @return BCryptPasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
