package com.flight.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import com.flight.backend.config.JwtConfig;

@SpringBootApplication
@ComponentScan(basePackages = "com.flight.backend")
@EnableConfigurationProperties(JwtConfig.class)
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}