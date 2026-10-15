package com.flight.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin
public class PublicController {
    
    @GetMapping("/info")
    public ResponseEntity<?> publicInfo() {
        return ResponseEntity.ok(Map.of(
            "application", "Flight Management System",
            "description", "Complete flight booking and management system",
            "features", Map.of(
                "authentication", "JWT + OAuth2",
                "payments", "Razorpay integration",
                "email", "SMTP notifications",
                "analytics", "Revenue dashboard"
            )
        ));
    }
}
