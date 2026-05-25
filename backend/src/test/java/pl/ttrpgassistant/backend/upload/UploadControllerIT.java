package pl.ttrpgassistant.backend.upload;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import pl.ttrpgassistant.backend.security.JwtService;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;
import pl.ttrpgassistant.backend.user.UserRole;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UploadControllerIT {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void uploadAcceptsPngJpegWebp() throws Exception {
        String token = tokenFor(createUser("upload-ok"));
        MockMultipartFile png = new MockMultipartFile("file", "test.png", "image/png", "png-content".getBytes(StandardCharsets.UTF_8));
        String response = mockMvc.perform(multipart("/api/uploads/images")
                        .file(png)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> body = objectMapper.readValue(response, Map.class);
        assertThat(String.valueOf(body.get("url"))).contains("/uploads/images/");
    }

    @Test
    void uploadRejectsInvalidType() throws Exception {
        String token = tokenFor(createUser("upload-bad-type"));
        MockMultipartFile txt = new MockMultipartFile("file", "bad.txt", "text/plain", "bad".getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(multipart("/api/uploads/images")
                        .file(txt)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadRequiresAuth() throws Exception {
        MockMultipartFile png = new MockMultipartFile("file", "test.png", "image/png", "png-content".getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(multipart("/api/uploads/images").file(png))
                .andExpect(status().isUnauthorized());
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
}
