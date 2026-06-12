package pl.ttrpgassistant.backend.campaign;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CampaignRegressionIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private CampaignMemberRepository campaignMemberRepository;

    @Test
    void campaignOwnerFlowShouldCoverCreateListDetailsAndUpdate() throws Exception {
        UserEntity owner = createUser("campaign-owner");
        String ownerToken = tokenFor(owner);

        Number campaignId = createCampaign(ownerToken, "Owner Campaign");

        String listBody = mockMvc.perform(get("/api/campaigns")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> listResponse = objectMapper.readValue(listBody, Map.class);
        List<?> items = (List<?>) listResponse.get("items");
        assertThat(items).isNotEmpty();

        String detailsBody = mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> details = objectMapper.readValue(detailsBody, Map.class);
        assertThat(details.get("title")).isEqualTo("Owner Campaign");

        Map<String, Object> updateRequest = Map.of(
                "title", "Owner Campaign Updated",
                "description", "Updated description",
                "coverImageUrl", "",
                "visibility", "PRIVATE",
                "playerLimit", 6
        );

        String updateBody = mockMvc.perform(patch("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> updated = objectMapper.readValue(updateBody, Map.class);
        assertThat(updated.get("title")).isEqualTo("Owner Campaign Updated");
        assertThat(updated.get("playerLimit")).isEqualTo(6);
    }

    @Test
    void campaignJoinFlowShouldCoverValidInvalidDuplicateAndMemberAccess() throws Exception {
        UserEntity owner = createUser("join-owner");
        UserEntity member = createUser("join-member");
        UserEntity outsider = createUser("join-outsider");

        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Join Campaign");
        String detailsBody = mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String joinCode = String.valueOf(objectMapper.readValue(detailsBody, Map.class).get("joinCode"));

        String joinBody = mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", joinCode))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> joinResponse = objectMapper.readValue(joinBody, Map.class);
        assertThat(joinResponse.get("joined")).isEqualTo(true);

        String duplicateJoinBody = mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", joinCode))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> duplicateJoinResponse = objectMapper.readValue(duplicateJoinBody, Map.class);
        assertThat(duplicateJoinResponse.get("joined")).isEqualTo(false);

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", "BADCODE1"))))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void joinShouldRejectDeletedCampaignCode() throws Exception {
        UserEntity owner = createUser("deleted-owner");
        UserEntity joiner = createUser("deleted-joiner");
        String ownerToken = tokenFor(owner);
        String joinerToken = tokenFor(joiner);

        Number campaignId = createCampaign(ownerToken, "Deleted Campaign");
        String detailsBody = mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String joinCode = String.valueOf(objectMapper.readValue(detailsBody, Map.class).get("joinCode"));

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + joinerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", joinCode))))
                .andExpect(status().isNotFound());
    }

    @Test
    void softDeleteShouldBeAllowedForOwnerAndHideCampaignData() throws Exception {
        UserEntity owner = createUser("soft-owner");
        String ownerToken = tokenFor(owner);
        Number campaignId = createCampaign(ownerToken, "Soft Delete Campaign");

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        String listBody = mockMvc.perform(get("/api/campaigns")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> listResponse = objectMapper.readValue(listBody, Map.class);
        List<?> items = (List<?>) listResponse.get("items");
        List<Long> listedIds = items.stream()
                .map(item -> ((Number) ((Map<?, ?>) item).get("id")).longValue())
                .toList();
        assertThat(listedIds).doesNotContain(campaignId.longValue());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/sessions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void softDeleteShouldRejectNonOwnerAndOutsider() throws Exception {
        UserEntity owner = createUser("del-owner");
        UserEntity member = createUser("del-member");
        UserEntity outsider = createUser("del-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Delete Guard Campaign");
        String detailsBody = mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String joinCode = String.valueOf(objectMapper.readValue(detailsBody, Map.class).get("joinCode"));

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", joinCode))))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void campaignSessionFlowShouldCoverCreateListStartFinishAndPermissions() throws Exception {
        UserEntity owner = createUser("session-owner");
        UserEntity member = createUser("session-member");
        UserEntity outsider = createUser("session-outsider");

        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Session Campaign");
        String joinCode = campaignRepository.findById(campaignId.longValue()).orElseThrow().getJoinCode();

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", joinCode))))
                .andExpect(status().isOk());

        Map<String, Object> createSessionRequest = Map.of(
                "title", "Session One",
                "description", "Start",
                "scheduledFor", "2026-05-20T10:00:00Z"
        );

        String createSessionBody = mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/sessions")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSessionRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Number sessionId = (Number) objectMapper.readValue(createSessionBody, Map.class).get("id");

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/sessions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/note")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/start")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        String startedBody = mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/sessions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> startedSessions = objectMapper.readValue(startedBody, List.class);
        assertThat(((Map<?, ?>) startedSessions.get(0)).get("status")).isEqualTo("IN_PROGRESS");

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/finish")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/start")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/finish")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/finish")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void joinCodeShouldBeReusableAfterSoftDeleteForPartialUniqueIndex() {
        UserEntity owner = createUser("partial-owner");
        String joinCode = "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 7).toUpperCase();

        CampaignEntity first = campaignRepository.save(CampaignEntity.builder()
                .ownerUserId(owner.getId())
                .title("First")
                .systemCode("dnd5e")
                .status("active")
                .joinCode(joinCode)
                .visibility("PRIVATE")
                .playerLimit(5)
                .build());
        campaignMemberRepository.save(CampaignMemberEntity.builder()
                .id(new CampaignMemberId(first.getId(), owner.getId()))
                .role("gm")
                .build());

        first.setDeletedAt(Instant.now());
        campaignRepository.save(first);

        CampaignEntity second = campaignRepository.save(CampaignEntity.builder()
                .ownerUserId(owner.getId())
                .title("Second")
                .systemCode("dnd5e")
                .status("active")
                .joinCode(joinCode)
                .visibility("PRIVATE")
                .playerLimit(5)
                .build());
        assertThat(second.getId()).isNotNull();
    }

    @Test
    void campaignSessionNoteShouldRejectOversizedFields() throws Exception {
        UserEntity owner = createUser("session-note-limit-owner");
        String ownerToken = tokenFor(owner);
        Number campaignId = createCampaign(ownerToken, "Session Note Limit");
        Number sessionId = createSession(ownerToken, campaignId.longValue(), "Long Note Session");
        String oversized = "x".repeat(10001);

        mockMvc.perform(put("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/note")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("summary", oversized))))
                .andExpect(status().isBadRequest());
    }

    private Number createCampaign(String token, String title) throws Exception {
        Map<String, Object> request = Map.of(
                "title", title,
                "systemCode", "dnd5e",
                "description", "",
                "coverImageUrl", "",
                "visibility", "PRIVATE",
                "playerLimit", 5
        );

        String body = mockMvc.perform(post("/api/campaigns")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
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
                                "scheduledFor", "2026-05-20T18:00:00Z"
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
}
