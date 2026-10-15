package com.flight.backend.service;

import com.flight.backend.model.User;
import com.flight.backend.repository.UserRepository;
import com.flight.backend.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, 
                     PasswordEncoder passwordEncoder,
                     JwtUtil jwtUtil,
                     AuthenticationManager authenticationManager,
                     EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    public User registerUser(Map<String, Object> userData) {
        // Extract user data from Map
        String name = (String) userData.get("name");
        String email = (String) userData.get("email");
        String password = (String) userData.get("password");
        String phone = (String) userData.get("phone");
        
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }
        
        // Create new user object
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone);
        
        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setAuthProvider(com.flight.backend.model.AuthProvider.LOCAL);

        // Save user
        User savedUser = userRepository.save(user);
        
        // Send verification email
        emailService.sendVerificationEmail(savedUser.getEmail(), verificationToken);
        
        return savedUser;
    }

    public Map<String, Object> authenticateUser(String email, String password) {
        try {
            // Check for admin login using environment variables
            String adminEmail = System.getenv("ADMIN_EMAIL");
            String adminPassword = System.getenv("ADMIN_PASSWORD");
            
            if (adminEmail != null && adminPassword != null && 
                email.equals(adminEmail) && password.equals(adminPassword)) {
                // Create admin user if not exists
                User adminUser = userRepository.findByEmail(email).orElse(null);
                if (adminUser == null) {
                    adminUser = new User();
                    adminUser.setName(System.getenv("ADMIN_NAME"));
                    adminUser.setEmail(email);
                    adminUser.setPassword(passwordEncoder.encode(password));
                    adminUser.setRole(com.flight.backend.model.Role.ADMIN);
                    adminUser.setVerified(true);
                    adminUser.setAuthProvider(com.flight.backend.model.AuthProvider.LOCAL);
                    adminUser = userRepository.save(adminUser);
                }
                
                String jwt = jwtUtil.generateToken(adminUser.getEmail());
                return Map.of(
                        "token", jwt,
                        "type", "Bearer",
                        "id", adminUser.getId(),
                        "email", adminUser.getEmail(),
                        "role", adminUser.getRole().name(),
                        "verified", true
                );
            }
            
            // Normal user authentication
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!user.isVerified()) {
                return Map.of(
                        "error", "Please verify your email before logging in",
                        "verified", false
                );
            }

            if (!user.isActive()) {
                return Map.of(
                        "error", "ur id is deactivated, please try to contact admin",
                        "deactivated", true
                );
            }

            String jwt = jwtUtil.generateToken(user.getEmail());
            
            return Map.of(
                        "token", jwt,
                        "type", "Bearer",
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "role", user.getRole().name(),
                        "verified", true
                );
        } catch (Exception e) {
            return Map.of(
                        "error", "Invalid email or password",
                        "verified", false
                );
        }
    }

    public boolean verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElse(null);
        
        if (user != null) {
            user.setVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);
            return true;
        }
        
        return false;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElse(null);
    }

    public void updateOtpForUser(String email, String otp, LocalDateTime expiresAt) {
        User user = userRepository.findByEmail(email)
                .orElse(null);
        if (user != null) {
            user.setOtp(otp);
            user.setOtpGeneratedAt(LocalDateTime.now());
            user.setOtpExpiresAt(expiresAt);
            userRepository.save(user);
        }
    }

    public void verifyUserOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElse(null);
        if (user != null) {
            user.setVerified(true);
            user.setOtp(null);
            user.setOtpGeneratedAt(null);
            user.setOtpExpiresAt(null);
            userRepository.save(user);
        }
    }

    public void sendOtpEmail(String email, String otp) {
        emailService.sendOtpEmail(email, otp);
    }
}
