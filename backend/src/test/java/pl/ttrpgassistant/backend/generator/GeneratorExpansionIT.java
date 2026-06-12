package pl.ttrpgassistant.backend.generator;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.campaign.CampaignEntity;
import pl.ttrpgassistant.backend.campaign.CampaignRepository;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GeneratorExpansionIT {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private CampaignRepository campaignRepository;
    @Autowired
    private GeneratorResultRepository generatorResultRepository;

    @Test
    void existingGeneratorsAcceptNewFormFields() throws Exception {
        assertFormHasField("location", "general.quick", "locationPurpose", "SELECT");
        assertFormHasField("hook", "general.quick", "stakes", "SELECT");
        assertFormHasField("hook", "general.quick", "twistLevel", "SELECT");
        assertFormHasField("loot_fantasy", "fantasy.quick", "rarity", "SELECT");
        assertFormHasField("clue", "horror.quick", "reliability", "SELECT");
        assertFormHasField("event_quick", "general.quick", "eventMood", "SELECT");
        assertFormHasField("shop_quick", "general.quick", "shopMood", "SELECT");
        assertFormHasField("story_hook_quick", "general.quick", "rumorReliability", "SELECT");
        assertFormHasField("story_hook_quick", "general.quick", "rumorSource", "SELECT");
    }

    @Test
    void newGeneratorsReturnStructuredResultsAndAreSaved() throws Exception {
        String token = tokenFor(createUser("generator-save"));
        assertGenerated("encounter_quick", "{\"params\":{\"setting\":\"Fantasy\",\"place\":\"Miasto\",\"dangerLevel\":\"Srednie\",\"tone\":\"Tajemnica\"}}", token);
        assertGenerated("complication_quick", "{\"params\":{\"sceneType\":\"Sledztwo\",\"severity\":\"Srednia\",\"tone\":\"Mroczna\"}}", token);
        assertGenerated("document_quick", "{\"params\":{\"documentType\":\"List\",\"tone\":\"Tajemniczy\",\"setting\":\"Fantasy\"}}", token);
    }

    @Test
    void anonymousGeneratorDoesNotSaveResult() throws Exception {
        long before = generatorResultRepository.count();

        mockMvc.perform(post("/api/generators/{generatorCode}/general.quick/generate", "encounter_quick")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"params\":{\"setting\":\"Fantasy\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", nullValue()))
                .andExpect(jsonPath("$.generatorCode").value("encounter_quick"));

        org.assertj.core.api.Assertions.assertThat(generatorResultRepository.count()).isEqualTo(before);
    }

    @Test
    void generatorWithCampaignIdRequiresUserAccess() throws Exception {
        UserEntity owner = createUser("generator-campaign-owner");
        UserEntity outsider = createUser("generator-campaign-outsider");
        CampaignEntity campaign = campaignRepository.save(CampaignEntity.builder()
                .ownerUserId(owner.getId())
                .title("Generator Access")
                .systemCode("dnd5e")
                .descriptionMd("")
                .joinCode(uniqueJoinCode())
                .visibility("PRIVATE")
                .playerLimit(5)
                .build());

        mockMvc.perform(post("/api/generators/{generatorCode}/general.quick/generate", "encounter_quick")
                        .header("Authorization", "Bearer " + tokenFor(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"campaignId\":" + campaign.getId() + ",\"params\":{\"setting\":\"Fantasy\"}}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void catalogContainsNewPracticalGenerators() throws Exception {
        mockMvc.perform(get("/api/generators"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].code", hasItem("encounter_quick")))
                .andExpect(jsonPath("$[*].code", hasItem("complication_quick")))
                .andExpect(jsonPath("$[*].code", hasItem("document_quick")));
    }

    private void assertFormHasField(String generatorCode, String variantCode, String fieldKey, String type) throws Exception {
        mockMvc.perform(get("/api/generators/{generatorCode}/{variantCode}/form", generatorCode, variantCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fields[?(@.key == '" + fieldKey + "')].type", hasItem(type)));
    }

    private void assertGenerated(String generatorCode, String body, String token) throws Exception {
        mockMvc.perform(post("/api/generators/{generatorCode}/general.quick/generate", generatorCode)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", notNullValue()))
                .andExpect(jsonPath("$.subtitle", notNullValue()))
                .andExpect(jsonPath("$.generatorCode").value(generatorCode))
                .andExpect(jsonPath("$.variantCode").value("general.quick"))
                .andExpect(jsonPath("$.sections[0].type").value("stats"))
                .andExpect(jsonPath("$.sections[*].type", hasItem("text")));
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

    private String uniqueJoinCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}
