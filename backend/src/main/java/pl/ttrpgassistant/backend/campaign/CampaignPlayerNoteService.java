package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.CampaignPlayerNoteResponse;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignPlayerNoteRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateCampaignPlayerNoteRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignPlayerNoteService {
    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignPlayerNoteRepository campaignPlayerNoteRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CampaignPlayerNoteResponse> list(Long userId, Long campaignId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        List<CampaignPlayerNoteEntity> notes = campaign.getOwnerUserId().equals(userId)
                ? campaignPlayerNoteRepository.findByCampaignIdOrderByUpdatedAtDesc(campaignId)
                : campaignPlayerNoteRepository.findByCampaignIdAndUserIdOrderByUpdatedAtDesc(campaignId, userId);
        Map<Long, UserEntity> users = userRepository.findAllById(notes.stream().map(CampaignPlayerNoteEntity::getUserId).toList())
                .stream().collect(Collectors.toMap(UserEntity::getId, Function.identity()));
        return notes.stream().map(note -> toResponse(note, users.get(note.getUserId()))).toList();
    }

    @Transactional
    public CampaignPlayerNoteResponse create(Long userId, Long campaignId, CreateCampaignPlayerNoteRequest request) {
        requireMemberAccess(userId, campaignId);
        CampaignPlayerNoteEntity saved = campaignPlayerNoteRepository.save(CampaignPlayerNoteEntity.builder()
                .campaignId(campaignId)
                .userId(userId)
                .title(request.title().trim())
                .content(request.content().trim())
                .build());
        return toResponse(saved, userRepository.findById(userId).orElse(null));
    }

    @Transactional
    public CampaignPlayerNoteResponse update(Long userId, Long campaignId, Long noteId, UpdateCampaignPlayerNoteRequest request) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        CampaignPlayerNoteEntity note = requireNote(campaignId, noteId);
        if (!note.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Note not found");
        }
        note.setTitle(request.title().trim());
        note.setContent(request.content().trim());
        CampaignPlayerNoteEntity saved = campaignPlayerNoteRepository.save(note);
        return toResponse(saved, userRepository.findById(saved.getUserId()).orElse(null));
    }

    @Transactional
    public void delete(Long userId, Long campaignId, Long noteId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        CampaignPlayerNoteEntity note = requireNote(campaignId, noteId);
        boolean owner = campaign.getOwnerUserId().equals(userId);
        if (!owner && !note.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Note not found");
        }
        campaignPlayerNoteRepository.delete(note);
    }

    private CampaignPlayerNoteEntity requireNote(Long campaignId, Long noteId) {
        CampaignPlayerNoteEntity note = campaignPlayerNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        if (!note.getCampaignId().equals(campaignId)) {
            throw new ResourceNotFoundException("Note not found");
        }
        return note;
    }

    private CampaignEntity requireMemberAccess(Long userId, Long campaignId) {
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        CampaignMemberId memberId = new CampaignMemberId(campaignId, userId);
        if (!campaign.getOwnerUserId().equals(userId) && !campaignMemberRepository.existsById(memberId)) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaign;
    }

    private CampaignPlayerNoteResponse toResponse(CampaignPlayerNoteEntity note, UserEntity user) {
        return new CampaignPlayerNoteResponse(
                note.getId(),
                note.getCampaignId(),
                note.getUserId(),
                user == null ? "" : user.getUsername(),
                displayNameFor(user),
                note.getTitle(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    private String displayNameFor(UserEntity user) {
        if (user == null) return "Nieznany uzytkownik";
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        return user.getUsername();
    }
}
