package pl.ttrpgassistant.backend.generator;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "generator_results")
public class GeneratorResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "campaign_id")
    private Long campaignId;

    @Column(name = "generator_code", nullable = false, length = 64)
    private String generatorCode;

    @Column(name = "variant_code", nullable = false, length = 80)
    private String variantCode;

    @Column(name = "input_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String inputJson;

    @Column(name = "output_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String outputJson;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 500)
    private String summary;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getCampaignId() {
        return campaignId;
    }

    public String getGeneratorCode() {
        return generatorCode;
    }

    public String getVariantCode() {
        return variantCode;
    }

    public String getInputJson() {
        return inputJson;
    }

    public String getOutputJson() {
        return outputJson;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setCampaignId(Long campaignId) {
        this.campaignId = campaignId;
    }

    public void setGeneratorCode(String generatorCode) {
        this.generatorCode = generatorCode;
    }

    public void setVariantCode(String variantCode) {
        this.variantCode = variantCode;
    }

    public void setInputJson(String inputJson) {
        this.inputJson = inputJson;
    }

    public void setOutputJson(String outputJson) {
        this.outputJson = outputJson;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
