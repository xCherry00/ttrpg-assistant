package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Entity
@Table(name = "campaigns")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignEntity {
    private static final Set<String> ALLOWED_STATUSES = Set.of("active", "finished", "archived");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "system_code", nullable = false, length = 32)
    @Builder.Default
    private String systemCode = "dnd5e";

    @Column(name = "description_md", nullable = false)
    @Builder.Default
    private String descriptionMd = "";

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "active";

    @Column(name = "join_code", nullable = false, length = 20, unique = true)
    private String joinCode;

    @Column(name = "visibility", nullable = false, length = 20)
    @Builder.Default
    private String visibility = "PRIVATE";

    @Column(name = "player_limit", nullable = false)
    @Builder.Default
    private Integer playerLimit = 5;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        status = normalizeStatus(status);
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        status = normalizeStatus(status);
        updatedAt = Instant.now();
    }

    private String normalizeStatus(String rawStatus) {
        String normalized = rawStatus == null ? "" : rawStatus.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported campaign status.");
        }
        return normalized;
    }
}
