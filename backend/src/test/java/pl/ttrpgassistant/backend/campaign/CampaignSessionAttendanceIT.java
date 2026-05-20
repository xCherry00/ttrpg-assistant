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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CampaignSessionAttendanceIT {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void memberCanSetAndChangeAttendance() throws Exception {
        Fixture fixture = createFixture();
        mockMvc.perform(put(fixture.attendanceMeUrl())
                        .header("Authorization", "Bearer " + fixture.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "AVAILABLE"))))
                .andExpect(status().isOk());

        mockMvc.perform(put(fixture.attendanceMeUrl())
                        .header("Authorization", "Bearer " + fixture.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "MAYBE"))))
                .andExpect(status().isOk());
    }

    @Test
    void ownerAndMemberCanReadAttendanceButNonMemberCannot() throws Exception {
        Fixture fixture = createFixture();
        mockMvc.perform(get(fixture.attendanceUrl())
                        .header("Authorization", "Bearer " + fixture.ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get(fixture.attendanceUrl())
                        .header("Authorization", "Bearer " + fixture.memberToken))
                .andExpect(status().isOk());

        mockMvc.perform(get(fixture.attendanceUrl())
                        .header("Authorization", "Bearer " + fixture.outsiderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void cannotVoteForSessionFromAnotherCampaign() throws Exception {
        Fixture fixture = createFixture();
        Number secondCampaignId = createCampaign(fixture.ownerToken, "Second Campaign");
        Number secondSessionId = createSession(fixture.ownerToken, secondCampaignId.longValue(), "Second session");

        mockMvc.perform(put("/api/campaigns/" + fixture.campaignId + "/sessions/" + secondSessionId.longValue() + "/attendance/me")
                        .header("Authorization", "Bearer " + fixture.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "AVAILABLE"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidStatusAndTooLongNoteReturnBadRequest() throws Exception {
        Fixture fixture = createFixture();
        mockMvc.perform(put(fixture.attendanceMeUrl())
                        .header("Authorization", "Bearer " + fixture.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "YES"))))
                .andExpect(status().isBadRequest());

        String note = "x".repeat(1001);
        mockMvc.perform(put(fixture.attendanceMeUrl())
                        .header("Authorization", "Bearer " + fixture.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "MAYBE", "note", note))))
                .andExpect(status().isBadRequest());
    }

    private Fixture createFixture() throws Exception {
        UserEntity owner = createUser("attendance-owner");
        UserEntity member = createUser("attendance-member");
        UserEntity outsider = createUser("attendance-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Attendance Campaign");
        String joinCode = String.valueOf(objectMapper.readValue(mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), Map.class).get("joinCode"));
        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", joinCode))))
                .andExpect(status().isOk());

        Number sessionId = createSession(ownerToken, campaignId.longValue(), "Upcoming");
        return new Fixture(campaignId.longValue(), sessionId.longValue(), ownerToken, memberToken, outsiderToken);
    }

    private Number createCampaign(String token, String title) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", title,
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

    private record Fixture(long campaignId, long sessionId, String ownerToken, String memberToken, String outsiderToken) {
        String attendanceUrl() {
            return "/api/campaigns/" + campaignId + "/sessions/" + sessionId + "/attendance";
        }

        String attendanceMeUrl() {
            return attendanceUrl() + "/me";
        }
    }
}
