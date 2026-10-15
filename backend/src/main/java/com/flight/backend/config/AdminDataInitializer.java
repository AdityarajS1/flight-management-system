package com.flight.backend.config;

import com.flight.backend.model.AuthProvider;
import com.flight.backend.model.Role;
import com.flight.backend.model.User;
import com.flight.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminDataInitializer {

    @Bean
    public CommandLineRunner seedAdminUser(UserRepository userRepository,
                                           PasswordEncoder passwordEncoder,
                                           @Value("${admin.email:admin@flyhigh.com}") String adminEmail,
                                           @Value("${admin.password}") String adminPassword,
                                           @Value("${admin.name:System Admin}") String adminName) {
        return args -> {
            if (adminPassword.isBlank() || adminPassword.length() < 12) {
                throw new IllegalStateException(
                        "ADMIN_PASSWORD must contain at least 12 characters");
            }

            User admin = userRepository.findByEmail(adminEmail).orElseGet(User::new);
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setVerified(true);
            admin.setAuthProvider(AuthProvider.LOCAL);
            admin.setVerificationToken(null);
            userRepository.save(admin);
        };
    }
}
