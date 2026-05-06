package pl.ttrpgassistant.backend.generator;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "generator_field_definitions")
public class GeneratorFieldDefinitionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_id", nullable = false)
    private GeneratorVariantEntity variant;

    @Column(name = "field_key", nullable = false, length = 80)
    private String fieldKey;

    @Column(nullable = false, length = 120)
    private String label;

    @Column(nullable = false, length = 32)
    private String type;

    @Column(name = "options_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String optionsJson;

    @Column(name = "default_value", length = 200)
    private String defaultValue;

    @Column(nullable = false)
    private boolean required;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    public Long getId() {
        return id;
    }

    public GeneratorVariantEntity getVariant() {
        return variant;
    }

    public String getFieldKey() {
        return fieldKey;
    }

    public String getLabel() {
        return label;
    }

    public String getType() {
        return type;
    }

    public String getOptionsJson() {
        return optionsJson;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public boolean isRequired() {
        return required;
    }

    public int getOrderIndex() {
        return orderIndex;
    }
}
