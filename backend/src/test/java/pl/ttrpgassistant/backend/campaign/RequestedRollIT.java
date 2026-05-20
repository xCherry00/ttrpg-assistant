package pl.ttrpgassistant.backend.campaign;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.character.PlayerCharacterEntity;
import pl.ttrpgassistant.backend.character.PlayerCharacterRepository;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RequestedRollIT {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired PlayerCharacterRepository playerCharacterRepository;
    @Autowired CampaignCharacterRepository campaignCharacterRepository;

    @Test
    void requestedRollLifecyclePermissions() throws Exception {
        Fixture f = fixture();
        Long charId = assignCharacterToCampaign(f.campaignId, f.memberUserId, "dnd5e");

        String createdBody = mockMvc.perform(post("/api/campaigns/" + f.campaignId + "/sessions/" + f.inProgressSessionId + "/requested-rolls")
                        .header("Authorization", "Bearer " + f.ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetMode", "CHARACTER",
                                "targetCharacterIds", List.of(charId),
                                "rollLabel", "Percepcja",
                                "rollType", "SKILL",
                                "dc", 12,
                                "isDcHidden", true
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> created = objectMapper.readValue(createdBody, List.class);
        Number requestId = (Number) ((Map<?, ?>) created.get(0)).get("id");

        mockMvc.perform(post("/api/campaigns/" + f.campaignId + "/sessions/" + f.inProgressSessionId + "/requested-rolls")
                        .header("Authorization", "Bearer " + f.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("targetMode", "ALL", "rollLabel", "X"))))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/campaigns/" + f.campaignId + "/sessions/" + f.plannedSessionId + "/requested-rolls")
                        .header("Authorization", "Bearer " + f.ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("targetMode", "ALL", "rollLabel", "X"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + f.campaignId + "/sessions/" + f.inProgressSessionId + "/requested-rolls/" + requestId.longValue() + "/fulfill")
                        .header("Authorization", "Bearer " + f.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + f.campaignId + "/sessions/" + f.inProgressSessionId + "/requested-rolls/" + requestId.longValue() + "/fulfill")
                        .header("Authorization", "Bearer " + f.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of())))
                .andExpect(status().isBadRequest());

        String ownerList = mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/sessions/" + f.inProgressSessionId + "/requested-rolls")
                        .header("Authorization", "Bearer " + f.ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> ownerItems = objectMapper.readValue(ownerList, List.class);
        assertThat(ownerItems).isNotEmpty();
        Map<?, ?> firstOwner = (Map<?, ?>) ownerItems.get(0);
        assertThat(firstOwner.get("dc")).isNotNull();

        String memberList = mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/sessions/" + f.inProgressSessionId + "/requested-rolls")
                        .header("Authorization", "Bearer " + f.memberToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> memberItems = objectMapper.readValue(memberList, List.class);
        assertThat(memberItems).isNotEmpty();
        Map<?, ?> firstMember = (Map<?, ?>) memberItems.get(0);
        assertThat(firstMember.get("dc")).isNull();
    }

    private Long assignCharacterToCampaign(Long campaignId, Long userId, String systemCode) {
        PlayerCharacterEntity character = playerCharacterRepository.save(PlayerCharacterEntity.builder()
                .ownerUserId(userId)
                .systemCode(systemCode)
                .name("Hero " + UUID.randomUUID())
                .status("READY")
                .build());
        campaignCharacterRepository.save(CampaignCharacterEntity.builder()
                .id(new CampaignCharacterId(campaignId, character.getId()))
                .userId(userId)
                .role("PLAYER_CHARACTER")
                .active(true)
                .build());
        return character.getId();
    }

    private Fixture fixture() throws Exception {
        UserEntity owner = createUser("rr-owner");
        UserEntity member = createUser("rr-member");
        UserEntity outsider = createUser("rr-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken);
        String joinCode = String.valueOf(objectMapper.readValue(mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), Map.class).get("joinCode"));
        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", joinCode))))
                .andExpect(status().isOk());

        Number planned = createSession(ownerToken, campaignId.longValue(), "Planned");
        Number inProgress = createSession(ownerToken, campaignId.longValue(), "Active");
        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/sessions/" + inProgress.longValue() + "/start")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        return new Fixture(
                campaignId.longValue(),
                planned.longValue(),
                inProgress.longValue(),
                owner.getId(),
                member.getId(),
                ownerToken,
                memberToken,
                outsiderToken
        );
    }

    private Number createCampaign(String token) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "RR Campaign",
                                "systemCode", "dnd5e",
                                "description", "",
                                "coverImageUrl", "",
                                "visibility", "PRIVATE",
                                "playerLimit", 5
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return (Number) objectMapper.readValue(body, Map.class).get("id");
    }

    private Number createSession(String token, long campaignId, String title) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", title,
                                "description", "",
                                "scheduledFor", "2026-05-20T10:00:00Z"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return (Number) objectMapper.readValue(body, Map.class).get("id");
    }

    private String tokenFor(UserEntity user) {
        return jwtService.createToken(user.getId(), "PLAYER", false);
    }

    private UserEntity createUser(String prefix) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        return userRepository.save(UserEntity.builder()
                .email(prefix + "+" + suffix + "@example.com")
                .username("user-" + suffix)
                .tagCode(1000 + Math.abs(suffix.hashCode()) % 9000)
                .passwordHash(passwordEncoder.encode("password-123"))
                .role(UserRole.PLAYER)
                .build());
    }

    private record Fixture(
            Long campaignId,
            Long plannedSessionId,
            Long inProgressSessionId,
            Long ownerUserId,
            Long memberUserId,
            String ownerToken,
            String memberToken,
            String outsiderToken
    ) {}
}
