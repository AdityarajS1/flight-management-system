package com.flight.backend.controller;

import com.flight.backend.model.Booking;
import com.flight.backend.model.BookingStatus;
import com.flight.backend.service.BookingService;
import com.flight.backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/booking-management")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin
public class AdminBookingController {

    private final BookingService bookingService;
    private final AdminService adminService;

    public AdminBookingController(BookingService bookingService, AdminService adminService) {
        this.bookingService = bookingService;
        this.adminService = adminService;
    }

    /**
     * Check if the flight has already departed
     */
    private boolean hasFlightDeparted(String departureTime) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            LocalDateTime flightDeparture = LocalDateTime.parse(departureTime, formatter);
            LocalDateTime now = LocalDateTime.now();
            return now.isAfter(flightDeparture);
        } catch (Exception e) {
            // If we can't parse the date, assume it hasn't departed for safety
            return false;
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings() {
        try {
            List<Booking> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "bookings", bookings
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable int bookingId) {
        try {
            Booking booking = bookingService.getBookingById(bookingId);
            if (booking == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Booking not found"
                ));
            }

            // Check if flight has departed
            if (hasFlightDeparted(booking.getFlight().getDepartureTime())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Cannot modify booking. Flight has already departed."
                ));
            }

            if (booking.getStatus() == BookingStatus.CANCELLED) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Cancelled bookings cannot be reconfirmed. Customer must book a new flight."
                ));
            }

            Booking updatedBooking = bookingService.updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
            Map<String, Object> updatedStats = adminService.getDashboardStats();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Booking confirmed successfully",
                "booking", updatedBooking,
                "stats", updatedStats
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable int bookingId) {
        try {
            Booking booking = bookingService.getBookingById(bookingId);
            if (booking == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Booking not found"
                ));
            }

            // Check if flight has departed
            if (hasFlightDeparted(booking.getFlight().getDepartureTime())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Cannot modify booking. Flight has already departed."
                ));
            }

            Booking updatedBooking = bookingService.cancelBookingByAdmin(bookingId);
            Map<String, Object> updatedStats = adminService.getDashboardStats();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Booking cancelled successfully",
                "booking", updatedBooking,
                "stats", updatedStats
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
