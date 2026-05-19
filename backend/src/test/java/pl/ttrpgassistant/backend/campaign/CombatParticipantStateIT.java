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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CombatParticipantStateIT {

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
    void ownerCanTrackHpConditionsAndDefeatedState() throws Exception {
        UserEntity owner = createUser("hp-owner");
        String ownerToken = tokenFor(owner);

        long campaignId = createCampaign(ownerToken, "HP campaign");
        long encounterId = createEncounter(ownerToken, campaignId, "State encounter");

        PlayerCharacterEntity hero = createCharacter(owner.getId(), "Knight", 20, 20);
        assignCharacter(ownerToken, campaignId, hero.getId());
        addCharacterParticipant(ownerToken, campaignId, encounterId, hero.getId(), 15);

        long goblinId = addCustomParticipant(ownerToken, campaignId, encounterId, "Goblin", 12, 18, 14, 5);

        Map<?, ?> afterDamage = postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + goblinId + "/damage",
                Map.of("amount", 7),
                status().isOk());
        Map<?, ?> goblinAfterDamage = participantById(afterDamage, goblinId);
        assertThat(goblinAfterDamage.get("tempHp")).isEqualTo(0);
        assertThat(goblinAfterDamage.get("currentHp")).isEqualTo(16);

        Map<?, ?> afterHeavyDamage = postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + goblinId + "/damage",
                Map.of("amount", 999),
                status().isOk());
        Map<?, ?> goblinAfterHeavyDamage = participantById(afterHeavyDamage, goblinId);
        assertThat(goblinAfterHeavyDamage.get("currentHp")).isEqualTo(0);
        assertThat(goblinAfterHeavyDamage.get("isDefeated")).isEqualTo(true);

        Map<?, ?> afterHeal = postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + goblinId + "/heal",
                Map.of("amount", 99),
                status().isOk());
        Map<?, ?> goblinAfterHeal = participantById(afterHeal, goblinId);
        assertThat(goblinAfterHeal.get("currentHp")).isEqualTo(18);
        assertThat(goblinAfterHeal.get("isDefeated")).isEqualTo(false);

        Map<?, ?> afterTempOverwrite = postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + goblinId + "/temporary-hp",
                Map.of("amount", 3),
                status().isOk());
        Map<?, ?> goblinAfterTempOverwrite = participantById(afterTempOverwrite, goblinId);
        assertThat(goblinAfterTempOverwrite.get("tempHp")).isEqualTo(3);

        Map<?, ?> afterConditions = postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + goblinId + "/conditions",
                Map.of("conditions", "poisoned,restrained"),
                status().isOk());
        Map<?, ?> goblinAfterConditions = participantById(afterConditions, goblinId);
        assertThat(goblinAfterConditions.get("conditions")).isEqualTo("poisoned,restrained");

        Map<?, ?> afterDefeat = postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + goblinId + "/defeat",
                null,
                status().isOk());
        assertThat(participantById(afterDefeat, goblinId).get("isDefeated")).isEqualTo(true);

        Map<?, ?> afterRestore = postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + goblinId + "/restore",
                null,
                status().isOk());
        assertThat(participantById(afterRestore, goblinId).get("isDefeated")).isEqualTo(false);
    }

    @Test
    void accessRulesAndFinishedEncounterShouldBlockStateMutations() throws Exception {
        UserEntity owner = createUser("hp-owner-2");
        UserEntity member = createUser("hp-member");
        UserEntity outsider = createUser("hp-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        long campaignId = createCampaign(ownerToken, "Access campaign");
        joinCampaign(memberToken, inviteCode(ownerToken, campaignId));
        long encounterId = createEncounter(ownerToken, campaignId, "Access encounter");
        long targetId = addCustomParticipant(ownerToken, campaignId, encounterId, "Orc", 11, 22, 22, 0);

        postState(memberToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + targetId + "/damage",
                Map.of("amount", 1),
                status().isNotFound());

        postState(outsiderToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + targetId + "/conditions",
                Map.of("conditions", "stunned"),
                status().isNotFound());

        mockMvc.perform(get("/api/campaigns/" + campaignId + "/encounters/" + encounterId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk());

        postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/finish",
                null,
                status().isOk());

        postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + targetId + "/heal",
                Map.of("amount", 1),
                status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForHpDisabledOrInvalidAmount() throws Exception {
        UserEntity owner = createUser("hp-owner-3");
        String ownerToken = tokenFor(owner);

        long campaignId = createCampaign(ownerToken, "Validation campaign");
        long encounterId = createEncounter(ownerToken, campaignId, "Validation encounter");
        long noHpId = addCustomParticipant(ownerToken, campaignId, encounterId, "Ghost", 7, null, null, 0);

        postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + noHpId + "/damage",
                Map.of("amount", 1),
                status().isBadRequest());
        postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + noHpId + "/heal",
                Map.of("amount", 1),
                status().isBadRequest());

        long hpId = addCustomParticipant(ownerToken, campaignId, encounterId, "Bandit", 8, 12, 10, 0);
        postState(ownerToken,
                "/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants/" + hpId + "/temporary-hp",
                Map.of("amount", -1),
                status().isBadRequest());
    }

    private Map<?, ?> participantById(Map<?, ?> encounterResponse, long participantId) {
        List<?> participants = (List<?>) encounterResponse.get("participants");
        return participants.stream()
                .map(item -> (Map<?, ?>) item)
                .filter(item -> ((Number) item.get("id")).longValue() == participantId)
                .findFirst()
                .orElseThrow();
    }

    private Map<?, ?> postState(String token, String path, Map<String, Object> body, org.springframework.test.web.servlet.ResultMatcher expectedStatus) throws Exception {
        var requestBuilder = post(path)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON);
        if (body != null) {
            requestBuilder.content(objectMapper.writeValueAsString(body));
        }
        String response = mockMvc.perform(requestBuilder)
                .andExpect(expectedStatus)
                .andReturn().getResponse().getContentAsString();
        if (response == null || response.isBlank()) {
            return Map.of();
        }
        return objectMapper.readValue(response, Map.class);
    }

    private long createCampaign(String token, String title) throws Exception {
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

    private void assignCharacter(String token, long campaignId, long characterId) throws Exception {
        mockMvc.perform(post("/api/campaigns/" + campaignId + "/characters")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", characterId))))
                .andExpect(status().isOk());
    }

    private void addCharacterParticipant(String token, long campaignId, long encounterId, long characterId, int initiativeValue) throws Exception {
        mockMvc.perform(post("/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "characterId", characterId,
                                "initiativeValue", initiativeValue
                        ))))
                .andExpect(status().isOk());
    }

    private long addCustomParticipant(String token, long campaignId, long encounterId, String name, int initiativeValue, Integer maxHp, Integer currentHp, int tempHp) throws Exception {
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("name", name);
        payload.put("participantType", "MONSTER");
        payload.put("initiativeValue", initiativeValue);
        payload.put("tempHp", tempHp);
        if (maxHp != null) {
            payload.put("maxHp", maxHp);
        }
        if (currentHp != null) {
            payload.put("currentHp", currentHp);
        }
        String body = mockMvc.perform(post("/api/campaigns/" + campaignId + "/encounters/" + encounterId + "/participants")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> encounter = objectMapper.readValue(body, Map.class);
        List<?> participants = (List<?>) encounter.get("participants");
        return participants.stream()
                .map(item -> (Map<?, ?>) item)
                .filter(item -> name.equals(item.get("name")))
                .map(item -> ((Number) item.get("id")).longValue())
                .findFirst()
                .orElseThrow();
    }

    private PlayerCharacterEntity createCharacter(Long ownerUserId, String name, int maxHp, int currentHp) {
        return playerCharacterRepository.save(PlayerCharacterEntity.builder()
                .ownerUserId(ownerUserId)
                .systemCode("dnd5e")
                .name(name)
                .status("ACTIVE")
                .raceName("Human")
                .className("Fighter")
                .backgroundName("Soldier")
                .level(1)
                .maxHp(maxHp)
                .currentHp(currentHp)
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
