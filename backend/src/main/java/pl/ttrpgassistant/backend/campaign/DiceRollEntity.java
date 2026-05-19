package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "dice_rolls")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiceRollEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_id", nullable = false)
    private Long campaignId;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "encounter_id")
    private Long encounterId;

    @Column(name = "participant_id")
    private Long participantId;

    @Column(name = "character_id")
    private Long characterId;

    @Column(name = "rolled_by_user_id", nullable = false)
    private Long rolledByUserId;

    @Column(name = "roll_label", length = 160)
    private String rollLabel;

    @Column(name = "roll_expression", nullable = false, length = 120)
    private String rollExpression;

    @Column(name = "roll_type", nullable = false, length = 40)
    @Builder.Default
    private String rollType = "GENERIC";

    @Column(name = "total", nullable = false)
    private Integer total;

    @Column(name = "dice_results", nullable = false)
    private String diceResults;

    @Column(name = "modifier", nullable = false)
    @Builder.Default
    private Integer modifier = 0;

    @Column(name = "is_private", nullable = false)
    @Builder.Default
    private boolean isPrivate = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
