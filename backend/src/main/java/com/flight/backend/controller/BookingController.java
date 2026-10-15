package com.flight.backend.controller;

import com.flight.backend.model.*;
import com.flight.backend.service.BookingService;
import com.flight.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin
public class BookingController {

    private final BookingService bookingService;
    private final PaymentService paymentService;

    public BookingController(BookingService bookingService, PaymentService paymentService) {
        this.bookingService = bookingService;
        this.paymentService = paymentService;
    }

    @PostMapping("/{flightId}")
    public ResponseEntity<?> bookTicket(@PathVariable int flightId, @RequestBody Passenger passenger) {
        try {
            Booking booking = bookingService.bookTicket(flightId, passenger, passenger.getUserId());
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{flightId}/demo")
    public ResponseEntity<?> bookTicketDemo(@PathVariable int flightId, @RequestBody Passenger passenger) {
        try {
            Booking booking = bookingService.bookTicket(flightId, passenger, passenger.getUserId());
            Payment payment = paymentService.createDemoPayment(booking);
            booking.setPayment(payment);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Demo payment completed successfully",
                "booking", booking
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable int bookingId, @RequestBody Map<String, String> request) {
        try {
            String razorpayOrderId = request.get("razorpayOrderId");
            Booking booking = bookingService.confirmBooking(bookingId, razorpayOrderId);
            
            // Create payment record
            paymentService.createPayment(booking, booking.getTotalAmount(), razorpayOrderId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Booking confirmed successfully!",
                "booking", booking
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable int bookingId, @RequestBody Map<String, Object> request) {
        try {
            Object userIdObj = request.get("userId");
            if (userIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "userId is required"
                ));
            }
            int userId = userIdObj instanceof Number
                    ? ((Number) userIdObj).intValue()
                    : Integer.parseInt(userIdObj.toString());

            Booking booking = bookingService.cancelBookingByCustomer(bookingId, userId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Booking cancelled successfully!",
                "booking", booking
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<?> getAllBookings() {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "bookings", bookingService.getAllBookings()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getBookingsByUserId(@PathVariable int userId) {
        try {
            return ResponseEntity.ok(bookingService.getBookingsByUserId(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBookingById(@PathVariable int bookingId) {
        try {
            Booking booking = bookingService.getBookingById(bookingId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "booking", booking
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
