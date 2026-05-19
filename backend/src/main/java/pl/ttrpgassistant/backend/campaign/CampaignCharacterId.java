package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CampaignCharacterId implements Serializable {

    @Column(name = "campaign_id")
    private Long campaignId;

    @Column(name = "character_id")
    private Long characterId;
}
