package pl.ttrpgassistant.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class UploadStaticResourceConfig implements WebMvcConfigurer {
    @Value("${app.uploads.imagesDir:uploads/images}")
    private String imagesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path imagesRoot = Paths.get(imagesDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations(imagesRoot.toUri().toString() + "/");
    }
}
