package pl.ttrpgassistant.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.common.error.AuthenticationException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Service for JWT token creation and validation.
 * Handles JWT signing, parsing, and claims extraction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    private final JwtProperties props;

    /**
     * Create a signed JWT token for a user.
     *
     * @param userId The user ID
     * @param role The user role
     * @return The signed JWT token
     * @throws AuthenticationException if token generation fails
     */
    public String createToken(Long userId, String role, boolean isMg) {
        try {
            var now = Instant.now();
            var exp = now.plusSeconds(props.getJwtExpirationMinutes() * 60);

            var key = Keys.hmacShaKeyFor(props.getJwtSecret().getBytes(StandardCharsets.UTF_8));

            return Jwts.builder()
                    .subject(String.valueOf(userId))
                    .claim("role", role)
                    .claim("isMg", isMg)
                    .issuedAt(Date.from(now))
                    .expiration(Date.from(exp))
                    .signWith(key)
                    .compact();
        } catch (Exception ex) {
            log.error("Failed to create JWT token", ex);
            throw new AuthenticationException("Failed to create authentication token", ex);
        }
    }

    /**
     * Parse and validate a JWT token, extracting its claims.
     *
     * @param token The JWT token to parse
     * @return The token's claims
     * @throws AuthenticationException if the token is invalid or expired
     */
    public Claims parseClaims(String token) {
        try {
            var key = Keys.hmacShaKeyFor(props.getJwtSecret().getBytes(StandardCharsets.UTF_8));

            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
            throw new AuthenticationException("Invalid or expired token");
        } catch (Exception ex) {
            log.error("Error parsing JWT token", ex);
            throw new AuthenticationException("Failed to validate token", ex);
        }
    }

    /**
     * Extract user ID from a JWT token.
     *
     * @param token The JWT token
     * @return The user ID
     * @throws AuthenticationException if the token is invalid
     */
    public Long getUserId(String token) {
        try {
            var claims = parseClaims(token);
            return Long.parseLong(claims.getSubject());
        } catch (NumberFormatException ex) {
            log.warn("Invalid user ID in token");
            throw new AuthenticationException("Invalid token format");
        }
    }

    /**
     * Extract user role from a JWT token.
     *
     * @param token The JWT token
     * @return The user role, or null if not present
     * @throws AuthenticationException if the token is invalid
     */
    public String getRole(String token) {
        var claims = parseClaims(token);
        Object role = claims.get("role");
        return role == null ? null : role.toString();
    }
}
