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
@Table(name = "campaign_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignSessionEntity {
    private static final Set<String> ALLOWED_STATUSES = Set.of("PLANNED", "IN_PROGRESS", "FINISHED");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_id", nullable = false)
    private Long campaignId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description_md", nullable = false)
    @Builder.Default
    private String descriptionMd = "";

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PLANNED";

    @Column(name = "scheduled_for")
    private Instant scheduledFor;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

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
        String normalized = rawStatus == null ? "" : rawStatus.trim().toUpperCase(Locale.ROOT);
        if ("ACTIVE".equals(normalized)) {
            normalized = "IN_PROGRESS";
        }
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported campaign session status.");
        }
        return normalized;
    }
}
