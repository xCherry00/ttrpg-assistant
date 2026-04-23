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

    public Long getId() { return id; }
    public String getSystemCode() { return systemCode; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getContent() { return content; }

    public void setId(Long id) { this.id = id; }
    public void setSystemCode(String systemCode) { this.systemCode = systemCode; }
    public void setSlug(String slug) { this.slug = slug; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
}
