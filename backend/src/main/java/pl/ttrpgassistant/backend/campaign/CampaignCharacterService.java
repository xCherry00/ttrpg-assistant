package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.AssignCharacterToCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.CampaignCharacterResponse;
import pl.ttrpgassistant.backend.character.PlayerCharacterEntity;
import pl.ttrpgassistant.backend.character.PlayerCharacterRepository;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CampaignCharacterService {

    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignCharacterRepository campaignCharacterRepository;
    private final PlayerCharacterRepository playerCharacterRepository;

    @Transactional
    public CampaignCharacterResponse assignCharacter(Long userId, Long campaignId, AssignCharacterToCampaignRequest request) {
        requireMemberAccess(userId, campaignId);

        PlayerCharacterEntity character = playerCharacterRepository.findByIdAndOwnerUserId(request.characterId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        CampaignCharacterEntity assignment = campaignCharacterRepository.findByIdCampaignIdAndIdCharacterId(campaignId, character.getId())
                .orElseGet(() -> CampaignCharacterEntity.builder()
                        .id(new CampaignCharacterId(campaignId, character.getId()))
                        .userId(userId)
                        .role("PLAYER_CHARACTER")
                        .build());

        // Strategy: idempotent active assignment; detached assignment is reactivated.
        if (!assignment.isActive()) {
            assignment.setActive(true);
            assignment.setRemovedAt(null);
            assignment.setAssignedAt(Instant.now());
        }
        assignment.setUserId(userId);
        assignment.setRole("PLAYER_CHARACTER");

        CampaignCharacterEntity saved = campaignCharacterRepository.save(assignment);
        return toResponse(saved, character);
    }

    @Transactional(readOnly = true)
    public List<CampaignCharacterResponse> listCampaignCharacters(Long userId, Long campaignId) {
        requireMemberAccess(userId, campaignId);
        return campaignCharacterRepository.findByIdCampaignIdAndActiveTrueOrderByAssignedAtAsc(campaignId).stream()
                .map(assignment -> {
                    PlayerCharacterEntity character = assignment.getCharacter();
                    return toResponse(assignment, character);
                })
                .toList();
    }

    @Transactional
    public void detachCharacter(Long userId, Long campaignId, Long characterId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        CampaignCharacterEntity assignment = campaignCharacterRepository.findByIdCampaignIdAndIdCharacterId(campaignId, characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign character assignment not found"));

        boolean owner = campaign.getOwnerUserId().equals(userId);
        boolean ownCharacter = assignment.getUserId().equals(userId);
        if (!owner && !ownCharacter) {
            throw new ResourceNotFoundException("Campaign character assignment not found");
        }

        if (assignment.isActive()) {
            assignment.setActive(false);
            assignment.setRemovedAt(Instant.now());
            campaignCharacterRepository.save(assignment);
        }
    }

    private CampaignEntity requireMemberAccess(Long userId, Long campaignId) {
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        if (campaign.getOwnerUserId().equals(userId)) {
            return campaign;
        }
        if (!campaignMemberRepository.existsById(new CampaignMemberId(campaignId, userId))) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaign;
    }

    private CampaignCharacterResponse toResponse(CampaignCharacterEntity assignment, PlayerCharacterEntity character) {
        PlayerCharacterEntity resolved = character != null
                ? character
                : playerCharacterRepository.findById(assignment.getId().getCharacterId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
        return new CampaignCharacterResponse(
                assignment.getId().getCampaignId(),
                assignment.getId().getCharacterId(),
                resolved.getName(),
                resolved.getSystemCode(),
                resolved.getRaceName(),
                resolved.getClassName(),
                resolved.getBackgroundName(),
                resolved.getLevel(),
                resolved.getPortraitUrl(),
                assignment.getUserId(),
                assignment.getRole(),
                assignment.getAssignedAt(),
                assignment.isActive()
        );
    }
}
