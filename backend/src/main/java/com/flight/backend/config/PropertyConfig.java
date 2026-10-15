package com.flight.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties
public class PropertyConfig {
    // This class exists to register custom properties with Spring Boot
    // to eliminate IDE warnings for unknown properties
}
