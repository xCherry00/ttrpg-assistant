package pl.ttrpgassistant.backend.rules;

import jakarta.persistence.*;

@Entity
@Table(name = "rules_pages")
public class RulesPage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="system_code", nullable=false, length=32)
    private String systemCode;

    @Column(nullable=false, length=64)
    private String slug;

    @Column(nullable=false, length=140)
    private String title;

    @Column(nullable=false, columnDefinition="text")
    private String content;

    @Column(nullable=false, length=64)
    private String category = "reference";

    @Column(length=280)
    private String summary;

    @Column(nullable=false, columnDefinition="text[]")
    private String[] tags = new String[0];

    @Column(name="quick_ref", nullable=false)
    private Boolean quickRef = false;

    @Column(name="sort_order", nullable=false)
    private Integer sortOrder = 100;

    @Column(name="source_label", length=120)
    private String sourceLabel;

    public Long getId() { return id; }
    public String getSystemCode() { return systemCode; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getCategory() { return category; }
    public String getSummary() { return summary; }
    public String[] getTags() { return tags; }
    public Boolean getQuickRef() { return quickRef; }
    public Integer getSortOrder() { return sortOrder; }
    public String getSourceLabel() { return sourceLabel; }

    public void setId(Long id) { this.id = id; }
    public void setSystemCode(String systemCode) { this.systemCode = systemCode; }
    public void setSlug(String slug) { this.slug = slug; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setCategory(String category) { this.category = category; }
    public void setSummary(String summary) { this.summary = summary; }
    public void setTags(String[] tags) { this.tags = tags; }
    public void setQuickRef(Boolean quickRef) { this.quickRef = quickRef; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public void setSourceLabel(String sourceLabel) { this.sourceLabel = sourceLabel; }
}
