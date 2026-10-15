package com.flight.backend.config;

import com.flight.backend.model.AuthProvider;
import com.flight.backend.model.Role;
import com.flight.backend.model.User;
import com.flight.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDataInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void replacesExistingBootstrapAdminPasswordWithConfiguredPassword() throws Exception {
        String email = "admin@example.test";
        String password = "configured-ci-admin-password";
        User existingAdmin = new User();
        existingAdmin.setEmail(email);
        existingAdmin.setPassword("old-password-hash");
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingAdmin));
        when(passwordEncoder.encode(password)).thenReturn("new-password-hash");

        CommandLineRunner initializer = new AdminDataInitializer().seedAdminUser(
                userRepository, passwordEncoder, email, password, "CI Admin");
        initializer.run();

        verify(passwordEncoder).encode(password);
        verify(userRepository).save(existingAdmin);
        org.junit.jupiter.api.Assertions.assertAll(
                () -> org.junit.jupiter.api.Assertions.assertEquals("new-password-hash", existingAdmin.getPassword()),
                () -> org.junit.jupiter.api.Assertions.assertEquals(Role.ADMIN, existingAdmin.getRole()),
                () -> org.junit.jupiter.api.Assertions.assertTrue(existingAdmin.isVerified()),
                () -> org.junit.jupiter.api.Assertions.assertEquals(AuthProvider.LOCAL, existingAdmin.getAuthProvider())
        );
    }

    @Test
    void rejectsShortBootstrapAdminPassword() {
        CommandLineRunner initializer = new AdminDataInitializer().seedAdminUser(
                userRepository, passwordEncoder, "admin@example.test", "short", "CI Admin");

        assertThrows(IllegalStateException.class, initializer::run);
    }
}
