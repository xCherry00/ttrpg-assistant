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
class CampaignCharacterAssignmentIT {

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
    private PlayerCharacterRepository playerCharacterRepository;

    @Test
    void ownerAndMemberCanAssignOwnCharacter() throws Exception {
        UserEntity owner = createUser("assign-owner");
        UserEntity member = createUser("assign-member");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);

        Number campaignId = createCampaign(ownerToken, "Assign Campaign");
        String inviteCode = String.valueOf(loadCampaignDetails(ownerToken, campaignId.longValue()).get("inviteCode"));

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", inviteCode))))
                .andExpect(status().isOk());

        PlayerCharacterEntity ownerCharacter = createCharacter(owner.getId(), "Owner Character");
        PlayerCharacterEntity memberCharacter = createCharacter(member.getId(), "Member Character");

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", memberCharacter.getId()))))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectAssigningOtherUsersCharacterAndNonMemberAssign() throws Exception {
        UserEntity owner = createUser("assign-guard-owner");
        UserEntity member = createUser("assign-guard-member");
        UserEntity outsider = createUser("assign-guard-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Assign Guard Campaign");
        String inviteCode = String.valueOf(loadCampaignDetails(ownerToken, campaignId.longValue()).get("inviteCode"));

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", inviteCode))))
                .andExpect(status().isOk());

        PlayerCharacterEntity ownerCharacter = createCharacter(owner.getId(), "Owner Character");

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectAssigningCharacterFromDifferentSystem() throws Exception {
        UserEntity owner = createUser("assign-system-owner");
        String ownerToken = tokenFor(owner);
        Number campaignId = createCampaign(ownerToken, "System Campaign");

        PlayerCharacterEntity cocCharacter = createCharacter(owner.getId(), "Investigator", "coc7e");

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", cocCharacter.getId()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectAssignToDeletedCampaign() throws Exception {
        UserEntity owner = createUser("deleted-campaign-owner");
        String ownerToken = tokenFor(owner);
        Number campaignId = createCampaign(ownerToken, "Deleted Campaign Assign");

        PlayerCharacterEntity ownerCharacter = createCharacter(owner.getId(), "Owner Character");

        CampaignEntity campaign = campaignRepository.findById(campaignId.longValue()).orElseThrow();
        campaign.setDeletedAt(Instant.now());
        campaignRepository.save(campaign);

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void duplicateAssignShouldBeIdempotentAndReassignShouldReactivate() throws Exception {
        UserEntity owner = createUser("idempotent-owner");
        String ownerToken = tokenFor(owner);
        Number campaignId = createCampaign(ownerToken, "Idempotent Campaign");
        PlayerCharacterEntity ownerCharacter = createCharacter(owner.getId(), "Owner Character");

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isOk());

        List<?> listed = listCampaignCharacters(ownerToken, campaignId.longValue());
        assertThat(listed).hasSize(1);

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue() + "/characters/" + ownerCharacter.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        List<?> afterDetach = listCampaignCharacters(ownerToken, campaignId.longValue());
        assertThat(afterDetach).isEmpty();

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isOk());

        List<?> afterReassign = listCampaignCharacters(ownerToken, campaignId.longValue());
        assertThat(afterReassign).hasSize(1);
    }

    @Test
    void listAndDetachShouldRespectPermissions() throws Exception {
        UserEntity owner = createUser("detach-owner");
        UserEntity member = createUser("detach-member");
        UserEntity outsider = createUser("detach-outsider");
        String ownerToken = tokenFor(owner);
        String memberToken = tokenFor(member);
        String outsiderToken = tokenFor(outsider);

        Number campaignId = createCampaign(ownerToken, "Detach Campaign");
        String inviteCode = String.valueOf(loadCampaignDetails(ownerToken, campaignId.longValue()).get("inviteCode"));

        mockMvc.perform(post("/api/campaigns/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", inviteCode))))
                .andExpect(status().isOk());

        PlayerCharacterEntity ownerCharacter = createCharacter(owner.getId(), "Owner Character");
        PlayerCharacterEntity memberCharacter = createCharacter(member.getId(), "Member Character");

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", ownerCharacter.getId()))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("characterId", memberCharacter.getId()))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/campaigns/" + campaignId.longValue() + "/characters")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue() + "/characters/" + ownerCharacter.getId())
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue() + "/characters/" + memberCharacter.getId())
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/campaigns/" + campaignId.longValue() + "/characters/" + ownerCharacter.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        List<?> listed = listCampaignCharacters(ownerToken, campaignId.longValue());
        assertThat(listed).isEmpty();
    }

    private List<?> listCampaignCharacters(String token, long campaignId) throws Exception {
        String body = mockMvc.perform(get("/api/campaigns/" + campaignId + "/characters")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(body, List.class);
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

    private Map<?, ?> loadCampaignDetails(String token, long campaignId) throws Exception {
        String body = mockMvc.perform(get("/api/campaigns/" + campaignId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(body, Map.class);
    }

    private PlayerCharacterEntity createCharacter(Long ownerUserId, String name) {
        return createCharacter(ownerUserId, name, "dnd5e");
    }

    private PlayerCharacterEntity createCharacter(Long ownerUserId, String name, String systemCode) {
        return playerCharacterRepository.save(PlayerCharacterEntity.builder()
                .ownerUserId(ownerUserId)
                .systemCode(systemCode)
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
