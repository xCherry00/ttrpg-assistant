package pl.ttrpgassistant.backend.compendium;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.compendium.dto.DndConditionResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterDetailsResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterSummaryResponse;
import pl.ttrpgassistant.backend.security.JwtService;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DndInitiativeLookupControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private DndInitiativeLookupService lookupService;

    @Test
    void endpointsShouldRequireAuth() throws Exception {
        mockMvc.perform(get("/api/compendium/dnd5e/monsters?q=gob"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void endpointsShouldWorkWithAuth() throws Exception {
        String token = jwtService.createToken(12L, "PLAYER", false);
        when(lookupService.searchMonsters("gob"))
                .thenReturn(List.of(new DndMonsterSummaryResponse("goblin", "Goblin", "/api/2014/monsters/goblin")));
        when(lookupService.monsterDetails("goblin"))
                .thenReturn(new DndMonsterDetailsResponse("goblin", "Goblin", 15, 7, "2d6", 14, 2, "Small", "humanoid", 0.25, "D&D 5e SRD API", "https://www.dnd5eapi.co/"));
        when(lookupService.conditions())
                .thenReturn(List.of(new DndConditionResponse("blinded", "Blinded", "/api/2014/conditions/blinded")));

        String monstersBody = mockMvc.perform(get("/api/compendium/dnd5e/monsters?q=gob")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> monsters = objectMapper.readValue(monstersBody, List.class);
        assertThat(monsters).hasSize(1);

        String detailBody = mockMvc.perform(get("/api/compendium/dnd5e/monsters/goblin")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> details = objectMapper.readValue(detailBody, Map.class);
        assertThat(details.get("initiativeModifier")).isEqualTo(2);

        String conditionsBody = mockMvc.perform(get("/api/compendium/dnd5e/conditions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> conditions = objectMapper.readValue(conditionsBody, List.class);
        assertThat(conditions).hasSize(1);
    }
}

