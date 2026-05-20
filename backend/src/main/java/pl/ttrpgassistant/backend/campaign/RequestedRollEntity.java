package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "requested_rolls")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestedRollEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_id", nullable = false)
    private Long campaignId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "target_character_id")
    private Long targetCharacterId;

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    @Column(name = "fulfilled_roll_id")
    private Long fulfilledRollId;

    @Column(name = "roll_label", nullable = false, length = 160)
    private String rollLabel;

    @Column(name = "roll_type", nullable = false, length = 40)
    @Builder.Default
    private String rollType = "SKILL";

    @Column(name = "roll_expression", length = 120)
    private String rollExpression;

    @Column(name = "ability_key", length = 80)
    private String abilityKey;

    @Column(name = "skill_key", length = 80)
    private String skillKey;

    @Column(name = "dc")
    private Integer dc;

    @Column(name = "is_dc_hidden", nullable = false)
    @Builder.Default
    private boolean isDcHidden = true;

    @Column(name = "show_success_to_player", nullable = false)
    @Builder.Default
    private boolean showSuccessToPlayer = false;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
