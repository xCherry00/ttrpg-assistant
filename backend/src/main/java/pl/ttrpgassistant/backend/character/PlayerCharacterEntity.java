package pl.ttrpgassistant.backend.character;

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
@Table(name = "player_characters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerCharacterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(name = "system_code", nullable = false, length = 32)
    @Builder.Default
    private String systemCode = "dnd5e";

    @Column(name = "name", nullable = false, length = 160)
    private String name;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";

    @Column(name = "portrait_url")
    private String portraitUrl;

    @Column(name = "race_name", nullable = false, length = 120)
    @Builder.Default
    private String raceName = "";

    @Column(name = "subrace_name", nullable = false, length = 120)
    @Builder.Default
    private String subraceName = "";

    @Column(name = "class_name", nullable = false, length = 120)
    @Builder.Default
    private String className = "";

    @Column(name = "subclass_name", nullable = false, length = 120)
    @Builder.Default
    private String subclassName = "";

    @Column(name = "background_name", nullable = false, length = 120)
    @Builder.Default
    private String backgroundName = "";

    @Column(name = "alignment", nullable = false, length = 80)
    @Builder.Default
    private String alignment = "";

    @Column(name = "level", nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Column(name = "experience_points", nullable = false)
    @Builder.Default
    private Integer experiencePoints = 0;

    @Column(name = "ability_mode", nullable = false, length = 20)
    @Builder.Default
    private String abilityMode = "MANUAL";

    @Column(name = "strength", nullable = false)
    @Builder.Default
    private Integer strength = 10;

    @Column(name = "dexterity", nullable = false)
    @Builder.Default
    private Integer dexterity = 10;

    @Column(name = "constitution", nullable = false)
    @Builder.Default
    private Integer constitution = 10;

    @Column(name = "intelligence", nullable = false)
    @Builder.Default
    private Integer intelligence = 10;

    @Column(name = "wisdom", nullable = false)
    @Builder.Default
    private Integer wisdom = 10;

    @Column(name = "charisma", nullable = false)
    @Builder.Default
    private Integer charisma = 10;

    @Column(name = "max_hp", nullable = false)
    @Builder.Default
    private Integer maxHp = 1;

    @Column(name = "current_hp", nullable = false)
    @Builder.Default
    private Integer currentHp = 1;

    @Column(name = "temp_hp", nullable = false)
    @Builder.Default
    private Integer tempHp = 0;

    @Column(name = "armor_class", nullable = false)
    @Builder.Default
    private Integer armorClass = 10;

    @Column(name = "initiative_bonus", nullable = false)
    @Builder.Default
    private Integer initiativeBonus = 0;

    @Column(name = "speed", nullable = false)
    @Builder.Default
    private Integer speed = 30;

    @Column(name = "proficiency_bonus", nullable = false)
    @Builder.Default
    private Integer proficiencyBonus = 2;

    @Column(name = "hit_dice", nullable = false, length = 60)
    @Builder.Default
    private String hitDice = "";

    @Column(name = "skill_notes", nullable = false)
    @Builder.Default
    private String skillNotes = "";

    @Column(name = "saving_throw_notes", nullable = false)
    @Builder.Default
    private String savingThrowNotes = "";

    @Column(name = "equipment_notes", nullable = false)
    @Builder.Default
    private String equipmentNotes = "";

    @Column(name = "feature_notes", nullable = false)
    @Builder.Default
    private String featureNotes = "";

    @Column(name = "personality_notes", nullable = false)
    @Builder.Default
    private String personalityNotes = "";

    @Column(name = "private_notes", nullable = false)
    @Builder.Default
    private String privateNotes = "";

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
