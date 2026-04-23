package pl.ttrpgassistant.backend.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.auth.dto.AuthResponse;
import pl.ttrpgassistant.backend.auth.dto.LoginRequest;
import pl.ttrpgassistant.backend.auth.dto.RegisterRequest;
import pl.ttrpgassistant.backend.common.error.AuthenticationException;
import pl.ttrpgassistant.backend.common.error.DuplicateResourceException;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.time.Instant;
import java.util.Locale;

/**
 * Service for handling user authentication operations (registration and login).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Register a new user.
     *
     * @param req The registration request containing email and password
     * @return AuthResponse with JWT token and user role
     * @throws DuplicateResourceException if email already exists
     */
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new DuplicateResourceException("Email already in use: " + req.email());
        }

        String normalizedEmail = req.email().trim().toLowerCase(Locale.ROOT);
        UserEntity user = UserEntity.builder()
                .email(normalizedEmail)
                .username(generateBaseUsername(normalizedEmail))
                .tagCode(generateTagCode(normalizedEmail))
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(UserRole.PLAYER)
                .lastActiveAt(Instant.now())
                .build();

        user = userRepository.save(user);

        String token = jwtService.createToken(user.getId(), user.getRole().name(), user.isMg());
        return new AuthResponse(token, user.getRole().name(), user.isMg());
    }

    /**
     * Authenticate a user with email and password.
     *
     * @param req The login request containing email and password
     * @return AuthResponse with JWT token and user role
     * @throws AuthenticationException if credentials are invalid
     */
    public AuthResponse login(LoginRequest req) {
        UserEntity user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new AuthenticationException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid email or password");
        }

        user.setLastActiveAt(Instant.now());
        userRepository.save(user);

        String token = jwtService.createToken(user.getId(), user.getRole().name(), user.isMg());
        return new AuthResponse(token, user.getRole().name(), user.isMg());
    }

    private String generateBaseUsername(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        String normalized = localPart.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");
        if (normalized.isBlank()) {
            return "user";
        }
        return normalized;
    }

    private int generateTagCode(String seed) {
        int hash = Math.abs(seed.toLowerCase(Locale.ROOT).hashCode());
        return 1000 + (hash % 9000);
    }
}
