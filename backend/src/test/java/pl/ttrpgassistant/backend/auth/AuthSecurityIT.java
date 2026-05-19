package pl.ttrpgassistant.backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import pl.ttrpgassistant.backend.campaign.CampaignEntity;
import pl.ttrpgassistant.backend.campaign.CampaignRepository;
import pl.ttrpgassistant.backend.character.PlayerCharacterEntity;
import pl.ttrpgassistant.backend.character.PlayerCharacterRepository;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthSecurityIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PlayerCharacterRepository playerCharacterRepository;

    @Autowired
    private CampaignRepository campaignRepository;

    @Test
    void registerShouldRejectPasswordShorterThanEight() throws Exception {
        Map<String, Object> request = Map.of(
                "email", uniqueEmail("short"),
                "password", "1234567"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerShouldAcceptPasswordWithEightCharactersOrMore() throws Exception {
        String email = uniqueEmail("ok");
        Map<String, Object> request = Map.of(
                "email", email,
                "password", "12345678"
        );

        String responseBody = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<?, ?> response = objectMapper.readValue(responseBody, Map.class);
        assertThat(response.get("token")).isNotNull();
        assertThat(userRepository.findByEmail(email)).isPresent();
    }

    @Test
    void loginShouldReturnGenericErrorForInvalidPassword() throws Exception {
        String email = uniqueEmail("login");
        createUser(email, "correct-password");

        Map<String, Object> request = Map.of(
                "email", email,
                "password", "wrong-password"
        );

        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<?, ?> response = objectMapper.readValue(responseBody, Map.class);
        assertThat(String.valueOf(response.get("message"))).isEqualTo("Invalid email or password");
    }

    @Test
    void protectedEndpointShouldRequireToken() throws Exception {
        mockMvc.perform(get("/api/characters"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointShouldWorkWithValidToken() throws Exception {
        UserEntity user = createUser(uniqueEmail("token"), "password-123");
        String token = jwtService.createToken(user.getId(), "PLAYER", false);

        mockMvc.perform(get("/api/characters")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void userShouldNotReadOrDeleteOtherUsersCharacter() throws Exception {
        UserEntity owner = createUser(uniqueEmail("char-owner"), "password-123");
        UserEntity attacker = createUser(uniqueEmail("char-attacker"), "password-123");
        String attackerToken = jwtService.createToken(attacker.getId(), "PLAYER", false);

        PlayerCharacterEntity character = playerCharacterRepository.save(PlayerCharacterEntity.builder()
                .ownerUserId(owner.getId())
                .name("Owner Character")
                .systemCode("dnd5e")
                .status("ACTIVE")
                .sheetJson("{}")
                .build());

        mockMvc.perform(get("/api/characters/" + character.getId())
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/characters/" + character.getId())
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void userShouldNotUpdateOtherUsersCampaign() throws Exception {
        UserEntity owner = createUser(uniqueEmail("camp-owner"), "password-123");
        UserEntity attacker = createUser(uniqueEmail("camp-attacker"), "password-123");
        String attackerToken = jwtService.createToken(attacker.getId(), "PLAYER", false);

        CampaignEntity campaign = campaignRepository.save(CampaignEntity.builder()
                .ownerUserId(owner.getId())
                .title("Owner Campaign")
                .systemCode("dnd5e")
                .status("active")
                .joinCode("J" + UUID.randomUUID().toString().replace("-", "").substring(0, 7).toUpperCase())
                .visibility("PRIVATE")
                .playerLimit(5)
                .build());

        Map<String, Object> updateRequest = Map.of(
                "title", "Hacked title",
                "description", "x",
                "coverImageUrl", "",
                "visibility", "PRIVATE",
                "playerLimit", 5
        );

        mockMvc.perform(patch("/api/campaigns/" + campaign.getId())
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void securityHeadersShouldBePresent() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Security-Policy"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test
    void rateLimiterShouldIgnoreSpoofedForwardedForHeader() throws Exception {
        String email = uniqueEmail("ratelimit");
        createUser(email, "correct-password");

        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .with(remoteAddr("10.10.10.10"))
                            .header("X-Forwarded-For", "203.0.113." + i)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "email", email,
                                    "password", "wrong-password"
                            ))))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                        .with(remoteAddr("10.10.10.10"))
                        .header("X-Forwarded-For", "198.51.100.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "wrong-password"
                        ))))
                .andExpect(status().isTooManyRequests());
    }

    private UserEntity createUser(String email, String password) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        return userRepository.save(UserEntity.builder()
                .email(email)
                .username("user-" + suffix)
                .tagCode(1000 + Math.abs(suffix.hashCode()) % 9000)
                .passwordHash(passwordEncoder.encode(password))
                .role(UserRole.PLAYER)
                .build());
    }

    private String uniqueEmail(String prefix) {
        return prefix + "+" + UUID.randomUUID() + "@example.com";
    }

    private RequestPostProcessor remoteAddr(String ip) {
        return request -> {
            request.setRemoteAddr(ip);
            return request;
        };
    }
}
