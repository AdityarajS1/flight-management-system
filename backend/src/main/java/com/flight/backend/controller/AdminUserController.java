package com.flight.backend.controller;

import com.flight.backend.model.User;
import com.flight.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/user-management")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "users", users
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{userId}/activate")
    public ResponseEntity<?> activateUser(@PathVariable int userId) {
        try {
            User user = userService.toggleUserStatus(userId, true);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User activated successfully",
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable int userId) {
        try {
            User user = userService.toggleUserStatus(userId, false);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "account is deactivated successful",
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
