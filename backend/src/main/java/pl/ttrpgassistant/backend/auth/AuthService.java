package pl.ttrpgassistant.backend.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.auth.dto.AuthResponse;
import pl.ttrpgassistant.backend.auth.dto.ForgotPasswordResponse;
import pl.ttrpgassistant.backend.auth.dto.ForgotPasswordRequest;
import pl.ttrpgassistant.backend.auth.dto.LoginRequest;
import pl.ttrpgassistant.backend.auth.dto.RegisterRequest;
import pl.ttrpgassistant.backend.auth.dto.ResetPasswordRequest;
import pl.ttrpgassistant.backend.common.error.AuthenticationException;
import pl.ttrpgassistant.backend.common.error.DuplicateResourceException;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

/**
 * Service for handling user authentication operations (registration and login).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetMailService passwordResetMailService;

    @Value("${app.auth.reset-token-ttl-minutes:60}")
    private long resetTokenTtlMinutes;

    @Value("${app.auth.expose-reset-token:false}")
    private boolean exposeResetToken;

    /**
     * Register a new user.
     *
     * @param req The registration request containing email and password
     * @return AuthResponse with JWT token and user role
     * @throws DuplicateResourceException if email already exists
     */
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new DuplicateResourceException("Email already in use");
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
        String normalizedEmail = req.email().trim().toLowerCase(Locale.ROOT);
        UserEntity user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AuthenticationException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid email or password");
        }

        user.setLastActiveAt(Instant.now());
        userRepository.save(user);

        String token = jwtService.createToken(user.getId(), user.getRole().name(), user.isMg());
        return new AuthResponse(token, user.getRole().name(), user.isMg());
    }

    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase(Locale.ROOT);
        UserEntity user = userRepository.findByEmail(normalizedEmail).orElse(null);

        String rawToken = null;
        if (user != null) {
            UUID tokenId = UUID.randomUUID();
            rawToken = tokenId + "." + UUID.randomUUID();
            PasswordResetTokenEntity resetToken = PasswordResetTokenEntity.builder()
                    .id(tokenId)
                    .userId(user.getId())
                    .tokenHash(passwordEncoder.encode(rawToken))
                    .expiresAt(Instant.now().plus(resetTokenTtlMinutes, ChronoUnit.MINUTES))
                    .createdAt(Instant.now())
                    .build();
            passwordResetTokenRepository.save(resetToken);
            passwordResetMailService.sendResetToken(normalizedEmail, rawToken);
            log.info("Password reset token generated for userId={}", user.getId());
        }

        return new ForgotPasswordResponse(
                "If the email exists, password reset instructions have been generated.",
                exposeResetToken ? rawToken : null
        );
    }

    public void resetPassword(ResetPasswordRequest req) {
        String tokenPayload = req.token().trim();
        int dotIndex = tokenPayload.indexOf('.');
        if (dotIndex <= 0) {
            throw new IllegalArgumentException("Invalid reset token");
        }

        UUID tokenId;
        try {
            tokenId = UUID.fromString(tokenPayload.substring(0, dotIndex));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid reset token");
        }

        PasswordResetTokenEntity resetToken = passwordResetTokenRepository.findByIdAndUsedAtIsNull(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Reset token is invalid or already used"));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset token has expired");
        }
        if (!passwordEncoder.matches(tokenPayload, resetToken.getTokenHash())) {
            throw new IllegalArgumentException("Invalid reset token");
        }

        UserEntity user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Reset token user no longer exists"));

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setTokenInvalidatedAt(Instant.now());
        resetToken.setUsedAt(Instant.now());

        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);
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
