package pl.ttrpgassistant.backend.generator;

import jakarta.persistence.*;

@Entity
@Table(
        name = "generator_variants",
        uniqueConstraints = @UniqueConstraint(name = "ux_generator_variant_code", columnNames = {"generator_definition_id", "variant_code"})
)
public class GeneratorVariantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "generator_definition_id", nullable = false)
    private GeneratorDefinitionEntity generatorDefinition;

    @Column(name = "variant_code", nullable = false, length = 80)
    private String variantCode;

    @Column(name = "system_code", nullable = false, length = 32)
    private String systemCode;

    @Column(name = "setting_code", nullable = false, length = 48)
    private String settingCode;

    @Column(nullable = false, length = 32)
    private String mode;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Long getId() {
        return id;
    }

    public GeneratorDefinitionEntity getGeneratorDefinition() {
        return generatorDefinition;
    }

    public String getVariantCode() {
        return variantCode;
    }

    public String getSystemCode() {
        return systemCode;
    }

    public String getSettingCode() {
        return settingCode;
    }

    public String getMode() {
        return mode;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }
}
