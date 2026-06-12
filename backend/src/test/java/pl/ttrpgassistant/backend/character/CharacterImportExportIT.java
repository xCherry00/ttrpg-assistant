package pl.ttrpgassistant.backend.character;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CharacterImportExportIT {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired PlayerCharacterRepository playerCharacterRepository;

    @Test
    void exportOwnCharacter() throws Exception {
        UserEntity owner = createUser("char-export-owner");
        String ownerToken = tokenFor(owner);
        PlayerCharacterEntity character = createCharacter(owner.getId(), "Export Hero", "dnd5e");
        character.setStatus("ACTIVE");
        character.setPortraitUrl("/assets/portraits/export-hero.png");
        character.setMaxHp(18);
        character.setCurrentHp(7);
        character.setTempHp(2);
        character.setPrivateNotes("Current private notes");
        character.setSheetJson("""
                {
                  "identity": {"name": "Old Name", "race": "Old Race", "className": "Old Class"},
                  "combat": {"maxHp": 1, "currentHp": 1, "tempHp": 0},
                  "notes": {"privateNotes": "Old notes"}
                }
                """);
        character = playerCharacterRepository.save(character);

        String body = mockMvc.perform(get("/api/characters/" + character.getId() + "/export")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> response = objectMapper.readValue(body, Map.class);
        assertThat(response.get("exportVersion")).isEqualTo("v1");
        Map<String, Object> exportedCharacter = (Map<String, Object>) response.get("character");
        assertThat(exportedCharacter.get("name")).isEqualTo("Export Hero");
        assertThat(exportedCharacter.get("systemCode")).isEqualTo("dnd5e");
        assertThat(exportedCharacter.get("status")).isEqualTo("ACTIVE");
        assertThat(exportedCharacter.get("portraitUrl")).isEqualTo("/assets/portraits/export-hero.png");
        assertThat(exportedCharacter.get("maxHp")).isEqualTo(18);
        assertThat(exportedCharacter.get("currentHp")).isEqualTo(7);
        assertThat(exportedCharacter.get("tempHp")).isEqualTo(2);
        assertThat(exportedCharacter.get("privateNotes")).isEqualTo("Current private notes");
        assertThat(exportedCharacter.get("createdAt")).isNotNull();
        assertThat(exportedCharacter.get("updatedAt")).isNotNull();
        Map<String, Object> exportedSheet = (Map<String, Object>) exportedCharacter.get("sheetJson");
        Map<String, Object> identity = (Map<String, Object>) exportedSheet.get("identity");
        Map<String, Object> combat = (Map<String, Object>) exportedSheet.get("combat");
        Map<String, Object> notes = (Map<String, Object>) exportedSheet.get("notes");
        assertThat(identity.get("name")).isEqualTo("Export Hero");
        assertThat(identity.get("race")).isEqualTo("Human");
        assertThat(identity.get("className")).isEqualTo("Fighter");
        assertThat(identity.get("background")).isEqualTo("Soldier");
        assertThat(combat.get("maxHp")).isEqualTo(18);
        assertThat(combat.get("currentHp")).isEqualTo(7);
        assertThat(combat.get("tempHp")).isEqualTo(2);
        assertThat(notes.get("privateNotes")).isEqualTo("Current private notes");
    }

    @Test
    void cannotExportForeignCharacterWithoutAccess() throws Exception {
        UserEntity owner = createUser("char-export-owner2");
        UserEntity outsider = createUser("char-export-outsider");
        String outsiderToken = tokenFor(outsider);
        PlayerCharacterEntity character = createCharacter(owner.getId(), "Private Hero", "dnd5e");

        mockMvc.perform(get("/api/characters/" + character.getId() + "/export")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void importValidDndCharacter() throws Exception {
        UserEntity owner = createUser("char-import-dnd");
        String token = tokenFor(owner);
        Map<String, Object> payload = importPayload("DND Import", "dnd5e", Map.of("level", 3));

        String body = mockMvc.perform(post("/api/characters/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> response = objectMapper.readValue(body, Map.class);
        Number id = (Number) response.get("characterId");
        assertThat(id).isNotNull();
        PlayerCharacterEntity saved = playerCharacterRepository.findById(id.longValue()).orElseThrow();
        assertThat(saved.getSystemCode()).isEqualTo("dnd5e");
        assertThat(saved.getName()).isEqualTo("DND Import");
    }

    @Test
    void importValidCocCharacter() throws Exception {
        UserEntity owner = createUser("char-import-coc");
        String token = tokenFor(owner);
        Map<String, Object> payload = importPayload("CoC Import", "coc7e", Map.of("occupation", "Detective"));

        String body = mockMvc.perform(post("/api/characters/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> response = objectMapper.readValue(body, Map.class);
        Number id = (Number) response.get("characterId");
        PlayerCharacterEntity saved = playerCharacterRepository.findById(id.longValue()).orElseThrow();
        assertThat(saved.getSystemCode()).isEqualTo("coc7e");
    }

    @Test
    void rejectUnsupportedSystem() throws Exception {
        UserEntity owner = createUser("char-import-bad-system");
        String token = tokenFor(owner);
        Map<String, Object> payload = importPayload("Bad", "pf2e", Map.of("foo", "bar"));

        mockMvc.perform(post("/api/characters/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectInvalidStructure() throws Exception {
        UserEntity owner = createUser("char-import-invalid");
        String token = tokenFor(owner);
        Map<String, Object> payload = Map.of(
                "exportVersion", "v1",
                "character", Map.of("name", "Broken", "systemCode", "dnd5e")
        );

        mockMvc.perform(post("/api/characters/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void importCreatesNewCharacterAndDoesNotOverwriteExisting() throws Exception {
        UserEntity owner = createUser("char-import-new");
        String token = tokenFor(owner);
        createCharacter(owner.getId(), "Duplicate Name", "dnd5e");
        Map<String, Object> payload = importPayload("Duplicate Name", "dnd5e", Map.of("level", 2));

        String body = mockMvc.perform(post("/api/characters/import")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> response = objectMapper.readValue(body, Map.class);
        Number id = (Number) response.get("characterId");
        PlayerCharacterEntity imported = playerCharacterRepository.findById(id.longValue()).orElseThrow();
        assertThat(imported.getName()).startsWith("Duplicate Name");
        assertThat(playerCharacterRepository.findByOwnerUserIdOrderByUpdatedAtDesc(owner.getId()).size()).isGreaterThanOrEqualTo(2);
    }

    private Map<String, Object> importPayload(String name, String systemCode, Map<String, Object> sheet) {
        return Map.of(
                "exportVersion", "v1",
                "character", Map.of(
                        "name", name,
                        "systemCode", systemCode,
                        "raceName", "Human",
                        "className", "Fighter",
                        "backgroundName", "Soldier",
                        "level", 1,
                        "portraitUrl", "",
                        "sheetJson", sheet,
                        "metadata", Map.of("status", "ACTIVE", "maxHp", 10, "currentHp", 10, "tempHp", 0, "privateNotes", "")
                )
        );
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
                .level("coc7e".equals(systemCode) ? 0 : 1)
                .maxHp(10)
                .currentHp(10)
                .tempHp(0)
                .privateNotes("")
                .sheetJson("{\"identity\":{\"name\":\"" + name + "\"}}")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
    }

    private String tokenFor(UserEntity user) { return jwtService.createToken(user.getId(), "PLAYER", false); }

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
