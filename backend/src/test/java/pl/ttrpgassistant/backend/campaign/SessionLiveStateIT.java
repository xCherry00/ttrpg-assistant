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

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SessionLiveStateIT {

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

    @Test
    void ownerAndMemberCanGetLiveStateButNonMemberCannot() throws Exception {
        UserEntity owner = createUser("live-owner");
        UserEntity member = createUser("live-member");
        UserEntity outsider = createUser("live-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Live State Campaign");
        String joinCode = campaignRepository.findById(campaignId.longValue()).orElseThrow().getJoinCode();
        Number sessionId = createSession(ownerToken, campaignId.longValue(), "S1");
        joinCampaign(memberToken, joinCode);

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void ownerCanUpdateButMemberCannot() throws Exception {
        UserEntity owner = createUser("live-upd-owner");
        UserEntity member = createUser("live-upd-member");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);

        Number campaignId = createCampaign(ownerToken, "Live Update Campaign");
        String joinCode = campaignRepository.findById(campaignId.longValue()).orElseThrow().getJoinCode();
        Number sessionId = createSession(ownerToken, campaignId.longValue(), "S1");
        joinCampaign(memberToken, joinCode);

        mockMvc.perform(patch("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "sceneTitle", "Temple",
                                "sceneImageUrl", "https://example.com/scene.png",
                                "sceneDescription", "Ancient hall."
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("sceneTitle", "Nope"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectJavascriptImageUrlAndForeignEncounterAndForeignSession() throws Exception {
        UserEntity owner = createUser("live-guard-owner");
        String ownerToken = tokenFor(owner);

        Number campaignId = createCampaign(ownerToken, "A");
        Number sessionId = createSession(ownerToken, campaignId.longValue(), "A1");
        Number encounterId = createEncounter(ownerToken, campaignId.longValue(), "E1");

        Number otherCampaignId = createCampaign(ownerToken, "B");
        Number otherSessionId = createSession(ownerToken, otherCampaignId.longValue(), "B1");
        Number otherEncounterId = createEncounter(ownerToken, otherCampaignId.longValue(), "E2");

        mockMvc.perform(patch("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("sceneImageUrl", "javascript:alert(1)"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/campaigns/" + campaignId.longValue() + "/sessions/" + sessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("activeEncounterId", otherEncounterId.longValue()))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/campaigns/" + campaignId.longValue() + "/sessions/" + otherSessionId.longValue() + "/live-state")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("activeEncounterId", encounterId.longValue()))))
                .andExpect(status().isNotFound());
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

    private Number createSession(String token, Long campaignId, String title) throws Exception {
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

    private Number createEncounter(String token, Long campaignId, String name) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/encounters")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", name,
                                "systemCode", "dnd5e"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return (Number) objectMapper.readValue(body, Map.class).get("id");
    }

    private void joinCampaign(String token, String code) throws Exception {
        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", code))))
                .andExpect(status().isOk());
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
