package pl.ttrpgassistant.backend.generator;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "generator_templates")
public class GeneratorTemplateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "generator_code", nullable = false, length = 64)
    private String generatorCode;

    @Column(name = "variant_code", nullable = false, length = 80)
    private String variantCode;

    @Column(name = "config_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String configJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getGeneratorCode() {
        return generatorCode;
    }

    public String getVariantCode() {
        return variantCode;
    }

    public String getConfigJson() {
        return configJson;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setGeneratorCode(String generatorCode) {
        this.generatorCode = generatorCode;
    }

    public void setVariantCode(String variantCode) {
        this.variantCode = variantCode;
    }

    public void setConfigJson(String configJson) {
        this.configJson = configJson;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
