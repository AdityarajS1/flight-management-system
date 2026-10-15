package com.flight.backend.service;

import com.flight.backend.model.*;
import com.flight.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final BookingRepository bookingRepository;
    private final FlightRepository flightRepository;
    private final UserRepository userRepository;

    public AdminService(BookingRepository bookingRepository,
                       FlightRepository flightRepository,
                       UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.flightRepository = flightRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        List<Booking> allBookings = bookingRepository.findAll();
        
        long totalBookings = allBookings.size();
        stats.put("totalBookings", totalBookings);
        
        // Total revenue from confirmed bookings only
        List<Booking> confirmedBookings = allBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                .collect(Collectors.toList());
        
        double totalRevenue = confirmedBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        stats.put("totalRevenue", totalRevenue);
        
        // Confirmed bookings count
        long confirmedBookingsCount = confirmedBookings.size();
        stats.put("confirmedBookings", confirmedBookingsCount);
        
        // Cancelled bookings count
        long cancelledBookingsCount = allBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CANCELLED)
                .count();
        stats.put("cancelledBookings", cancelledBookingsCount);
        
        // Total flights
        long totalFlights = flightRepository.count();
        stats.put("totalFlights", totalFlights);
        
        // Total users
        long totalUsers = userRepository.count();
        stats.put("totalUsers", totalUsers);
        
        List<Booking> recentBookings = allBookings.stream()
                .sorted((b1, b2) -> b2.getBookingDate().compareTo(b1.getBookingDate()))
                .limit(10)
                .collect(Collectors.toList());
        stats.put("recentBookings", recentBookings);
        
        Map<String, Long> bookingStatusCount = allBookings.stream()
                .collect(Collectors.groupingBy(
                    booking -> booking.getStatus().toString(),
                    Collectors.counting()
                ));
        stats.put("bookingStatusCount", bookingStatusCount);
        
        Map<String, Double> monthlyRevenue = new LinkedHashMap<>();
        
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i);
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            
            double monthRevenue = confirmedBookings.stream()
                    .filter(booking -> booking.getBookingDate() != null &&
                            booking.getBookingDate().isAfter(monthStart) &&
                            booking.getBookingDate().isBefore(monthEnd))
                    .mapToDouble(Booking::getTotalAmount)
                    .sum();
            
            monthlyRevenue.put(monthStart.getMonth().toString(), monthRevenue);
        }
        stats.put("monthlyRevenue", monthlyRevenue);
        
        Map<String, Long> popularRoutes = allBookings.stream()
                .collect(Collectors.groupingBy(
                    booking -> booking.getFlight().getSource() + " -> " + booking.getFlight().getDestination(),
                    Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    Map.Entry::getValue,
                    (e1, e2) -> e1,
                    LinkedHashMap::new
                ));
        stats.put("popularRoutes", popularRoutes);
        
        List<Map<String, Object>> flightOccupancy = flightRepository.findAll().stream()
                .map(flight -> {
                    long flightConfirmedBookings = allBookings.stream()
                            .filter(b -> b.getFlight().getId() == flight.getId()
                                    && b.getStatus() == BookingStatus.CONFIRMED)
                            .count();
                    Map<String, Object> flightData = new HashMap<>();
                    flightData.put("flightNumber", flight.getFlightNumber());
                    flightData.put("source", flight.getSource());
                    flightData.put("destination", flight.getDestination());
                    flightData.put("totalSeats", flight.getSeatsAvailable() + flightConfirmedBookings);
                    flightData.put("bookedSeats", flightConfirmedBookings);
                    return flightData;
                })
                .collect(Collectors.toList());
        stats.put("flightOccupancy", flightOccupancy);
        
        return stats;
    }

    public List<Map<String, Object>> getAllBookingsWithDetails() {
        return bookingRepository.findAll().stream()
                .map(booking -> {
                    Map<String, Object> bookingData = new HashMap<>();
                    bookingData.put("id", booking.getId());
                    bookingData.put("bookingDate", booking.getBookingDate());
                    bookingData.put("status", booking.getStatus());
                    bookingData.put("totalAmount", booking.getTotalAmount());
                    bookingData.put("cancellationReason", booking.getCancellationReason());
                    bookingData.put("cancellationDate", booking.getCancellationDate());
                    bookingData.put("cancelledBy", booking.getCancelledBy() != null
                            ? booking.getCancelledBy().name() : null);
                    
                    // Flight details
                    Map<String, Object> flightData = new HashMap<>();
                    flightData.put("flightNumber", booking.getFlight().getFlightNumber());
                    flightData.put("source", booking.getFlight().getSource());
                    flightData.put("destination", booking.getFlight().getDestination());
                    flightData.put("departureTime", booking.getFlight().getDepartureTime());
                    flightData.put("arrivalTime", booking.getFlight().getArrivalTime());
                    flightData.put("price", booking.getFlight().getPrice());
                    flightData.put("status", booking.getFlight().getStatus() != null
                            ? booking.getFlight().getStatus().name() : "SCHEDULED");
                    bookingData.put("flight", flightData);
                    
                    // Passenger details
                    Map<String, Object> passengerData = new HashMap<>();
                    passengerData.put("name", booking.getPassenger().getName());
                    passengerData.put("email", booking.getPassenger().getEmail());
                    passengerData.put("phone", booking.getPassenger().getPhone());
                    bookingData.put("passenger", passengerData);
                    
                    // Payment details
                    if (booking.getPayment() != null) {
                        Map<String, Object> paymentData = new HashMap<>();
                        paymentData.put("amount", booking.getPayment().getAmount());
                        paymentData.put("status", booking.getPayment().getStatus());
                        paymentData.put("method", booking.getPayment().getMethod());
                        paymentData.put("paymentDate", booking.getPayment().getPaymentDate());
                        bookingData.put("payment", paymentData);
                    }
                    
                    return bookingData;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getId());
                    userData.put("name", user.getName());
                    userData.put("email", user.getEmail());
                    userData.put("role", user.getRole());
                    userData.put("isVerified", user.isVerified());
                    userData.put("authProvider", user.getAuthProvider());
                    userData.put("createdAt", user.getCreatedAt());
                    
                    // Count user's bookings
                    long userBookings = bookingRepository.findAll().stream()
                            .filter(booking -> booking.getPassenger().getEmail().equals(user.getEmail()))
                            .count();
                    userData.put("bookingCount", userBookings);
                    
                    return userData;
                })
                .collect(Collectors.toList());
    }
}
