package com.flight.backend.controller;

import com.flight.backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats() {
        try {
            Map<String, Object> stats = adminService.getDashboardStats();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", stats
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllBookings() {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "bookings", adminService.getAllBookingsWithDetails()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "users", adminService.getAllUsers()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRevenueStats() {
        try {
            Map<String, Object> dashboardStats = adminService.getDashboardStats();
            Map<String, Object> revenueData = new HashMap<>();
            revenueData.put("totalRevenue", dashboardStats.get("totalRevenue"));
            revenueData.put("monthlyRevenue", dashboardStats.get("monthlyRevenue"));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", revenueData
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAnalytics() {
        try {
            Map<String, Object> dashboardStats = adminService.getDashboardStats();
            Map<String, Object> analyticsData = new HashMap<>();
            analyticsData.put("bookingStatusCount", dashboardStats.get("bookingStatusCount"));
            analyticsData.put("popularRoutes", dashboardStats.get("popularRoutes"));
            analyticsData.put("flightOccupancy", dashboardStats.get("flightOccupancy"));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", analyticsData
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
