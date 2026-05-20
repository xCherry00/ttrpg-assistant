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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CampaignPlayerNotesIT {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void playerNotesPermissionsFlow() throws Exception {
        Fixture f = fixture();
        Number memberNoteId = createNote(f.memberToken, f.campaignId, "M", "member");
        createNote(f.ownerToken, f.campaignId, "O", "owner");

        String memberList = mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/player-notes")
                        .header("Authorization", "Bearer " + f.memberToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<?> memberItems = objectMapper.readValue(memberList, List.class);
        assertThat(memberItems).hasSize(1);

        String ownerList = mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/player-notes")
                        .header("Authorization", "Bearer " + f.ownerToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<?> ownerItems = objectMapper.readValue(ownerList, List.class);
        assertThat(ownerItems.size()).isGreaterThanOrEqualTo(2);

        mockMvc.perform(patch("/api/campaigns/" + f.campaignId + "/player-notes/" + memberNoteId.longValue())
                        .header("Authorization", "Bearer " + f.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "M2", "content", "member2"))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/campaigns/" + f.campaignId + "/player-notes/" + memberNoteId.longValue())
                        .header("Authorization", "Bearer " + f.otherMemberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "X", "content", "X"))))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/campaigns/" + f.campaignId + "/player-notes/" + memberNoteId.longValue())
                        .header("Authorization", "Bearer " + f.ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/campaigns/" + f.campaignId + "/player-notes")
                        .header("Authorization", "Bearer " + f.outsiderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidPayloadReturnsBadRequest() throws Exception {
        Fixture f = fixture();
        mockMvc.perform(post("/api/campaigns/" + f.campaignId + "/player-notes")
                        .header("Authorization", "Bearer " + f.memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "", "content", "x"))))
                .andExpect(status().isBadRequest());
    }

    private Number createNote(String token, long campaignId, String title, String content) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/player-notes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", title, "content", content))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return (Number) objectMapper.readValue(body, Map.class).get("id");
    }

    private Fixture fixture() throws Exception {
        UserEntity owner = createUser("notes-owner");
        UserEntity member = createUser("notes-member");
        UserEntity otherMember = createUser("notes-other-member");
        UserEntity outsider = createUser("notes-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String otherMemberToken = tokenFor(otherMember);
        String outsiderToken = tokenFor(outsider);
        Number campaignId = createCampaign(ownerToken);
        String joinCode = String.valueOf(objectMapper.readValue(mockMvc.perform(get("/api/campaigns/" + campaignId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), Map.class).get("joinCode"));
        join(memberToken, joinCode);
        join(otherMemberToken, joinCode);
        return new Fixture(campaignId.longValue(), ownerToken, memberToken, otherMemberToken, outsiderToken);
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
                                "title", "Notes Campaign",
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

    private record Fixture(long campaignId, String ownerToken, String memberToken, String otherMemberToken, String outsiderToken) {}
}
