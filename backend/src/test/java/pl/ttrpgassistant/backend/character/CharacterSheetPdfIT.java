package pl.ttrpgassistant.backend.character;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CharacterSheetPdfIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PlayerCharacterRepository playerCharacterRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    @Test
    void ownerCanDownloadOwnDndPdf() throws Exception {
        UserEntity owner = createUser("pdf-owner-dnd");
        PlayerCharacterEntity character = createCharacter(owner.getId(), "dnd5e", sampleDndSheet("Aldric"));
        String token = tokenFor(owner);

        byte[] body = mockMvc.perform(get("/api/characters/" + character.getId() + "/sheet.pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"character-sheet-" + character.getId() + ".pdf\""))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(body).isNotEmpty();
        assertThat(new String(body, 0, Math.min(body.length, 4))).isEqualTo("%PDF");
    }

    @Test
    void ownerCanDownloadOwnCocPdf() throws Exception {
        UserEntity owner = createUser("pdf-owner-coc");
        PlayerCharacterEntity character = createCharacter(owner.getId(), "coc7e", sampleCocSheet("Irene"));
        String token = tokenFor(owner);

        byte[] body = mockMvc.perform(get("/api/characters/" + character.getId() + "/sheet.pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(body).isNotEmpty();
    }

    @Test
    void nonOwnerCannotDownloadForeignCharacter() throws Exception {
        UserEntity owner = createUser("pdf-owner");
        UserEntity other = createUser("pdf-other");
        PlayerCharacterEntity character = createCharacter(owner.getId(), "dnd5e", sampleDndSheet("Hidden"));
        String otherToken = tokenFor(other);

        mockMvc.perform(get("/api/characters/" + character.getId() + "/sheet.pdf")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void missingCharacterReturnsNotFound() throws Exception {
        UserEntity owner = createUser("pdf-missing");
        String token = tokenFor(owner);
        mockMvc.perform(get("/api/characters/999999/sheet.pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void missingFieldsInSheetJsonDoesNotCrash() throws Exception {
        UserEntity owner = createUser("pdf-minimal");
        Map<String, Object> minimal = new LinkedHashMap<>();
        minimal.put("identity", Map.of("name", "NoData"));
        PlayerCharacterEntity character = createCharacter(owner.getId(), "dnd5e", minimal);
        String token = tokenFor(owner);

        byte[] body = mockMvc.perform(get("/api/characters/" + character.getId() + "/sheet.pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(body).isNotEmpty();
    }

    private PlayerCharacterEntity createCharacter(Long ownerId, String systemCode, Map<String, Object> sheet) throws Exception {
        return playerCharacterRepository.save(PlayerCharacterEntity.builder()
                .ownerUserId(ownerId)
                .systemCode(systemCode)
                .status("ACTIVE")
                .name(String.valueOf(map(sheet, "identity").getOrDefault("name", "Character")))
                .portraitUrl(null)
                .raceName("Human")
                .className("Warrior")
                .backgroundName("Soldier")
                .level(1)
                .maxHp(10)
                .currentHp(10)
                .tempHp(0)
                .privateNotes("")
                .sheetJson(objectMapper.writeValueAsString(sheet))
                .build());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Map<String, Object> root, String key) {
        Object value = root.get(key);
        if (value instanceof Map<?, ?> raw) return (Map<String, Object>) raw;
        return Map.of();
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

    private String tokenFor(UserEntity user) {
        return jwtService.createToken(user.getId(), "PLAYER", false);
    }

    private Map<String, Object> sampleDndSheet(String name) {
        Map<String, Object> combat = new LinkedHashMap<>();
        combat.put("currentHp", 11);
        combat.put("maxHp", 14);
        combat.put("armorClass", 15);
        return Map.of(
                "identity", Map.of("name", name, "race", "Human", "className", "Fighter", "background", "Guard"),
                "abilityScores", Map.of("str", 15, "dex", 12, "con", 14, "int", 10, "wis", 10, "cha", 8),
                "skills", List.of("athletics", "survival"),
                "inventory", List.of("Longsword", "Shield"),
                "combat", combat,
                "notes", Map.of("privateNotes", "Ready for battle")
        );
    }

    private Map<String, Object> sampleCocSheet(String name) {
        return Map.of(
                "identity", Map.of("name", name, "occupation", "Journalist", "age", 31),
                "characteristics", Map.of("str", 55, "dex", 60, "pow", 65),
                "skills", List.of("Library Use", "Spot Hidden"),
                "inventory", List.of("Notebook", "Camera"),
                "derived", Map.of("hp", 11, "mp", 13, "san", 62),
                "notes", Map.of("privateNotes", "Saw strange lights")
        );
    }
}
