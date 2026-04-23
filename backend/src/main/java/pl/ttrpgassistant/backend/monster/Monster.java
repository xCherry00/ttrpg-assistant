package pl.ttrpgassistant.backend.monster;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "monsters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Monster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_pl", nullable = false, length = 120)
    private String namePl;

    @Column(name = "name_en", nullable = false, length = 120)
    private String nameEn;

    @Column(name = "initiative_mod", nullable = false)
    private Integer initiativeMod;

    @Column(name = "armor_class", nullable = false)
    private Integer armorClass;

    @Column(name = "hit_points", nullable = false)
    private Integer hitPoints;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
