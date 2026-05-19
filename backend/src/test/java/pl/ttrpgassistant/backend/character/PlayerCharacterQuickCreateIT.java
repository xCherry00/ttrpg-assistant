package pl.ttrpgassistant.backend.character;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.security.JwtService;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PlayerCharacterQuickCreateIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PlayerCharacterRepository playerCharacterRepository;

    @MockBean
    private DndCharacterSheetService dndCharacterSheetService;

    @Test
    void quickCreateShouldPersistCharacterWithSheetJson() throws Exception {
        Long userId = 5L;
        String characterName = "IT Quick Create";
        String token = jwtService.createToken(userId, "PLAYER", false);
        Map<String, Object> generatedSheet = sampleSheet(characterName);

        when(dndCharacterSheetService.generate(anyString(), eq("human"), eq("fighter"), eq("soldier"), eq((String) null)))
                .thenReturn(generatedSheet);

        Map<String, Object> request = Map.of(
                "name", characterName,
                "raceIndex", "human",
                "classIndex", "fighter",
                "backgroundIndex", "soldier",
                "portraitUrl", ""
        );

        String responseBody = mockMvc.perform(post("/api/characters/dnd/quick-create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<?, ?> response = objectMapper.readValue(responseBody, Map.class);
        Number responseId = (Number) response.get("id");
        assertThat(responseId).isNotNull();

        PlayerCharacterEntity saved = playerCharacterRepository.findById(responseId.longValue()).orElseThrow();
        assertThat(saved.getName()).isEqualTo(characterName);
        assertThat(saved.getSystemCode()).isEqualTo("dnd5e");
        assertThat(saved.getClassName()).isEqualTo("Fighter");
        assertThat(saved.getRaceName()).isEqualTo("Human");
        assertThat(saved.getLevel()).isEqualTo(1);
        assertThat(saved.getSheetJson()).isNotBlank();

        playerCharacterRepository.delete(saved);
    }

    @Test
    void quickCreateShouldRejectJavascriptPortraitUrl() throws Exception {
        Long userId = 6L;
        String token = jwtService.createToken(userId, "PLAYER", false);
        Map<String, Object> request = Map.of(
                "name", "Unsafe Portrait",
                "raceIndex", "human",
                "classIndex", "fighter",
                "backgroundIndex", "soldier",
                "portraitUrl", "javascript:alert(1)"
        );

        mockMvc.perform(post("/api/characters/dnd/quick-create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(dndCharacterSheetService);
    }

    private Map<String, Object> sampleSheet(String name) {
        Map<String, Object> snapshots = new LinkedHashMap<>();
        snapshots.put("race", Map.of("name", "Human"));
        snapshots.put("class", Map.of("name", "Fighter"));
        snapshots.put("background", Map.of("name", "Soldier"));

        Map<String, Object> combat = new LinkedHashMap<>();
        combat.put("maxHp", 12);
        combat.put("currentHp", 12);
        combat.put("tempHp", 0);
        combat.put("armorClass", 16);
        combat.put("initiative", 1);
        combat.put("speed", 30);
        combat.put("proficiencyBonus", 2);
        combat.put("hitDice", "1d10");

        Map<String, Object> sheet = new LinkedHashMap<>();
        sheet.put("system", "DND5E_2014");
        sheet.put("level", 1);
        sheet.put("sourceRefs", Map.of("race", "human", "class", "fighter", "background", "soldier"));
        sheet.put("snapshots", snapshots);
        sheet.put("identity", Map.of("name", name, "race", "Human", "className", "Fighter", "background", "Soldier", "portraitUrl", ""));
        sheet.put("abilityScores", Map.of("str", 15, "dex", 14, "con", 13, "int", 12, "wis", 10, "cha", 8));
        sheet.put("combat", combat);
        sheet.put("savingThrows", List.of("str", "con"));
        sheet.put("skills", List.of("athletics", "survival"));
        sheet.put("inventory", List.of("Longsword", "Shield"));
        sheet.put("featuresTraits", List.of("Fighting Style"));
        sheet.put("spells", null);
        sheet.put("notes", Map.of("backstory", "", "personality", "", "appearance", "", "privateNotes", ""));
        return sheet;
    }
}
