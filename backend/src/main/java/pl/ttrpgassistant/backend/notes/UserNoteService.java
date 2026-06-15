package pl.ttrpgassistant.backend.notes;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.CampaignEntity;
import pl.ttrpgassistant.backend.campaign.CampaignMemberId;
import pl.ttrpgassistant.backend.campaign.CampaignMemberRepository;
import pl.ttrpgassistant.backend.campaign.CampaignRepository;
import pl.ttrpgassistant.backend.character.PlayerCharacterEntity;
import pl.ttrpgassistant.backend.character.PlayerCharacterRepository;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.notes.dto.CreateUserNoteRequest;
import pl.ttrpgassistant.backend.notes.dto.UpdateUserNoteRequest;
import pl.ttrpgassistant.backend.notes.dto.UserNoteResponse;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserNoteService {

    private final UserNoteRepository userNoteRepository;
    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final PlayerCharacterRepository playerCharacterRepository;

    @Transactional(readOnly = true)
    public List<UserNoteResponse> list(Long userId) {
        List<UserNoteEntity> notes = userNoteRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        Map<Long, CampaignEntity> campaigns = campaignRepository.findAllById(notes.stream()
                        .map(UserNoteEntity::getCampaignId)
                        .filter(id -> id != null)
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(CampaignEntity::getId, Function.identity()));
        Map<Long, PlayerCharacterEntity> characters = playerCharacterRepository.findAllById(notes.stream()
                        .map(UserNoteEntity::getCharacterId)
                        .filter(id -> id != null)
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(PlayerCharacterEntity::getId, Function.identity()));

        return notes.stream()
                .map(note -> toResponse(note, campaigns.get(note.getCampaignId()), characters.get(note.getCharacterId())))
                .toList();
    }

    @Transactional
    public UserNoteResponse create(Long userId, CreateUserNoteRequest request) {
        CampaignEntity campaign = resolveCampaign(userId, request.campaignId());
        PlayerCharacterEntity character = resolveCharacter(userId, request.characterId());
        UserNoteEntity saved = userNoteRepository.save(UserNoteEntity.builder()
                .userId(userId)
                .title(request.title().trim())
                .type(request.type())
                .content(normalizeContent(request.content()))
                .campaignId(request.campaignId())
                .characterId(request.characterId())
                .build());
        return toResponse(saved, campaign, character);
    }

    @Transactional
    public UserNoteResponse update(Long userId, Long noteId, UpdateUserNoteRequest request) {
        UserNoteEntity note = userNoteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        CampaignEntity campaign = resolveCampaign(userId, request.campaignId());
        PlayerCharacterEntity character = resolveCharacter(userId, request.characterId());

        note.setTitle(request.title().trim());
        note.setType(request.type());
        note.setContent(normalizeContent(request.content()));
        note.setCampaignId(request.campaignId());
        note.setCharacterId(request.characterId());

        UserNoteEntity saved = userNoteRepository.save(note);
        return toResponse(saved, campaign, character);
    }

    @Transactional
    public void delete(Long userId, Long noteId) {
        UserNoteEntity note = userNoteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        userNoteRepository.delete(note);
    }

    private CampaignEntity resolveCampaign(Long userId, Long campaignId) {
        if (campaignId == null) {
            return null;
        }
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        CampaignMemberId memberId = new CampaignMemberId(campaignId, userId);
        if (!campaign.getOwnerUserId().equals(userId) && !campaignMemberRepository.existsById(memberId)) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaign;
    }

    private PlayerCharacterEntity resolveCharacter(Long userId, Long characterId) {
        if (characterId == null) {
            return null;
        }
        return playerCharacterRepository.findByIdAndOwnerUserId(characterId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
    }

    private String normalizeContent(String content) {
        return content == null ? "" : content.trim();
    }

    private UserNoteResponse toResponse(UserNoteEntity note, CampaignEntity campaign, PlayerCharacterEntity character) {
        return new UserNoteResponse(
                note.getId(),
                note.getTitle(),
                note.getType(),
                note.getContent(),
                note.getCampaignId(),
                campaign == null ? null : campaign.getTitle(),
                note.getCharacterId(),
                character == null ? null : character.getName(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
