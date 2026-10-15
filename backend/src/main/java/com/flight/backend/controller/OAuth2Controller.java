package com.flight.backend.controller;

import com.flight.backend.model.User;
import com.flight.backend.repository.UserRepository;
import com.flight.backend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
@RestController
@RequestMapping("/oauth2")
@CrossOrigin
public class OAuth2Controller {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public OAuth2Controller(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/success")
    public ResponseEntity<?> oauth2Success(@AuthenticationPrincipal OAuth2User oAuth2User) {
        try {
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            
            // Find or create user
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setName(name != null ? name : email);
                        newUser.setRole(com.flight.backend.model.Role.USER);
                        newUser.setVerified(true); // OAuth2 users are pre-verified
                        newUser.setAuthProvider(com.flight.backend.model.AuthProvider.GOOGLE);
                        return userRepository.save(newUser);
                    });

            // Generate JWT token
            String jwt = jwtUtil.generateToken(user.getEmail());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OAuth2 login successful!",
                "token", jwt,
                "type", "Bearer",
                "user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name(),
                    "verified", user.isVerified(),
                    "authProvider", user.getAuthProvider().name()
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "OAuth2 authentication failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/failure")
    public ResponseEntity<?> oauth2Failure() {
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", "OAuth2 authentication failed"
        ));
    }
}
