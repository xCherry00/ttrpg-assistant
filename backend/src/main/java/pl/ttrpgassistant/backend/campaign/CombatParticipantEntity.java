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

@Entity
@Table(name = "combat_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatParticipantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "encounter_id", nullable = false)
    private Long encounterId;

    @Column(name = "character_id")
    private Long characterId;

    @Column(name = "name", nullable = false, length = 160)
    private String name;

    @Column(name = "participant_type", nullable = false, length = 30)
    private String participantType;

    @Column(name = "initiative_value", nullable = false)
    private Integer initiativeValue;

    @Column(name = "initiative_modifier")
    private Integer initiativeModifier;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "is_defeated", nullable = false)
    @Builder.Default
    private boolean defeated = false;

    @Column(name = "notes")
    private String notes;

    @Column(name = "max_hp")
    private Integer maxHp;

    @Column(name = "current_hp")
    private Integer currentHp;

    @Column(name = "temp_hp", nullable = false)
    @Builder.Default
    private Integer tempHp = 0;

    @Column(name = "armor_class")
    private Integer armorClass;

    @Column(name = "conditions")
    private String conditions;

    @Column(name = "death_save_successes", nullable = false)
    @Builder.Default
    private Integer deathSaveSuccesses = 0;

    @Column(name = "death_save_failures", nullable = false)
    @Builder.Default
    private Integer deathSaveFailures = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
