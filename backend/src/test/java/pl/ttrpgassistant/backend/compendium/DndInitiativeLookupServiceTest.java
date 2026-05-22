package pl.ttrpgassistant.backend.compendium;

import org.junit.jupiter.api.Test;
import pl.ttrpgassistant.backend.character.Dnd5eApiClient;
import pl.ttrpgassistant.backend.compendium.dto.DndConditionResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterDetailsResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterSummaryResponse;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DndInitiativeLookupServiceTest {

    @Test
    void searchShouldMapMonsterSummaries() {
        Dnd5eApiClient apiClient = mock(Dnd5eApiClient.class);
        when(apiClient.get("/monsters")).thenReturn(Map.of(
                "results", List.of(
                        Map.of("index", "goblin", "name", "Goblin", "url", "/api/2014/monsters/goblin"),
                        Map.of("index", "dragon-red", "name", "Red Dragon", "url", "/api/2014/monsters/dragon-red")
                )
        ));

        DndInitiativeLookupService service = new DndInitiativeLookupService(apiClient);
        List<DndMonsterSummaryResponse> results = service.searchMonsters("gob");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).index()).isEqualTo("goblin");
        assertThat(results.get(0).name()).isEqualTo("Goblin");
    }

    @Test
    void detailsShouldMapAcHpDexAndInitiativeModifier() {
        Dnd5eApiClient apiClient = mock(Dnd5eApiClient.class);
        when(apiClient.get("/monsters/goblin")).thenReturn(Map.of(
                "index", "goblin",
                "name", "Goblin",
                "armor_class", List.of(Map.of("type", "natural", "value", 15)),
                "hit_points", 7,
                "hit_dice", "2d6",
                "dexterity", 14,
                "size", "Small",
                "type", "humanoid",
                "challenge_rating", 0.25
        ));

        DndInitiativeLookupService service = new DndInitiativeLookupService(apiClient);
        DndMonsterDetailsResponse details = service.monsterDetails("goblin");

        assertThat(details.armorClass()).isEqualTo(15);
        assertThat(details.hitPoints()).isEqualTo(7);
        assertThat(details.dexterity()).isEqualTo(14);
        assertThat(details.initiativeModifier()).isEqualTo(2);
    }

    @Test
    void conditionsShouldMapList() {
        Dnd5eApiClient apiClient = mock(Dnd5eApiClient.class);
        when(apiClient.get("/conditions")).thenReturn(Map.of(
                "results", List.of(
                        Map.of("index", "blinded", "name", "Blinded", "url", "/api/2014/conditions/blinded")
                )
        ));

        DndInitiativeLookupService service = new DndInitiativeLookupService(apiClient);
        List<DndConditionResponse> conditions = service.conditions();
        assertThat(conditions).hasSize(1);
        assertThat(conditions.get(0).name()).isEqualTo("Blinded");
    }

    @Test
    void shouldHandleExternalErrors() {
        Dnd5eApiClient apiClient = mock(Dnd5eApiClient.class);
        when(apiClient.get("/monsters")).thenThrow(new IllegalStateException("down"));
        when(apiClient.get("/conditions")).thenThrow(new IllegalStateException("down"));
        when(apiClient.get("/monsters/missing")).thenThrow(new IllegalStateException("down"));

        DndInitiativeLookupService service = new DndInitiativeLookupService(apiClient);

        assertThat(service.searchMonsters("x")).isEmpty();
        assertThat(service.conditions()).isEmpty();
        assertThatThrownBy(() -> service.monsterDetails("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

