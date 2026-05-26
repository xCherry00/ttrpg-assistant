package pl.ttrpgassistant.backend.generator;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GeneratorExpansionIT {
    @Autowired
    private MockMvc mockMvc;

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
        assertGenerated("encounter_quick", "{\"params\":{\"setting\":\"Fantasy\",\"place\":\"Miasto\",\"dangerLevel\":\"Srednie\",\"tone\":\"Tajemnica\"}}");
        assertGenerated("complication_quick", "{\"params\":{\"sceneType\":\"Sledztwo\",\"severity\":\"Srednia\",\"tone\":\"Mroczna\"}}");
        assertGenerated("document_quick", "{\"params\":{\"documentType\":\"List\",\"tone\":\"Tajemniczy\",\"setting\":\"Fantasy\"}}");
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

    private void assertGenerated(String generatorCode, String body) throws Exception {
        mockMvc.perform(post("/api/generators/{generatorCode}/general.quick/generate", generatorCode)
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
}
