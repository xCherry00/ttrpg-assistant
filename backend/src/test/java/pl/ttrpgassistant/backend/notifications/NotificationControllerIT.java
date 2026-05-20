package pl.ttrpgassistant.backend.notifications;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.campaign.CampaignNotificationEntity;
import pl.ttrpgassistant.backend.campaign.CampaignNotificationRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private CampaignNotificationRepository campaignNotificationRepository;

    @Test
    void userCanSeeOnlyOwnNotifications() throws Exception {
        Fixture fixture = createFixture();
        createNotification(fixture.user1Id, "session_scheduled", null);
        createNotification(fixture.user2Id, "session_scheduled", null);

        String body = mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + fixture.user1Token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> payload = objectMapper.readValue(body, Map.class);
        assertThat(payload.get("unreadCount")).isEqualTo(1);
        List<?> items = (List<?>) payload.get("items");
        assertThat(items).hasSize(1);
    }

    @Test
    void markReadAndMarkAllReadWork() throws Exception {
        Fixture fixture = createFixture();
        CampaignNotificationEntity one = createNotification(fixture.user1Id, "session_started", null);
        createNotification(fixture.user1Id, "session_updated", null);

        mockMvc.perform(post("/api/notifications/" + one.getId() + "/read")
                        .header("Authorization", "Bearer " + fixture.user1Token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + fixture.user1Token))
                .andExpect(status().isOk());

        long unread = campaignNotificationRepository.countByUserIdAndReadAtIsNull(fixture.user1Id);
        assertThat(unread).isZero();
    }

    @Test
    void deleteOneAndClearAllWork() throws Exception {
        Fixture fixture = createFixture();
        CampaignNotificationEntity one = createNotification(fixture.user1Id, "session_started", null);
        createNotification(fixture.user1Id, "session_updated", null);

        mockMvc.perform(delete("/api/notifications/" + one.getId())
                        .header("Authorization", "Bearer " + fixture.user1Token))
                .andExpect(status().isOk());

        assertThat(campaignNotificationRepository.findById(one.getId())).isEmpty();

        mockMvc.perform(delete("/api/notifications")
                        .header("Authorization", "Bearer " + fixture.user1Token))
                .andExpect(status().isOk());

        assertThat(campaignNotificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(fixture.user1Id)).isEmpty();
    }

    @Test
    void otherUsersNotificationIdIsNotAccessible() throws Exception {
        Fixture fixture = createFixture();
        CampaignNotificationEntity foreign = createNotification(fixture.user2Id, "session_started", null);

        mockMvc.perform(post("/api/notifications/" + foreign.getId() + "/read")
                        .header("Authorization", "Bearer " + fixture.user1Token))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/notifications/" + foreign.getId())
                        .header("Authorization", "Bearer " + fixture.user1Token))
                .andExpect(status().isNotFound());
    }

    private CampaignNotificationEntity createNotification(Long userId, String type, Instant readAt) {
        return campaignNotificationRepository.save(CampaignNotificationEntity.builder()
                .campaignId(1L)
                .userId(userId)
                .type(type)
                .message("Test message")
                .readAt(readAt)
                .createdAt(Instant.now())
                .build());
    }

    private Fixture createFixture() {
        UserEntity user1 = createUser("notif-u1");
        UserEntity user2 = createUser("notif-u2");
        return new Fixture(
                user1.getId(),
                jwtService.createToken(user1.getId(), "PLAYER", false),
                user2.getId(),
                jwtService.createToken(user2.getId(), "PLAYER", false)
        );
    }

    private UserEntity createUser(String prefix) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        return userRepository.save(UserEntity.builder()
                .email(prefix + "+" + suffix + "@example.com")
                .username("user-" + suffix)
                .tagCode(1000 + Math.abs(suffix.hashCode()) % 9000)
                .passwordHash("unused")
                .role(UserRole.PLAYER)
                .build());
    }

    private record Fixture(Long user1Id, String user1Token, Long user2Id, String user2Token) {
    }
}
