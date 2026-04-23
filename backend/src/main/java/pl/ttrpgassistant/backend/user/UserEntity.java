package pl.ttrpgassistant.backend.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "display_name", length = 120)
    private String displayName;

    @Column(name = "username", nullable = false, length = 60)
    private String username;

    @Column(name = "tag_code", nullable = false)
    private Integer tagCode;

    @Column(name = "bio", nullable = false, length = 1200)
    @Builder.Default
    private String bio = "";

    @Column(name = "favorite_system", nullable = false, length = 60)
    @Builder.Default
    private String favoriteSystem = "";

    @Column(name = "chat_nick_color", nullable = false, length = 20)
    @Builder.Default
    private String chatNickColor = "";

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.PLAYER;

    @Column(name = "is_mg", nullable = false)
    @Builder.Default
    private boolean isMg = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_visibility", nullable = false, length = 20)
    @Builder.Default
    private ProfileVisibility profileVisibility = ProfileVisibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "friends_visibility", nullable = false, length = 20)
    @Builder.Default
    private ProfileVisibility friendsVisibility = ProfileVisibility.FRIENDS_ONLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_visibility", nullable = false, length = 20)
    @Builder.Default
    private ProfileVisibility activityVisibility = ProfileVisibility.PUBLIC;

    @Column(name = "last_active_at", nullable = false)
    @Builder.Default
    private Instant lastActiveAt = Instant.now();
}
