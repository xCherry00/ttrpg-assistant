package pl.ttrpgassistant.backend.glossary;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "glossary_terms",
    uniqueConstraints = @UniqueConstraint(columnNames = {"term_pl", "system"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlossaryTerm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "term_pl", nullable = false, length = 120)
    private String termPl;

    @Column(name = "term_en", length = 120)
    private String termEn;

    @Column(nullable = false, columnDefinition = "text")
    private String definition;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false, length = 60)
    @Builder.Default
    private String system = "uniwersalne";

    @Column(nullable = false, length = 255)
    @Builder.Default
    private String tags = "";

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
