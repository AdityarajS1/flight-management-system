package com.flight.backend.controller;

import com.flight.backend.model.User;
import com.flight.backend.service.AuthService;
import com.flight.backend.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> userData) {
        try {
            User registeredUser = authService.registerUser(userData);
            return ResponseEntity.ok(Map.of(
                "message", "User registered successfully. Please check your email for verification.",
                "userId", registeredUser.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> credentials) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");
            Map<String, Object> authResult = authService.authenticateUser(email, password);
            
            if (authResult.containsKey("error")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResult.get("error"),
                    "error", authResult.get("error"),
                    "deactivated", authResult.getOrDefault("deactivated", false),
                    "verified", authResult.getOrDefault("verified", false)
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", authResult.get("token"),
                    "type", authResult.get("type"),
                    "id", authResult.get("id"),
                    "email", authResult.get("email"),
                    "role", authResult.get("role"),
                    "verified", authResult.get("verified")
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate-otp")
    public ResponseEntity<?> generateOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otp = otpService.generateOtp();
            LocalDateTime expiresAt = otpService.getOtpExpirationTime();
            
            authService.updateOtpForUser(email, otp, expiresAt);
            
            // Send OTP email
            authService.sendOtpEmail(email, otp);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent to your email",
                "expiresAt", expiresAt.toString(),
                "otp", otp // For demo purposes - remove in production
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to generate OTP: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String providedOtp = request.get("otp");
            
            User user = authService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User not found"
                ));
            }
            
            if (otpService.isOtpValid(user.getOtp(), providedOtp, user.getOtpExpiresAt())) {
                authService.verifyUserOtp(email);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "OTP verified successfully. Account is now active."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid or expired OTP"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "OTP verification failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/verify/{token}")
    public ResponseEntity<?> verifyEmail(@PathVariable String token) {
        return verifyEmailToken(token);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmailByQuery(@RequestParam String token) {
        return verifyEmailToken(token);
    }

    private ResponseEntity<?> verifyEmailToken(String token) {
        try {
            System.out.println("Verifying email with token: " + token);
            boolean isVerified = authService.verifyEmail(token);
            if (isVerified) {
                System.out.println("Email verification successful for token: " + token);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email verified successfully. You can now login.",
                    "redirectUrl", "http://localhost:8085/login"
                ));
            } else {
                System.out.println("Email verification failed for token: " + token);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid or expired verification token"
                ));
            }
        } catch (Exception e) {
            System.err.println("Email verification error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Email verification failed: " + e.getMessage()
            ));
        }
    }
}
