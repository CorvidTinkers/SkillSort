package com.SkillSort.Backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**").allowedOrigins("*");
                // Allow static files to be requested
                registry.addMapping("/resumes/**").allowedOrigins("*");
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                Path uploadDir = Paths.get("uploads", "resumes");
                String uploadPath = uploadDir.toFile().getAbsolutePath();
                
                registry.addResourceHandler("/resumes/**")
                        .addResourceLocations("file:" + uploadPath + "/");
            }
        };
    }
}

