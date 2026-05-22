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

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SessionPlayerNotesIT {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void createUpdateDeleteAndAccessControl() throws Exception {
        Fixture f = fixture();
        Map<String, Object> created = upsertMyNote(f.memberToken, f.campaignId, f.finishedSessionId, "Po sesji", "Bylo super");
        assertThat(created.get("id")).isNotNull();

        mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/sessions/" + f.finishedSessionId + "/notes/me")
                        .header("Authorization", "Bearer " + f.memberToken))
                .andExpect(status().isOk());

        Map<String, Object> updated = upsertMyNote(f.memberToken, f.campaignId, f.finishedSessionId, "Po sesji 2", "Nowa tresc");
        assertThat(updated.get("title")).isEqualTo("Po sesji 2");

        mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/sessions/" + f.finishedSessionId + "/notes/me")
                        .header("Authorization", "Bearer " + f.outsiderToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/campaigns/" + f.campaignId + "/sessions/" + f.finishedSessionId + "/notes/me")
                        .header("Authorization", "Bearer " + f.memberToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/sessions/" + f.finishedSessionId + "/notes/me")
                        .header("Authorization", "Bearer " + f.memberToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void backlogFiltersOnlyFinishedWithoutNotes() throws Exception {
        Fixture f = fixture();
        upsertMyNote(f.memberToken, f.campaignId, f.finishedSessionIdWithNote, "Notatka", "Juz jest");

        String backlogBody = mockMvc.perform(get("/api/dashboard/session-note-backlog")
                        .header("Authorization", "Bearer " + f.memberToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Map<String, Object>> items = objectMapper.readValue(backlogBody, List.class);
        List<Long> ids = items.stream().map(item -> ((Number) item.get("sessionId")).longValue()).toList();
        assertThat(ids).contains(f.finishedSessionId);
        assertThat(ids).doesNotContain(f.finishedSessionIdWithNote);
        assertThat(ids).doesNotContain(f.plannedSessionId);
        assertThat(ids).doesNotContain(f.inProgressSessionId);
    }

    private Map<String, Object> upsertMyNote(String token, long campaignId, long sessionId, String title, String content) throws Exception {
        String response = mockMvc.perform(put("/api/campaigns/" + campaignId + "/sessions/" + sessionId + "/notes/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", title, "content", content))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(response, Map.class);
    }

    private Fixture fixture() throws Exception {
        UserEntity owner = createUser("spn-owner");
        UserEntity member = createUser("spn-member");
        UserEntity outsider = createUser("spn-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);
        long campaignId = createCampaign(ownerToken).longValue();

        String joinCode = String.valueOf(objectMapper.readValue(mockMvc.perform(get("/api/campaigns/" + campaignId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), Map.class).get("joinCode"));
        join(memberToken, joinCode);

        long finishedSessionId = createSession(ownerToken, campaignId, "Finished without note").longValue();
        startSession(ownerToken, campaignId, finishedSessionId);
        finishSession(ownerToken, campaignId, finishedSessionId);

        long finishedWithNote = createSession(ownerToken, campaignId, "Finished with note").longValue();
        startSession(ownerToken, campaignId, finishedWithNote);
        finishSession(ownerToken, campaignId, finishedWithNote);

        long plannedSessionId = createSession(ownerToken, campaignId, "Planned").longValue();

        long inProgressSessionId = createSession(ownerToken, campaignId, "In progress").longValue();
        startSession(ownerToken, campaignId, inProgressSessionId);

        return new Fixture(campaignId, ownerToken, memberToken, outsiderToken, finishedSessionId, finishedWithNote, plannedSessionId, inProgressSessionId);
    }

    private void startSession(String token, long campaignId, long sessionId) throws Exception {
        mockMvc.perform(post("/api/campaigns/" + campaignId + "/sessions/" + sessionId + "/start")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private void finishSession(String token, long campaignId, long sessionId) throws Exception {
        mockMvc.perform(post("/api/campaigns/" + campaignId + "/sessions/" + sessionId + "/finish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private Number createSession(String token, long campaignId, String title) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", title, "description", "", "scheduledFor", "2026-05-20T18:00:00Z"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return (Number) objectMapper.readValue(body, Map.class).get("id");
    }

    private void join(String token, String code) throws Exception {
        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", code))))
                .andExpect(status().isOk());
    }

    private Number createCampaign(String token) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Session Notes Campaign",
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

    private String tokenFor(UserEntity user) { return jwtService.createToken(user.getId(), "PLAYER", false); }

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
            long campaignId,
            String ownerToken,
            String memberToken,
            String outsiderToken,
            long finishedSessionId,
            long finishedSessionIdWithNote,
            long plannedSessionId,
            long inProgressSessionId
    ) {}
}
