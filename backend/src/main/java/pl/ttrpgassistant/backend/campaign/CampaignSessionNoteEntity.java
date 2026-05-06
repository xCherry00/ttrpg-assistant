package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "campaign_session_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignSessionNoteEntity {

    @Id
    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "summary", nullable = false)
    @Builder.Default
    private String summary = "";

    @Column(name = "important_events", nullable = false)
    @Builder.Default
    private String importantEvents = "";

    @Column(name = "loot", nullable = false)
    @Builder.Default
    private String loot = "";

    @Column(name = "npc_refs", nullable = false)
    @Builder.Default
    private String npcRefs = "";

    @Column(name = "decisions", nullable = false)
    @Builder.Default
    private String decisions = "";

    @Column(name = "next_hooks", nullable = false)
    @Builder.Default
    private String nextHooks = "";

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
