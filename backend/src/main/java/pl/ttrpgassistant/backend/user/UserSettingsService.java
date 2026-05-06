package pl.ttrpgassistant.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.common.error.AuthenticationException;
import pl.ttrpgassistant.backend.common.error.DuplicateResourceException;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.user.dto.ChangePasswordRequest;
import pl.ttrpgassistant.backend.user.dto.DeleteAccountRequest;
import pl.ttrpgassistant.backend.user.dto.MeResponse;
import pl.ttrpgassistant.backend.user.dto.UpdateChatNickColorRequest;
import pl.ttrpgassistant.backend.user.dto.UpdateEmailRequest;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public MeResponse getCurrentUser(Long userId) {
        UserEntity user = getUser(userId);
        user.setLastActiveAt(java.time.Instant.now());
        return toMeResponse(user);
    }

    @Transactional
    public MeResponse updateDisplayName(Long userId, String displayName) {
        UserEntity user = getUser(userId);
        user.setDisplayName(displayName.trim());
        user = userRepository.save(user);
        return toMeResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        UserEntity user = getUser(userId);

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }

        if (req.currentPassword().equals(req.newPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public MeResponse updateEmail(Long userId, UpdateEmailRequest req) {
        UserEntity user = getUser(userId);
        String normalizedEmail = req.newEmail().trim().toLowerCase();

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }

        if (normalizedEmail.equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("New email must be different from current email");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("Email already exists");
        }

        user.setEmail(normalizedEmail);
        user = userRepository.save(user);
        return toMeResponse(user);
    }

    @Transactional
    public MeResponse updateChatNickColor(Long userId, UpdateChatNickColorRequest req) {
        UserEntity user = getUser(userId);
        user.setChatNickColor(req.chatNickColor() == null ? "" : req.chatNickColor().trim());
        user = userRepository.save(user);
        return toMeResponse(user);
    }

    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequest req) {
        UserEntity user = getUser(userId);

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }

        userRepository.delete(user);
    }

    private UserEntity getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private MeResponse toMeResponse(UserEntity user) {
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getUsername(),
                user.getTagCode(),
                user.getUsername() + "-" + String.format("%04d", user.getTagCode()),
                user.getBio(),
                user.getFavoriteSystem(),
                user.getChatNickColor(),
                user.getRole().name(),
                user.isMg()
        );
    }
}
