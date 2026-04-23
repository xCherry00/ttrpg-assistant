package pl.ttrpgassistant.backend.generator;

import jakarta.persistence.*;

@Entity
@Table(
        name = "generator_pools",
        uniqueConstraints = @UniqueConstraint(name = "ux_generator_pool_type_system", columnNames = {"generator_type", "system_code"})
)
public class GeneratorPoolEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "generator_type", nullable = false, length = 32)
    private String generatorType;

    @Column(name = "system_code", nullable = false, length = 32)
    private String systemCode;

    @Column(name = "payload_json", nullable = false, columnDefinition = "jsonb")
    private String payloadJson;

    public Long getId() {
        return id;
    }

    public String getGeneratorType() {
        return generatorType;
    }

    public String getSystemCode() {
        return systemCode;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setGeneratorType(String generatorType) {
        this.generatorType = generatorType;
    }

    public void setSystemCode(String systemCode) {
        this.systemCode = systemCode;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }
}
