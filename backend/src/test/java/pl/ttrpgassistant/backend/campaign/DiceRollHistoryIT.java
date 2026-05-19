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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DiceRollHistoryIT {

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
    private PlayerCharacterRepository playerCharacterRepository;

    @Test
    void shouldCreateListProtectAndSoftDeleteDiceRolls() throws Exception {
        UserEntity owner = createUser("roll-owner");
        UserEntity member = createUser("roll-member");
        UserEntity outsider = createUser("roll-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        long campaignId = createCampaign(ownerToken, "Roll campaign");
        joinCampaign(memberToken, inviteCode(ownerToken, campaignId));
        long sessionId = createSession(ownerToken, campaignId);
        long encounterId = createEncounter(ownerToken, campaignId, "Roll encounter");
        long participantId = addCustomParticipant(ownerToken, campaignId, encounterId, "Wolf");

        PlayerCharacterEntity ownerCharacter = createCharacter(owner.getId(), "Dice Hero");
        assignCharacter(ownerToken, campaignId, ownerCharacter.getId());

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rollExpression", "d20"))))
                .andExpect(status().isNotFound());

        String memberRollBody = mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rollExpression", "1d20+3",
                                "rollType", "SKILL",
                                "sessionId", sessionId,
                                "encounterId", encounterId,
                                "participantId", participantId,
                                "characterId", ownerCharacter.getId(),
                                "rollLabel", "Perception"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> memberRoll = objectMapper.readValue(memberRollBody, Map.class);
        long memberRollId = ((Number) memberRoll.get("id")).longValue();
        assertThat(memberRoll.get("rollExpression")).isEqualTo("1d20+3");
        assertThat(memberRoll.get("rollType")).isEqualTo("SKILL");

        String privateRollBody = mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rollExpression", "2d6",
                                "isPrivate", true,
                                "rollType", "CUSTOM"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long privateRollId = ((Number) objectMapper.readValue(privateRollBody, Map.class).get("id")).longValue();

        String memberListBody = mockMvc.perform(get("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> memberList = objectMapper.readValue(memberListBody, List.class);
        assertThat(memberList).hasSize(1);
        assertThat(((Map<?, ?>) memberList.get(0)).get("id")).isEqualTo((int) memberRollId);

        String ownerListBody = mockMvc.perform(get("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> ownerList = objectMapper.readValue(ownerListBody, List.class);
        assertThat(ownerList).hasSize(2);

        mockMvc.perform(get("/api/campaigns/" + campaignId + "/dice-rolls/" + privateRollId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/campaigns/" + campaignId + "/dice-rolls/" + privateRollId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/campaigns/" + campaignId + "/dice-rolls/" + memberRollId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/campaigns/" + campaignId + "/dice-rolls/" + privateRollId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        String afterDeleteListBody = mockMvc.perform(get("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readValue(afterDeleteListBody, List.class)).isEmpty();
    }

    @Test
    void shouldValidateExpressionAndReferences() throws Exception {
        UserEntity owner = createUser("roll-owner-2");
        String ownerToken = tokenFor(owner);
        long campaignId = createCampaign(ownerToken, "Roll validation campaign");
        long encounterId = createEncounter(ownerToken, campaignId, "Validation encounter");
        long participantId = addCustomParticipant(ownerToken, campaignId, encounterId, "Bat");
        long otherCampaignId = createCampaign(ownerToken, "Other campaign");
        long otherEncounterId = createEncounter(ownerToken, otherCampaignId, "Other encounter");
        long otherParticipantId = addCustomParticipant(ownerToken, otherCampaignId, otherEncounterId, "Other bat");

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rollExpression", "1d20+2d6"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rollExpression", "21d6"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rollExpression", "1d1001"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rollExpression", "1d20+1001"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rollExpression", "d20",
                                "encounterId", otherEncounterId
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rollExpression", "d20",
                                "participantId", otherParticipantId
                        ))))
                .andExpect(status().isBadRequest());

        PlayerCharacterEntity notAssigned = createCharacter(owner.getId(), "Unassigned");
        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rollExpression", "d20",
                                "characterId", notAssigned.getId()
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId + "/dice-rolls")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rollExpression", "2d6",
                                "encounterId", encounterId,
                                "participantId", participantId
                        ))))
                .andExpect(status().isOk());
    }

    private long createCampaign(String token, String title) throws Exception {
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
        return ((Number) objectMapper.readValue(body, Map.class).get("id")).longValue();
    }

    private String inviteCode(String token, long campaignId) throws Exception {
        String body = mockMvc.perform(get("/api/campaigns/" + campaignId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return String.valueOf(objectMapper.readValue(body, Map.class).get("inviteCode"));
    }

    private void joinCampaign(String token, String code) throws Exception {
        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", code))))
                .andExpect(status().isOk());
    }

    private long createSession(String token, long campaignId) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "Session 1"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return ((Number) objectMapper.readValue(body, Map.class).get("id")).longValue();
    }

    private long createEncounter(String token, long campaignId, String name) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/encounters")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", name, "systemCode", "dnd5e"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return ((Number) objectMapper.readValue(body, Map.class).get("id")).longValue();
    }

    private long addCustomParticipant(String token, long campaignId, long encounterId, String name) throws Exception {
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", name,
                                "participantType", "MONSTER",
                                "initiativeValue", 10
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> participants = (List<?>) objectMapper.readValue(body, Map.class).get("participants");
        return participants.stream()
                .map(item -> (Map<?, ?>) item)
                .filter(item -> name.equals(item.get("name")))
                .map(item -> ((Number) item.get("id")).longValue())
                .findFirst()
                .orElseThrow();
    }

    private void assignCharacter(String token, long campaignId, long characterId) throws Exception {
        mockMvc.perform(post("/api/campaigns/" + campaignId + "/characters")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", characterId))))
                .andExpect(status().isOk());
    }

    private PlayerCharacterEntity createCharacter(Long ownerUserId, String name) {
        return playerCharacterRepository.save(PlayerCharacterEntity.builder()
                .ownerUserId(ownerUserId)
                .systemCode("dnd5e")
                .name(name)
                .status("ACTIVE")
                .raceName("Human")
                .className("Fighter")
                .backgroundName("Soldier")
                .level(1)
                .maxHp(10)
                .currentHp(10)
                .tempHp(0)
                .privateNotes("")
                .sheetJson("{}")
                .build());
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
