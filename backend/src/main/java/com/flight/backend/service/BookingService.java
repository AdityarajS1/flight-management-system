package com.flight.backend.service;

import com.flight.backend.model.*;
import com.flight.backend.repository.*;
import com.flight.backend.util.FlightDateTimeUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;
    private final FlightRepository flightRepository;
    private final UserRepository userRepository;
    private final FlightService flightService;

    public BookingService(BookingRepository bookingRepository,
                          PassengerRepository passengerRepository,
                          FlightRepository flightRepository,
                          UserRepository userRepository,
                          FlightService flightService) {
        this.bookingRepository = bookingRepository;
        this.passengerRepository = passengerRepository;
        this.flightRepository = flightRepository;
        this.userRepository = userRepository;
        this.flightService = flightService;
    }

    @Transactional
    public Booking bookTicket(int flightId, Passenger passenger, Integer userId) {
        try {
            Flight flight = flightRepository.findById(flightId)
                    .orElseThrow(() -> new RuntimeException("Flight not found with ID: " + flightId));

            flightService.ensureFlightIsBookable(flight);

            if (flight.getSeatsAvailable() <= 0) {
                throw new RuntimeException("No seats available for this flight");
            }

            if (passenger.getName() == null || passenger.getName().trim().isEmpty()) {
                throw new RuntimeException("Passenger name is required");
            }
            if (passenger.getEmail() == null || passenger.getEmail().trim().isEmpty()) {
                throw new RuntimeException("Passenger email is required");
            }

            if (userId != null) {
                passenger.setUserId(userId);
            }
            Passenger savedPassenger = passengerRepository.save(passenger);

            Booking booking = new Booking();
            booking.setFlight(flight);
            booking.setPassenger(savedPassenger);
            booking.setUserId(userId != null ? userId : passenger.getUserId());
            booking.setBookingDate(LocalDateTime.now());
            booking.setStatus(BookingStatus.CONFIRMED);
            double totalWithTax = Math.round(flight.getPrice() * 1.18 * 100.0) / 100.0;
            booking.setTotalAmount(totalWithTax);

            flight.setSeatsAvailable(flight.getSeatsAvailable() - 1);
            flightRepository.save(flight);

            return bookingRepository.save(booking);

        } catch (Exception e) {
            throw new RuntimeException("Failed to book flight: " + e.getMessage());
        }
    }

    public Booking confirmBooking(int bookingId, String razorpayOrderId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

            if (booking.getStatus() == BookingStatus.CANCELLED) {
                throw new RuntimeException("Cancelled bookings cannot be reconfirmed. Please book a new flight.");
            }

            if (booking.getStatus() == BookingStatus.CONFIRMED) {
                return booking;
            }

            Flight flight = booking.getFlight();
            flightService.ensureFlightIsBookable(flight);
            if (flight.getSeatsAvailable() <= 0) {
                throw new RuntimeException("No seats available for this flight");
            }

            flight.setSeatsAvailable(flight.getSeatsAvailable() - 1);
            flightRepository.save(flight);
            booking.setStatus(BookingStatus.CONFIRMED);

            return bookingRepository.save(booking);

        } catch (Exception e) {
            throw new RuntimeException("Failed to confirm booking: " + e.getMessage());
        }
    }

    @Transactional
    public Booking cancelBooking(int bookingId, String reason, CancelledBy cancelledBy) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

            if (booking.getStatus() == BookingStatus.CANCELLED) {
                throw new RuntimeException("Booking is already cancelled");
            }

            if (booking.getStatus() == BookingStatus.COMPLETED) {
                throw new RuntimeException("Cannot cancel completed booking");
            }

            BookingStatus previousStatus = booking.getStatus();
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancellationReason(reason);
            booking.setCancellationDate(LocalDateTime.now());
            booking.setCancelledBy(cancelledBy);

            if (previousStatus == BookingStatus.CONFIRMED) {
                Flight flight = booking.getFlight();
                flight.setSeatsAvailable(flight.getSeatsAvailable() + 1);
                flightRepository.save(flight);
            }

            return bookingRepository.save(booking);

        } catch (Exception e) {
            throw new RuntimeException("Failed to cancel booking: " + e.getMessage());
        }
    }

    @Transactional
    public Booking cancelBookingByCustomer(int bookingId, int userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        if (booking.getUserId() == null || !Objects.equals(booking.getUserId(), userId)) {
            throw new RuntimeException("You are not authorized to cancel this booking");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only confirmed bookings can be cancelled");
        }

        if (!FlightDateTimeUtil.canCustomerCancel(booking.getFlight().getDepartureTime())) {
            throw new RuntimeException("Cancellation is only allowed until 24 hours before departure");
        }

        return cancelBooking(bookingId, "Cancelled by customer", CancelledBy.CUSTOMER);
    }

    @Transactional
    public Booking cancelBookingByAdmin(int bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        if (!FlightDateTimeUtil.isUpcoming(booking.getFlight().getDepartureTime())) {
            throw new RuntimeException("Cannot modify booking. Flight has already departed.");
        }

        return cancelBooking(bookingId, "Cancelled by admin", CancelledBy.ADMIN);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByUserId(int userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByBookingDateDesc(userId);
        if (!bookings.isEmpty()) {
            return bookings;
        }

        return userRepository.findById(userId)
                .map(user -> bookingRepository.findByPassenger_EmailIgnoreCaseOrderByBookingDateDesc(user.getEmail()))
                .orElse(List.of());
    }

    public Booking getBookingById(int bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));
    }

    public Booking updateBookingStatus(int bookingId, BookingStatus newStatus) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

            BookingStatus previousStatus = booking.getStatus();

            if (previousStatus == BookingStatus.CANCELLED && newStatus == BookingStatus.CONFIRMED) {
                throw new RuntimeException("Cancelled bookings cannot be reconfirmed. Customer must book a new flight.");
            }

            if (previousStatus == BookingStatus.CANCELLED) {
                throw new RuntimeException("Cancelled bookings cannot be modified");
            }

            booking.setStatus(newStatus);

            if (previousStatus == BookingStatus.CONFIRMED && newStatus == BookingStatus.CANCELLED) {
                Flight flight = booking.getFlight();
                flight.setSeatsAvailable(flight.getSeatsAvailable() + 1);
                flightRepository.save(flight);
            }

            return bookingRepository.save(booking);

        } catch (Exception e) {
            throw new RuntimeException("Failed to update booking status: " + e.getMessage());
        }
    }
}
