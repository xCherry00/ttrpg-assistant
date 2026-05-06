package pl.ttrpgassistant.backend.generator;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "generator_definitions")
public class GeneratorDefinitionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(length = 48)
    private String icon;

    @Column(name = "category_code", length = 50)
    private String categoryCode;

    @Column(name = "type_code", length = 50)
    private String typeCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "genre_tags", columnDefinition = "jsonb")
    private List<String> genreTags = List.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "system_tags", columnDefinition = "jsonb")
    private List<String> systemTags = List.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tone_tags", columnDefinition = "jsonb")
    private List<String> toneTags = List.of();

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "icon_key", length = 80)
    private String iconKey;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public String getIcon() {
        return icon;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public List<String> getGenreTags() {
        return genreTags == null ? List.of() : genreTags;
    }

    public List<String> getSystemTags() {
        return systemTags == null ? List.of() : systemTags;
    }

    public List<String> getToneTags() {
        return toneTags == null ? List.of() : toneTags;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public String getIconKey() {
        return iconKey;
    }

    public boolean isActive() {
        return active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
