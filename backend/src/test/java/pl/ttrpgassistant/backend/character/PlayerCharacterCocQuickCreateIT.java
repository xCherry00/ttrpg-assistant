package pl.ttrpgassistant.backend.character;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.security.JwtService;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PlayerCharacterCocQuickCreateIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PlayerCharacterRepository playerCharacterRepository;

    @Test
    void cocOccupationsEndpointShouldReturnLocalList() throws Exception {
        String responseBody = mockMvc.perform(get("/api/compendium/coc7e/occupations"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(responseBody).doesNotContain("Compendium system not found");
        Map<?, ?>[] occupations = objectMapper.readValue(responseBody, Map[].class);
        assertThat(occupations).isNotEmpty();
        assertThat(occupations[0].containsKey("index")).isTrue();
        assertThat(occupations[0].containsKey("name")).isTrue();
    }

    @Test
    void quickCreateCocShouldCreateInvestigatorSnapshot() throws Exception {
        Long userId = 5L;
        String token = jwtService.createToken(userId, "PLAYER", false);

        Map<String, Object> request = Map.of(
                "firstName", "Ada",
                "lastName", "Price",
                "age", 29,
                "sex", "Female",
                "occupationIndex", "journalist",
                "portraitUrl", ""
        );

        String responseBody = mockMvc.perform(post("/api/characters/coc7e/quick-create")
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
        assertThat(saved.getSystemCode()).isEqualTo("coc7e");
        assertThat(saved.getSheetJson()).isNotBlank();

        Map<?, ?> sheet = objectMapper.readValue(saved.getSheetJson(), Map.class);
        assertThat(sheet.get("system")).isEqualTo("COC7E");
        assertThat(sheet.get("identity")).isNotNull();
        assertThat(sheet.get("characteristics")).isNotNull();
        assertThat(sheet.get("skills")).isNotNull();
        assertThat(sheet.get("derived")).isNotNull();

        Map<?, ?> derived = (Map<?, ?>) sheet.get("derived");
        assertThat(derived.get("hp")).isNotNull();
        assertThat(derived.get("san")).isNotNull();
        assertThat(derived.get("luck")).isNotNull();

        playerCharacterRepository.delete(saved);
    }
}
