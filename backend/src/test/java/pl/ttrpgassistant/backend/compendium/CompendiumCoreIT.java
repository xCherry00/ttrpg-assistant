package pl.ttrpgassistant.backend.compendium;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CompendiumCoreIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void systemsAndCategoriesShouldReturnDnd5eMetadata() throws Exception {
        String systemsBody = mockMvc.perform(get("/api/compendium/systems"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> systems = objectMapper.readValue(systemsBody, List.class);
        assertThat(systems).isNotEmpty();

        String categoriesBody = mockMvc.perform(get("/api/compendium/dnd5e/categories"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> categories = objectMapper.readValue(categoriesBody, List.class);
        assertThat(categories).isNotEmpty();

        Map<?, ?> firstSystem = (Map<?, ?>) systems.get(0);
        assertThat(firstSystem.get("code")).isEqualTo("dnd5e");

        Map<?, ?> firstCategory = (Map<?, ?>) categories.get(0);
        assertThat(firstCategory.get("code")).isNotNull();
        assertThat(firstCategory.get("columns")).isNotNull();
    }
}
