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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CombatEncounterIT {

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
    void encounterFlowShouldRespectAccessAndTurnRules() throws Exception {
        UserEntity owner = createUser("enc-owner");
        UserEntity member = createUser("enc-member");
        UserEntity outsider = createUser("enc-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Encounter Campaign");
        String inviteCode = String.valueOf(campaignDetails(ownerToken, campaignId.longValue()).get("inviteCode"));

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", inviteCode))))
                .andExpect(status().isOk());

        String createdBody = mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Boss Fight",
                                "systemCode", "dnd5e"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Number encounterId = (Number) objectMapper.readValue(createdBody, Map.class).get("id");

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/encounters")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/encounters")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());

        PlayerCharacterEntity ownerCharacter = createCharacter(owner.getId(), "Hero");

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/participants")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "characterId", ownerCharacter.getId(),
                                "initiativeValue", 15,
                                "initiativeModifier", 2
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/participants")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "characterId", ownerCharacter.getId(),
                                "initiativeValue", 15,
                                "initiativeModifier", 2
                        ))))
                .andExpect(status().isOk());

        String secondParticipantBody = mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/participants")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Goblin",
                                "participantType", "MONSTER",
                                "initiativeValue", 14,
                                "initiativeModifier", 1
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> encounter = objectMapper.readValue(secondParticipantBody, Map.class);
        List<?> participants = (List<?>) encounter.get("participants");
        assertThat(participants).hasSize(2);
        assertThat(((Map<?, ?>) participants.get(0)).get("initiativeValue")).isEqualTo(15);

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/next-turn")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNotFound());

        String nextTurnBody = mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/next-turn")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> afterNext = objectMapper.readValue(nextTurnBody, Map.class);
        assertThat(afterNext.get("currentTurnIndex")).isEqualTo(1);

        String roundAdvanceBody = mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/next-turn")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> afterRound = objectMapper.readValue(roundAdvanceBody, Map.class);
        assertThat(afterRound.get("roundNumber")).isEqualTo(2);

        List<?> roundParticipants = (List<?>) afterRound.get("participants");
        Number goblinId = (Number) ((Map<?, ?>) roundParticipants.stream()
                .map(item -> (Map<?, ?>) item)
                .filter(item -> "Goblin".equals(item.get("name")))
                .findFirst().orElseThrow()).get("id");

        mockMvc.perform(patch("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/participants/" + goblinId.longValue())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isDefeated", true))))
                .andExpect(status().isOk());

        String skipDefeatedBody = mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/next-turn")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> skipDefeated = objectMapper.readValue(skipDefeatedBody, Map.class);
        assertThat(skipDefeated.get("currentTurnIndex")).isEqualTo(0);

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/finish")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/next-turn")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue() + "/participants")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Late Add",
                                "participantType", "CUSTOM",
                                "initiativeValue", 5
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue() + "/encounters/" + encounterId.longValue())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        String listBody = mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/encounters")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> encounters = objectMapper.readValue(listBody, List.class);
        assertThat(encounters).isEmpty();
    }

    private Map<?, ?> campaignDetails(String token, long campaignId) throws Exception {
        String body = mockMvc.perform(get("/api/campaigns/" + campaignId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(body, Map.class);
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
