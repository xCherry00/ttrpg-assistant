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
import org.hibernate.annotations.ColumnTransformer;

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

    @Column(name = "portrait_url", columnDefinition = "text")
    private String portraitUrl;

    @Column(name = "race_name", nullable = false, length = 120)
    @Builder.Default
    private String raceName = "";

    @Column(name = "class_name", nullable = false, length = 120)
    @Builder.Default
    private String className = "";

    @Column(name = "background_name", nullable = false, length = 120)
    @Builder.Default
    private String backgroundName = "";

    @Column(name = "level", nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Column(name = "max_hp", nullable = false)
    @Builder.Default
    private Integer maxHp = 1;

    @Column(name = "current_hp", nullable = false)
    @Builder.Default
    private Integer currentHp = 1;

    @Column(name = "temp_hp", nullable = false)
    @Builder.Default
    private Integer tempHp = 0;

    @Column(name = "private_notes", nullable = false)
    @Builder.Default
    private String privateNotes = "";

    @Column(name = "sheet_json", columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String sheetJson;

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
